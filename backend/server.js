// backend/server.js
import mongoose from "mongoose";
import app, { bot, logger } from './app.js'; // Импортируем готовое приложение

// Импорты для логики бота
import Order from './models/Order.js'; 
import { Markup } from 'telegraf';
import { statusLabels, escapeMarkdown } from './utils/botHelpers.js'; // Предположим, ты вынесешь хелперы сюда

// --- Проверка переменных ---
const { MANAGER_CHAT_ID, WEBAPP_URL, JWT_SECRET, DATABASE_URL, PORT = 3001 } = process.env;

if (!JWT_SECRET || !bot.token || !MANAGER_CHAT_ID) {
  logger.error("❌ Критически важные переменные не установлены в .env!");
  process.exit(1);
}

// --- Подключение к БД ---
mongoose.connect(DATABASE_URL || "mongodb://127.0.0.1:27017/orders")
  .then(() => logger.info("✅ MongoDB подключена"))
  .catch((err) => logger.error({ err }, "❌ Ошибка подключения к MongoDB"));
mongoose.connection.on('error', err => logger.error({ err }, '❌ Ошибка соединения с MongoDB'));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB отключена.'));


// --- Логика Telegram Bot ---
// (Логика бота остается здесь, так как она тесно связана с жизненным циклом сервера)
bot.command('start', (ctx) => {
  if (!WEBAPP_URL) return ctx.reply('Извините, магазин временно недоступен.');
  ctx.reply('Добро пожаловать!', Markup.inlineKeyboard([Markup.button.webApp('🛍️ Открыть магазин', WEBAPP_URL)]));
});
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (!data.startsWith('status_')) return ctx.answerCbQuery();
  const parts = data.split("_");
  const orderId = parts[parts.length - 1]; 
  const newStatus = parts.slice(1, -1).join('_');

  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return ctx.answerCbQuery('❗️ Ошибка: Неверный ID заказа');
    const order = await Order.findById(orderId);
    if (!order) return ctx.answerCbQuery("❌ Заказ не найден в базе");
    order.status = newStatus;
    await order.save();
    const originalText = ctx.callbackQuery.message.text;
    const updatedText = originalText.replace(/\*Текущий статус:.*$/, `*Текущий статус: ${escapeMarkdown(statusLabels[newStatus] || newStatus)}*`);
    if (updatedText !== originalText) {
        await ctx.editMessageText(updatedText, { parse_mode: 'MarkdownV2', ...ctx.callbackQuery.message.reply_markup });
    }
    ctx.answerCbQuery(`✅ Статус: ${statusLabels[newStatus]}`);
  } catch (err) {
      logger.error({ err }, 'Ошибка обработки колбэка');
      ctx.answerCbQuery('❗️ Ошибка на сервере');
  }
});


// --- Запуск сервера и Graceful Shutdown ---
// === 6. ОБРАБОТЧИКИ ОШИБОК И GRACEFUL SHUTDOWN ===

let server;
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  // 1. Останавливаем бота, чтобы он не принимал новые сообщения
  bot.stop(signal);
  
  // 2. Закрываем сервер, чтобы он не принимал новые HTTP запросы
  if (server) {
    server.close(async () => {
      logger.info('✅ HTTP сервер закрыт');
      
      // 3. После закрытия сервера отключаемся от базы
      await mongoose.connection.close(false);
      logger.info('✅ Соединение с MongoDB закрыто');
      
      // 4. Выходим из процесса
      process.exit(0);
    });
  } else {
    // Если сервер еще не запустился, просто выходим
    process.exit(0);
  }
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// === 7. ЗАПУСК ===
async function startServer() {
  try {
    logger.info("ℹ️ Получаем информацию о боте...");
    bot.botInfo = await bot.telegram.getMe();
    logger.info(`✅ Информация о боте получена: @${bot.botInfo.username}`);
    
    if (WEBAPP_URL) {
      await bot.telegram.setChatMenuButton({ menu_button: { type: "web_app", text: "Открыть магазин", web_app: { url: WEBAPP_URL } } });
      logger.info("✅ Chat Menu Button успешно установлен");
    }
    
    server = app.listen(3001, () => {
      logger.info("🚀 Сервер запущен на http://localhost:3001");
      logger.info("🤖 Запускаем бота...");
      bot.launch();
    });
  } catch (err) {
    logger.error({ err }, "❌ Критическая ошибка запуска");
    process.exit(1);
  }
}

startServer();