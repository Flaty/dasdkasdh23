// routes/cdek.js
import dotenv from "dotenv"
dotenv.config()
import express from "express"
import fetch from "node-fetch"

const router = express.Router()

let cachedToken = null
let cachedAt = 0

console.log("🧪 client_id:", process.env.CDEK_CLIENT_ID)
console.log("🧪 client_secret:", process.env.CDEK_CLIENT_SECRET)

async function getCdekToken() {
  const now = Date.now()
  const isExpired = !cachedToken || now - cachedAt > 3500 * 1000 // 58 минут

  if (!isExpired) return cachedToken

  try {
    const params = new URLSearchParams()
    params.append("grant_type", "client_credentials")
    params.append("client_id", process.env.CDEK_CLIENT_ID)
    params.append("client_secret", process.env.CDEK_CLIENT_SECRET)

    const res = await fetch("https://api.cdek.ru/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })

    if (!res.ok) {
      console.error("❌ Ошибка получения токена:", res.status)
      const err = await res.text()
      console.error(err)
      return null
    }

    const data = await res.json()
    cachedToken = data.access_token
    cachedAt = now
    console.log("✅ Получен токен CDEK:", cachedToken.slice(0, 20) + "...")
    return cachedToken
  } catch (err) {
    console.error("🔥 Ошибка в getCdekToken:", err)
    return null
  }
}

router.get("/pvz", async (req, res) => {
  const { city_code } = req.query
  if (!city_code) return res.status(400).json({ error: "city_code обязателен" })

  const token = await getCdekToken()
  if (!token) return res.status(500).json({ error: "Ошибка получения токена" })

  try {
    const response = await fetch(`https://api.cdek.ru/v2/deliverypoints?city_code=${city_code}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("❌ Ошибка CDEK PVZ:", error)
      return res.status(response.status).json({ error: "Ошибка запроса ПВЗ", details: error })
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error("🔥 Ошибка при запросе ПВЗ:", err)
    res.status(500).json({ error: "Ошибка сервера", details: err.message })
  }
})



router.get("/cities", async (req, res) => {
  const { city } = req.query

  if (!city || typeof city !== "string") {
    return res.status(400).json({ error: "Неверный параметр city" })
  }

  const token = await getCdekToken()
  if (!token) return res.status(500).json({ error: "Ошибка получения токена" })

  try {
    const url = `https://api.cdek.ru/v2/location/cities?country_codes=RU&location=${encodeURIComponent(city)}`
    console.log("📍 Запрос городов CDEK:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("❌ Ошибка от CDEK:", response.status, text)
      return res.status(response.status).json({ error: "Ошибка запроса городов", details: text })
    }

    const data = await response.json()

    // 👇 Умная фильтрация
    const query = city.trim().toLowerCase()
    const filtered = data.filter((item) => {
      const full = `${item.city}, ${item.region}`.toLowerCase()
      return item.city.toLowerCase().startsWith(query) || full.startsWith(query)
    })

    res.json(filtered)
  } catch (err) {
    console.error("🔥 Ошибка при запросе городов:", err)
    res.status(500).json({ error: "Ошибка сервера", details: err.message })
  }
})


router.get("/streets", async (req, res) => {
  const { city_code, street } = req.query

  if (!city_code || !street || typeof street !== "string") {
    return res.status(400).json({ error: "Неверные параметры" })
  }

  const token = await getCdekToken()
  if (!token) return res.status(500).json({ error: "Ошибка получения токена" })

  try {
    const url = `https://api.cdek.ru/v2/location/streets?city_code=${city_code}&street=${encodeURIComponent(street)}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("❌ Ошибка при запросе улиц:", response.status, text)
      return res.status(response.status).json({ error: "Ошибка запроса улиц", details: text })
    }

    const data = await response.json()
    const result = data.map((item) => item.name)
    res.json(result)
  } catch (err) {
    console.error("🔥 Ошибка при получении улиц:", err)
    res.status(500).json({ error: "Ошибка сервера", details: err.message })
  }
})


export default router
