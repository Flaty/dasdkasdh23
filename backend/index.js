// backend/index.js
import dotenv from "dotenv";
dotenv.config();

import User from './models/User.js';
import Order from './models/Order.js';
import UserAddress from "./models/UserAddress.js";
import CartItem from "./models/CartItem.js";
import cdekRoutes from "./routes/cdek.js";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import fetch from "node-fetch";
import { Telegraf, Markup } from "telegraf";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// === НАСТРОЙКИ ===
const BOT_TOKEN = process.env.BOT_TOKEN;
const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-for-local-runs';
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN || !MANAGER_CHAT_ID) {
  console.error("❌ BOT_TOKEN или MANAGER_CHAT_ID не указан в .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// === MONGODB ===
mongoose
  .connect(process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/orders")
  .then(() => console.log("✅ MongoDB подключена"))
  .catch((err) => console.error("❌ Ошибка подключения к MongoDB", err));

// === ХЕЛПЕРЫ И БИЗНЕС-ЛОГИКА ===
let cachedRate = null;
let lastFetched = 0;
const TTL = 60 * 60 * 1000;

async function getCnyRate() {
  const now = Date.now();
  if (cachedRate && now - lastFetched < TTL) return cachedRate;
  try {
    const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
    const data = await res.json();
    const cnyValute = data.Valute?.CNY;
    if (!cnyValute?.Value || typeof cnyValute.Value !== 'number') throw new Error("Некорректный формат курса от ЦБ");
    cachedRate = Math.round(((cnyValute.Value / cnyValute.Nominal) + 1) * 100) / 100;
    lastFetched = now;
    console.log(`✅ Курс CNY обновлен: ${cachedRate}`);
    return cachedRate;
  } catch (err) {
    console.error("❌ Ошибка получения курса CNY, используется fallback:", err);
    return 14;
  }
}

function calculateFinalPrice(rawPoizonPrice, shipping, rate) {
  const fixedFee = 590;
  const deliveryFee = shipping === "air" ? 800 : 400;
  return Math.round(Number(rawPoizonPrice) * rate + fixedFee + deliveryFee);
}

function escapeMarkdown(text) {
  if (typeof text !== 'string') return '';
  const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return text.replace(new RegExp(`[${escapeChars.join('\\')}]`, 'g'), '\\$&');
}

const statusLabels = {
  pending: "На проверке", awaiting_payment: "Ожидает оплаты", paid: "Оплачен, выкупается",
  to_warehouse: "Едет на склад", at_warehouse: "На складе", to_moscow: "Едет в Москву",
  in_moscow: "В Москве", shipped_cdek: "Отправлен СДЭК", ready_for_pickup: "Готов к выдаче",
  completed: "Завершен", rejected: "Отклонен",
};

// === MIDDLEWARE ===
app.use(cors());
app.use(bodyParser.json());

const authenticateToken = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    req.user = { userId: 12345, username: 'dev_user' };
    return next();
  }
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// === API ===

// ПУБЛИЧНЫЕ РОУТЫ
app.post("/api/auth/verify", async (req, res) => {
  const { initData } = req.body;
  if (!initData) return res.status(400).json({ error: "initData is required" });

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  const dataCheckString = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');

  try {
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (calculatedHash !== hash) return res.status(401).json({ error: "Invalid hash" });
    
    const user = JSON.parse(params.get('user'));
    await User.findOneAndUpdate({ userId: user.id }, { username: user.username, first_name: user.first_name }, { upsert: true, new: true });
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user });
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(500).json({ error: "Server error during verification" });
  }
});

app.get("/api/rate", async (req, res) => {
  const rate = await getCnyRate();
  res.json({ rate });
});

// РЕГИСТРАЦИЯ ЗАЩИТНОГО MIDDLEWARE
app.use('/api', authenticateToken);

// ЗАЩИЩЕННЫЕ РОУТЫ
app.use("/api/cdek", cdekRoutes);

app.get("/api/orders", async (req, res) => {
  const userId = req.user.userId;
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });
  res.json(orders);
});

app.get("/api/cart", async (req, res) => {
  const userId = req.user.userId;
  const items = await CartItem.find({ userId });
  res.json(items);
});

app.post("/api/cart", async (req, res) => {
  const { link, category, shipping, price } = req.body;
  const userId = req.user.userId;
  if (!userId || !link) return res.status(400).send("Missing data");
  const newItem = new CartItem({ userId, link, category, shipping, price });
  await newItem.save();
  res.json({ success: true });
});

