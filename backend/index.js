// backend/index.js
import dotenv from "dotenv";
dotenv.config();

// --- Библиотеки ---
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { Telegraf } from "telegraf";
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import * as Sentry from "@sentry/node";

// --- Наши модули ---
import { createAuthRouter, createAuthMiddleware } from './routes/auth.js';
import createOrderRouter from './routes/orders.js';
import createProfileRouter from './routes/profile.js';
import createCartRouter from './routes/cart.js';
import createCdekRouter from './routes/cdek.js';
import createUserRouter from './routes/user.js';     // 🔥 ИМПОРТ НОВОГО РОУТЕРА
import createPublicRouter from './routes/public.js'; // 🔥 ИМПОРТ НОВОГО РОУТЕРА

// === 1. НАСТРОЙКИ И ИНИЦИАЛИЗАЦИЯ ===
const logger = pino({ transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined });
const { BOT_TOKEN, MANAGER_CHAT_ID, WEBAPP_URL, JWT_SECRET, DATABASE_URL } = process.env;

if (!JWT_SECRET || !BOT_TOKEN || !MANAGER_CHAT_ID) {
  logger.error("❌ Критически важные переменные не установлены в .env!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

Sentry.init({
  dsn: "https://c35ae6540be8f236e231007f854e84eb@o4509492849606656.ingest.us.sentry.io/4509492857929728",
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// === 2. ГЛОБАЛЬНЫЕ MIDDLEWARE ===
app.use(cors({ origin: WEBAPP_URL, credentials: true }));
app.use(bodyParser.json());
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "Слишком много запросов." }
}));

// === 3. ПОДКЛЮЧЕНИЕ К БАЗЕ ===
mongoose.connect(DATABASE_URL || "mongodb://127.0.0.1:27017/orders")
  .then(() => logger.info("✅ MongoDB подключена"))
  .catch((err) => logger.error({ err }, "❌ Ошибка подключения к MongoDB"));
mongoose.connection.on('error', err => logger.error({ err }, '❌ Ошибка соединения с MongoDB'));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB отключена.'));

// === 4. РОУТЫ ===
app.get('/health', (req, res) => res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

const authMiddleware = createAuthMiddleware({ logger });
const authRoutes = createAuthRouter({ logger });
const orderRoutes = createOrderRouter({ bot, logger });
const profileRoutes = createProfileRouter({ bot, logger });
const cartRoutes = createCartRouter({ logger });
const cdekRoutes = createCdekRouter({ logger });
const userRoutes = createUserRouter({ logger });       // 🔥 СОЗДАНИЕ НОВОГО РОУТЕРА
const publicRoutes = createPublicRouter({ logger });   // 🔥 СОЗДАНИЕ НОВОГО РОУТЕРА

// --- Публичные API роуты (не требуют токена) ---
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes); // Для /api/rate

// --- Защищенные API роуты (требуют токен) ---
app.use('/api', authMiddleware);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/cdek', cdekRoutes);
app.use('/api/user', userRoutes); // Для /api/user/address

// === 5. TELEGRAM BOT ===
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