// index.js
import dotenv from "dotenv"
dotenv.config()

import User from './models/User.js';
import Order from './models/Order.js';
import UserAddress from "./models/UserAddress.js"
import CartItem from "./models/CartItem.js"

import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import fetch from "node-fetch"
import { Telegraf, Markup } from "telegraf"

import cdekRoutes from "./routes/cdek.js"

// === НАСТРОЙКИ ===
const BOT_TOKEN = process.env.BOT_TOKEN
const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID

if (!BOT_TOKEN || !MANAGER_CHAT_ID) {
  console.error("❌ BOT_TOKEN или MANAGER_CHAT_ID не указан в .env")
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
const app = express()

// === MONGODB ===
mongoose
  .connect("mongodb://127.0.0.1:27017/orders")
  .then(() => console.log("✅ MongoDB подключена"))
  .catch((err) => console.error("❌ Ошибка подключения к MongoDB", err))

// === ХЕЛПЕРЫ ===
function escapeMarkdown(text) {
  if (typeof text !== 'string') return '';
  const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return text.replace(new RegExp(`[${escapeChars.join('\\')}]`, 'g'), '\\$&');
}

const statusLabels = {
  pending: "На проверке",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен, выкупается",
  to_warehouse: "Едет на склад",
  at_warehouse: "На складе",
  to_moscow: "Едет в Москву",
  in_moscow: "В Москве",
  shipped_cdek: "Отправлен СДЭК",
  ready_for_pickup: "Готов к выдаче",
  completed: "Завершен",
  rejected: "Отклонен",
};

// === MIDDLEWARE ===
app.use(cors())
app.use(bodyParser.json())

// === API ===
app.use("/api/cdek", cdekRoutes)

app.get("/api/orders", async (req, res) => {
  const userId = parseInt(req.query.userId)
  if (!userId) return res.status(400).json({ error: "userId required" })

  const orders = await Order.find({ userId }).sort({ createdAt: -1 })
  res.json(orders)
})

// === КЭШ КУРСА ===
let cachedRate = null
let lastFetched = 0
const TTL = 60 * 60 * 1000

async function fetchCnyRateFromCBR() {
  const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js")
  const data = await res.json()
  const raw = data.Valute?.CNY?.Value
  if (!raw || typeof raw !== "number") throw new Error("Некорректный курс")
  return Math.round((raw + 1) * 100) / 100
}

app.get("/api/rate", async (req, res) => {
  const now = Date.now()
  if (!cachedRate || now - lastFetched > TTL) {
    try {
      cachedRate = await fetchCnyRateFromCBR()
      lastFetched = now
    } catch (err) {
      console.error("❌ Ошибка при обновлении курса:", err)
      return res.json({ rate: 14 }) // fallback
    }
  }
  res.json({ rate: cachedRate })
})

// === КОРЗИНА ===
app.get("/api/cart", async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).send("No userId")

  const items = await CartItem.find({ userId })
  res.json(items)
})

app.post("/api/cart", async (req, res) => {
  const { userId, link, category, shipping, price } = req.body
  if (!userId || !link) return res.status(400).send("Missing data")

  const newItem = new CartItem({ userId, link, category, shipping, price })
  await newItem.save()
  res.json({ success: true })
})

app.delete("/api/cart/:id", async (req, res) => {
  const { id } = req.params
  await CartItem.findByIdAndDelete(id)
  res.json({ success: true })
})

// === ЗАКАЗ ===
function calculateFinalPrice(rawPoizonPrice, shipping, rate = 14) {
  const fixedFee = 590
  const deliveryFee = shipping === "air" ? 800 : 400
  return Math.round(rawPoizonPrice * rate + fixedFee + deliveryFee)
}

// === СОХРАНЕНИЕ АДРЕСА ПОЛЬЗОВАТЕЛЯ ===
app.post("/api/user/address", async (req, res) => {
  const {
    userId, name, phone, city, city_code,
    street, deliveryType, pickupCode, pickupAddress,
  } = req.body

  if (!userId) return res.status(400).json({ error: "userId обязателен" })

  try {
    await UserAddress.findOneAndUpdate(
      { userId },
      { name, phone, city, city_code, street, deliveryType, pickupCode, pickupAddress },
      { upsert: true, new: true } // upsert: true создает документ, если он не найден
    );
    res.json({ success: true })
  } catch (err) {
    console.error("❌ Ошибка сохранения адреса:", err)
    res.status(500).json({ error: "Ошибка сервера" })
  }
})

// === ПОЛУЧЕНИЕ АДРЕСА ПОЛЬЗОВАТЕЛЯ ===
app.get("/api/user/address", async (req, res) => {
  const userId = parseInt(req.query.userId)
  if (!userId) return res.status(400).json({ error: "userId обязателен" })

  try {
    const address = await UserAddress.findOne({ userId })
    res.json(address || {})
  } catch (err) {
    console.error("❌ Ошибка получения адреса:", err)
    res.status(500).json({ error: "Ошибка сервера" })
  }
})

