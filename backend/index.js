// index.js
import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import UserAddress from "./models/UserAddress.js"


import fetch from "node-fetch"
import { Telegraf } from "telegraf"

import cdekRoutes from "./routes/cdek.js"
import CartItem from "./models/CartItem.js"


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
  mongoose.connect("mongodb://127.0.0.1:27017/orders")
  .then(() => console.log("✅ MongoDB подключена"))
  .catch((err) => console.error("❌ Ошибка подключения к MongoDB", err))

// === СХЕМА ЗАКАЗА ===
const orderSchema = new mongoose.Schema({
  id: String,
  userId: Number,
  username: String,
  link: String,
  category: String,
  shipping: String,
  price: Number,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "to-warehouse", "to-moscow"],
    default: "pending",
  },
  createdAt: { type: String },
})
const Order = mongoose.model("Order", orderSchema)

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
function calculateFinalPrice(rawPoizonPrice, shipping, rate = 92) {
  const fixedFee = 590
  const deliveryFee = shipping === "Авиа" ? 800 : 400
  return Math.round(rawPoizonPrice * rate + fixedFee + deliveryFee)
}

// === СОХРАНЕНИЕ АДРЕСА ПОЛЬЗОВАТЕЛЯ ===
app.post("/api/user/address", async (req, res) => {
  const {
    userId,
    name,
    phone,
    city,
    city_code,
    street,
    deliveryType,
    pickupCode,
    pickupAddress,
  } = req.body

  if (!userId) return res.status(400).json({ error: "userId обязателен" })

  try {
    const existing = await UserAddress.findOne({ userId })

    if (existing) {
  await UserAddress.updateOne(
    { userId },
    { name, phone, city, city_code, street, deliveryType, pickupCode, pickupAddress }
  )
} else {
  await new UserAddress({
    userId,
    name,
    phone,
    city,
    city_code,
    street,
    deliveryType,
    pickupCode,
    pickupAddress,
  }).save()
}

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


app.post("/api/order", async (req, res) => {
  const { userId, username, rawPoizonPrice, shipping, link, category } = req.body

  if (!rawPoizonPrice || !shipping || !link || !category) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  const finalPrice = calculateFinalPrice(rawPoizonPrice, shipping)
  const id = Date.now().toString()
  const createdAt = new Date().toISOString()

  const order = new Order({
    id,
    userId,
    username,
    price: finalPrice,
    category,
    shipping,
    link,
    status: "pending",
    createdAt,
  })

  try {
    await order.save()

    await bot.telegram.sendMessage(
      MANAGER_CHAT_ID,
      `📦 Новый заказ:\n\n👤 Пользователь: @${username}\n📎 Ссылка: ${link}\n📂 Категория: ${category}\n🚚 Доставка: ${shipping}\n💰 Цена: ${finalPrice}₽\n🆔 ID: ${id}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Принять", callback_data: `accept_${id}` },
              { text: "❌ Отклонить", callback_data: `reject_${id}` },
            ],
          ],
        },
      }
    )

    res.json({ success: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})

// === CALLBACK ===
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data
  const [action, id] = data.split("_")

  const order = await Order.findOne({ id })
  if (!order) return ctx.answerCbQuery("❌ Заказ не найден")

  if (action === "accept") {
    order.status = "approved"
    await ctx.editMessageText(`✅ Заказ принят:\nID: ${id}\nПользователь: @${order.username}`)
  } else if (action === "reject") {
    order.status = "rejected"
    await ctx.editMessageText(`❌ Заказ отклонён:\nID: ${id}\nПользователь: @${order.username}`)
  }

  await order.save()
  ctx.answerCbQuery()
})

// === ЗАПУСК ===
bot.launch()
console.log("🤖 Бот запущен")
app.listen(3001, () => console.log("🚀 Сервер на http://localhost:3001"))
