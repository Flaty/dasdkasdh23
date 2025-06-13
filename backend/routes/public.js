// backend/routes/public.js

import express from 'express';
import fetch from 'node-fetch';

let cachedRate = null;
let lastFetched = 0;
const TTL = process.env.CACHE_TTL_MS || 3600000;

async function getCnyRate(logger) {
    const now = Date.now();
    if (cachedRate && now - lastFetched < TTL) return cachedRate;
    try {
        const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
        const data = await res.json();
        const cnyValute = data.Valute?.CNY;
        if (!cnyValute?.Value || typeof cnyValute.Value !== 'number') throw new Error("Некорректный формат курса от ЦБ");
        cachedRate = Math.round(((cnyValute.Value / cnyValute.Nominal) + 1) * 100) / 100;
        lastFetched = now;
        logger.info(`✅ Курс CNY обновлен: ${cachedRate}`);
        return cachedRate;
    } catch (err) {
        logger.error({ err }, "❌ Ошибка получения курса CNY, используется fallback");
        return 14;
    }
}

export default function createPublicRouter({ logger }) {
  const router = express.Router();

  // GET /api/rate
  router.get('/rate', async (req, res) => {
    const rate = await getCnyRate(logger);
    res.json({ rate });
  });

  return router;
}