// === ПОЛУЧЕНИЕ ДАННЫХ ДЛЯ СТРАНИЦЫ ПРОФИЛЯ ===
app.get("/api/profile", async (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const [lastOrder, allOrders, userAddress, dbUser] = await Promise.all([
      Order.findOne({ userId }).sort({ createdAt: -1 }),
      Order.find({ userId }),
      UserAddress.findOne({ userId }),
      User.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { new: true, upsert: true })
    ]);

    const registrationDate = dbUser.createdAt;
    const daysInEcosystem = Math.floor((new Date() - new Date(registrationDate)) / (1000 * 60 * 60 * 24));

    const ordersCount = allOrders.length;
    const totalSpent = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);

    let loyalty_status;
    if (ordersCount >= 10) {
      loyalty_status = { name: "Gold", icon: "🥇", next_status_name: null, orders_to_next_status: 0, progress_percentage: 100, current_cashback_percent: 5, perks: ["+5% кэшбэк", "Приоритетная поддержка", "Эксклюзивные предложения"] };
    } else if (ordersCount >= 5) {
      loyalty_status = { name: "Silver", icon: "🥈", next_status_name: "Gold", orders_to_next_status: 10 - ordersCount, progress_percentage: ((ordersCount - 5) / 5) * 100, current_cashback_percent: 2, perks: ["+2% кэшбэк", "Ранний доступ к скидкам"] };
    } else {
      loyalty_status = { name: "Bronze", icon: "🥉", next_status_name: "Silver", orders_to_next_status: 5 - ordersCount, progress_percentage: (ordersCount / 5) * 100, current_cashback_percent: 0, perks: ["Базовый доступ к заказам"] };
    }

    const achievements = [
      { id: "first_purchase", name: "Первая покупка", icon: "🍆", is_completed: ordersCount > 0 },
      { id: "five_orders", name: "5 заказов", icon: "🔥", is_completed: ordersCount >= 5 },
      { id: "spent_30k", name: "30k+ потрачено", icon: "🧾", is_completed: totalSpent >= 30000 }
    ];

    const profileData = {
      days_in_ecosystem: daysInEcosystem,
      loyalty_status: loyalty_status,
      last_order: lastOrder ? { id: lastOrder.id, name: lastOrder.category, price: lastOrder.price, currency: "RUB",status: lastOrder.status, created_at: lastOrder.createdAt } : null,
      achievements: achievements,
      address: userAddress,
      referral_info: { link: `https://t.me/your_bot?start=ref${userId}`, is_active: true, bonus_per_friend: 500 }
    };

    res.json(profileData);
  } catch (err) {
    console.error(`❌ Ошибка получения профиля для userId=${userId}:`, err);
    res.status(500).json({ error: "Ошибка на сервере при сборке профиля" });
  }
});

app.post("/api/order", async (req, res) => {
  const { userId, username, rawPoizonPrice, shipping, link, category, address } = req.body;

  if (!rawPoizonPrice || !shipping || !link || !category || !address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const finalPrice = calculateFinalPrice(rawPoizonPrice, shipping, cachedRate || 14);

  const order = new Order({
    id: Date.now().toString(),
    userId, username, price: finalPrice, category, shipping, link, status: "pending",
    deliveryType: address.deliveryType, city: address.city, street: address.street,
    fullName: address.name, phone: address.phone, pickupCode: address.pickupCode,
    pickupAddress: address.pickupAddress,
  });

  try {
    const savedOrder = await order.save(); // Сохраняем и получаем _id
    const orderIdForCallback = savedOrder._id.toString(); // Используем реальный _id

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

    const messageText = `📦 *Новый заказ:*\n\n` + `👤 Пользователь: @${safeUsername}\n` + `📎 Ссылка: ${safeLink}\n` + `📂 Категория: ${safeCategory}\n` + `✈️ Доставка: ${escapeMarkdown(shipping)}\n` + `💰 Цена: ${finalPrice}₽\n` + `🆔 ID: ${escapeMarkdown(savedOrder.id)}\n\n` + `${addressBlock}\n\n` + `*Текущий статус: На проверке*`;

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

    await bot.telegram.sendMessage(
      MANAGER_CHAT_ID,
      messageText,
      {
        parse_mode: 'MarkdownV2',
        ...keyboard
      }
    );

    res.json({ success: true, id: savedOrder.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || 'Внутренняя ошибка сервера' });
  }
});

// === CALLBACK ===
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (!data.startsWith('status_')) return ctx.answerCbQuery();

  // ✅ ФИКС ЗДЕСЬ: Правильно разбираем callback_data
  const parts = data.split("_");
  
  // Последний элемент - это всегда ID
  const orderId = parts[parts.length - 1]; 
  
  // Все, что между 'status' и ID - это наш статус
  const newStatus = parts.slice(1, -1).join('_');

  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        console.error(`Невалидный ObjectId: ${orderId} из callback_data: ${data}`);
        return ctx.answerCbQuery('❗️ Ошибка: Неверный ID заказа');
    }
      
    const order = await Order.findById(orderId);
    if (!order) return ctx.answerCbQuery("❌ Заказ не найден в базе");

    order.status = newStatus;
    await order.save();

    const originalText = ctx.callbackQuery.message.text;
    const updatedText = originalText.replace(/\*Текущий статус:.*$/, `*Текущий статус: ${escapeMarkdown(statusLabels[newStatus] || newStatus)}*`);

    // Проверяем, изменился ли текст, чтобы не отправлять лишний запрос
    if (updatedText !== originalText) {
        await ctx.editMessageText(updatedText, {
            parse_mode: 'MarkdownV2',
            ...ctx.callbackQuery.message.reply_markup
        });
    }

    ctx.answerCbQuery(`✅ Статус: ${statusLabels[newStatus]}`);
  } catch (err) {
      console.error('Ошибка обработки колбэка:', err);
      ctx.answerCbQuery('❗️ Ошибка на сервере');
  }
});

// === ЗАПУСК ===
bot.launch();
console.log("🤖 Бот запущен");
app.listen(3001, () => console.log("🚀 Сервер на http://localhost:3001"));