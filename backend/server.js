// backend/server.js
import mongoose from "mongoose";
import app, { bot, logger } from './app.js';

import Order from './models/Order.js';
import { Markup } from 'telegraf';
import { statusLabels, escapeMarkdown } from './utils/botHelpers.js';

const { MANAGER_CHAT_ID, WEBAPP_URL, JWT_SECRET, DATABASE_URL, PORT = 3001 } = process.env;

if (!JWT_SECRET || !bot.token || !MANAGER_CHAT_ID) {
  logger.error("❌ Критически важные переменные не установлены в .env!");
  process.exit(1);
}

mongoose.connect(DATABASE_URL || "mongodb://127.0.0.1:27017/orders")
  .then(() => logger.info("✅ MongoDB подключена"))
  .catch((err) => logger.error({ err }, "❌ Ошибка подключения к MongoDB"));
mongoose.connection.on('error', err => logger.error({ err }, '❌ Ошибка соединения с MongoDB'));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB отключена.'));


// --- Логика Telegram Bot ---

// 🔥🔥🔥 ВОТ ОН, ФИНАЛЬНЫЙ ФИКС 🔥🔥🔥
bot.command('start', (ctx) => {
  if (!WEBAPP_URL) {
    return ctx.reply('Извините, магазин временно недоступен.');
  }
  // Просто приветствуем пользователя и даем инструкцию.
  // Никаких лишних кнопок, которые вызывают шторку.
  ctx.reply(
    '<b>Добро пожаловать!</b>\n\nЧтобы открыть магазин, нажмите на кнопку "Открыть магазин" в меню.',
    { parse_mode: 'HTML' }
  );
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
let server;
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  bot.stop(signal);
  if (server) {
    server.close(async () => {
      logger.info('✅ HTTP сервер закрыт');
      await mongoose.connection.close(false);
      logger.info('✅ Соединение с MongoDB закрыто');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function startServer() {
  try {
    logger.info("ℹ️ Получаем информацию о боте...");
    bot.botInfo = await bot.telegram.getMe();
    logger.info(`✅ Информация о боте получена: @${bot.botInfo.username}`);
    
    
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