app.delete("/api/cart/:id", async (req, res) => {
  const { id } = req.params;
  await CartItem.findByIdAndDelete(id);
  res.json({ success: true });
});

app.post("/api/user/address", async (req, res) => {
  const { name, phone, city, city_code, street, deliveryType, pickupCode, pickupAddress } = req.body;
  const userId = req.user.userId;
  if (!userId) return res.status(400).json({ error: "userId обязателен" });
  try {
    await UserAddress.findOneAndUpdate({ userId }, { name, phone, city, city_code, street, deliveryType, pickupCode, pickupAddress }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Ошибка сохранения адреса:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/api/user/address", async (req, res) => {
  const userId = req.user.userId;
  try {
    const address = await UserAddress.findOne({ userId });
    res.json(address || {});
  } catch (err) {
    console.error("❌ Ошибка получения адреса:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/api/profile", async (req, res) => {
   const userId = req.user.userId;
   if (!userId) return res.status(401).json({ error: "User not authenticated" });

  try {
    const dbUser = await User.findOneAndUpdate({ userId }, { $setOnInsert: { userId, username: req.user.username } }, { new: true, upsert: true });
    if (!dbUser) return res.status(404).json({ error: "User not found" });
    
    const [lastOrder, allOrders, userAddress] = await Promise.all([
      Order.findOne({ userId }).sort({ createdAt: -1 }),
      Order.find({ userId }),
      UserAddress.findOne({ userId })
    ]);
    
    const registrationDate = dbUser.createdAt;
    const daysInEcosystem = registrationDate ? Math.floor((new Date() - new Date(registrationDate)) / (1000 * 60 * 60 * 24)) : 0;
    const ordersCount = allOrders.length;
    const totalSpent = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);

    let loyalty_status;
    if (ordersCount >= 10) { loyalty_status = { name: "Gold", icon: "🥇", next_status_name: null, orders_to_next_status: 0, progress_percentage: 100, current_cashback_percent: 5, perks: ["+5% кэшбэк", "Приоритетная поддержка", "Эксклюзивные предложения"] }; }
    else if (ordersCount >= 5) { loyalty_status = { name: "Silver", icon: "🥈", next_status_name: "Gold", orders_to_next_status: 10 - ordersCount, progress_percentage: ((ordersCount - 5) / 5) * 100, current_cashback_percent: 2, perks: ["+2% кэшбэк", "Ранний доступ к скидкам"] }; }
    else { loyalty_status = { name: "Bronze", icon: "🥉", next_status_name: "Silver", orders_to_next_status: 5 - ordersCount, progress_percentage: (ordersCount / 5) * 100, current_cashback_percent: 0, perks: ["Базовый доступ к заказам"] }; }
    const achievements = [
      { id: "first_purchase", name: "Первая покупка", icon: "🍆", is_completed: ordersCount > 0 },
      { id: "five_orders", name: "5 заказов", icon: "🔥", is_completed: ordersCount >= 5 },
      { id: "spent_30k", name: "30k+ потрачено", icon: "🧾", is_completed: totalSpent >= 30000 }
    ];

    const botUsername = bot.botInfo?.username || 'your_bot'; 
    const profileData = {
      days_in_ecosystem: daysInEcosystem, loyalty_status,
      last_order: lastOrder ? { id: lastOrder.id, category: lastOrder.category, price: lastOrder.price, currency: "RUB", status: lastOrder.status, created_at: lastOrder.createdAt } : null,
      achievements, address: userAddress,
      referral_info: { link: `https://t.me/${botUsername}?start=ref${userId}`, is_active: true, bonus_per_friend: 500 }
    };

    res.json(profileData);
  } catch (err) {
    console.error(`❌ Ошибка получения профиля для userId=${userId}:`, err);
    res.status(500).json({ error: "Ошибка на сервере при сборке профиля" });
  }
});

app.post("/api/order", async (req, res) => {
    const { rawPoizonPrice, shipping, link, category, address } = req.body; 
    const { userId, username } = req.user;

    if (!rawPoizonPrice || !shipping || !link || !category || !address) {
      return res.status(400).json({ error: "Отсутствуют обязательные поля" });
    }
    try {
      const currentRate = await getCnyRate();
      const finalPrice = calculateFinalPrice(rawPoizonPrice, shipping, currentRate);
      
      const savedOrder = await new Order({
        id: Date.now().toString(), userId, username, price: finalPrice, rawPoizonPrice,
        category, shipping, link, status: "pending", deliveryType: address.deliveryType,
        city: address.city, street: address.street, fullName: address.name,
        phone: address.phone, pickupCode: address.pickupCode, pickupAddress: address.pickupAddress,
      }).save();

      const orderIdForCallback = savedOrder._id.toString();
      const safeUsername = escapeMarkdown(username || 'unknown');
      const safeLink = escapeMarkdown(link);
      const safeCategory = escapeMarkdown(category);
      const safeShipping = escapeMarkdown(shipping);
      const safeCity = escapeMarkdown(address.city);
      const safePickupAddress = escapeMarkdown(address.pickupAddress);
      const safeStreet = escapeMarkdown(address.street);
      const safeName = escapeMarkdown(address.name);
      const safePhone = escapeMarkdown(address.phone);

      let addressBlock = '';
      if (address.deliveryType === 'pickup') {
        addressBlock = `📍 *Доставка в ПВЗ:*\n` + `Город: ${safeCity}\n` + `Пункт: ${safePickupAddress}\n` + `Получатель: ${safeName}, ${safePhone}`;
      } else {
        addressBlock = `🚚 *Доставка курьером:*\n` + `Город: ${safeCity}\n` + `Адрес: ${safeStreet}\n` + `Получатель: ${safeName}, ${safePhone}`;
      }
      const messageText = `📦 *Новый заказ:*\n\n` + `👤 Пользователь: @${safeUsername}\n` + `📎 Ссылка: ${safeLink}\n` + `📂 Категория: ${safeCategory}\n` + `✈️ Доставка: ${escapeMarkdown(shipping)}\n` + `💰 *Итоговая цена: ${finalPrice}₽*\n` + `🆔 ID: ${escapeMarkdown(savedOrder.id)}\n\n` + `${addressBlock}\n\n` + `*Текущий статус: На проверке*`;

      const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('Ожидает оплаты', `status_awaiting_payment_${orderIdForCallback}`)],
          [Markup.button.callback('Оплачен', `status_paid_${orderIdForCallback}`)],
          [Markup.button.callback('Едет на склад', `status_to_warehouse_${orderIdForCallback}`)],
          [Markup.button.callback('На складе', `status_at_warehouse_${orderIdForCallback}`)],
          [Markup.button.callback('Едет в Москву', `status_to_moscow_${orderIdForCallback}`)],
          [Markup.button.callback('В Москве', `status_in_moscow_${orderIdForCallback}`)],
          [Markup.button.callback('Отправлен СДЭК', `status_shipped_cdek_${orderIdForCallback}`)],
          [Markup.button.callback('Готов к выдаче', `status_ready_for_pickup_${orderIdForCallback}`)],
          [
              Markup.button.callback('✅ Завершить', `status_completed_${orderIdForCallback}`),
              Markup.button.callback('❌ Отклонить', `status_rejected_${orderIdForCallback}`)
          ]
      ]);

      await bot.telegram.sendMessage(MANAGER_CHAT_ID, messageText, { parse_mode: 'MarkdownV2', ...keyboard });
      res.json({ success: true, id: savedOrder.id, calculatedPrice: finalPrice });
    } catch (err) {
      console.error("❌ Ошибка создания заказа:", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// === TELEGRAM BOT ===
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
      console.error('Ошибка обработки колбэка:', err);
      ctx.answerCbQuery('❗️ Ошибка на сервере');
  }
});

// === ЗАПУСК ===
async function startServer() {
  try {
    // 1. Получаем инфо о боте
    console.log("ℹ️ Получаем информацию о боте...");
    bot.botInfo = await bot.telegram.getMe();
    console.log(`✅ Информация о боте получена: @${bot.botInfo.username}`);
    
    // 2. Устанавливаем кнопку меню
    if (WEBAPP_URL) {
      console.log(`🚀 Устанавливаем кнопку меню с URL: ${WEBAPP_URL}`);
      await bot.telegram.setChatMenuButton({ menu_button: { type: "web_app", text: "Открыть магазин", web_app: { url: WEBAPP_URL } } });
      console.log("✅ Chat Menu Button успешно установлен");
    } else {
      console.warn("⚠️ WEBAPP_URL не указан в .env! Кнопка меню не будет установлена.");
    }
    
    // 3. Запускаем Express сервер
    app.listen(3001, () => {
      console.log("🚀 Сервер запущен на http://localhost:3001");
      
      // 4. И ТОЛЬКО ПОСЛЕ ЭТОГО запускаем бота в режиме поллинга
      console.log("🤖 Запускаем бота...");
      bot.launch();
    });

  } catch (err) {
    console.error("❌ Критическая ошибка запуска:", err);
  }
}

// Вызываем функцию запуска
startServer();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));