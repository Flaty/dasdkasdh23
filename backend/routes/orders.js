// backend/routes/orders.js

import express from 'express';
import fetch from 'node-fetch';
import { customAlphabet } from 'nanoid';
import { Markup } from 'telegraf';
import Order from '../models/Order.js';

// --- Локальные хелперы, которые нужны только здесь ---

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generatePublicId = customAlphabet(ALPHABET, 7);

let cachedRate = null;
let lastFetched = 0;
const TTL = 60 * 60 * 1000; // 1 час

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
    return cachedRate;
  } catch (err) {
    // В случае ошибки, можно добавить логирование через Sentry или pino, если они будут переданы
    return 14; // fallback
  }
}

function calculateFinalPrice(rawPoizonPrice, shipping, rate) {
  const fixedFee = process.env.PRICE_FIXED_FEE_RUB || 590;
  const deliveryFee = shipping === "air" ? (process.env.PRICE_DELIVERY_AIR_RUB || 800) : (process.env.PRICE_DELIVERY_STD_RUB || 400);
  return Math.round(Number(rawPoizonPrice) * rate + Number(fixedFee) + Number(deliveryFee));
}

function escapeMarkdown(text) {
  if (typeof text !== 'string') return '';
  const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return text.replace(new RegExp(`[${escapeChars.join('\\')}]`, 'g'), '\\$&');
}

// --- Основная функция, создающая роутер ---

// Мы экспортируем функцию, которая принимает зависимости (bot, logger) и возвращает готовый роутер.
// Это называется Dependency Injection и является очень хорошей практикой.
export default function createOrderRouter({ bot, logger }) {
  const router = express.Router();

  // GET /api/orders - Получить все заказы пользователя
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      logger.error({ err }, "Ошибка получения списка заказов");
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // GET /api/orders/:id/status - Проверить статус одного заказа
  router.get('/:id/status', async (req, res) => {
    const { id } = req.params; 
    const { userId } = req.user;
    try {
      const order = await Order.findOne({ publicId: id, userId: userId }, 'status');
      if (!order) return res.status(404).json({ error: "Заказ не найден" });
      res.json({ status: order.status });
    } catch (err) {
      logger.error({ err, publicId: id }, "Ошибка проверки статуса заказа");
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // POST /api/orders - Создать новый заказ
  router.post('/', async (req, res) => {
    const { rawPoizonPrice, shipping, link, category, address } = req.body;
    const { userId, username } = req.user;

    if (!rawPoizonPrice || !shipping || !link || !category || !address) {
      return res.status(400).json({ error: "Отсутствуют обязательные поля" });
    }

    try {
      const currentRate = await getCnyRate();
      const finalPrice = calculateFinalPrice(rawPoizonPrice, shipping, currentRate);
      const newPublicId = generatePublicId();

      const savedOrder = await new Order({
        publicId: newPublicId,
        userId, username, price: finalPrice, rawPoizonPrice, category, shipping, link,
        status: "pending",
        deliveryType: address.deliveryType,
        city: address.city, street: address.street, fullName: address.name, phone: address.phone,
        pickupCode: address.pickupCode, pickupAddress: address.pickupAddress,
      }).save();

      const orderIdForCallback = savedOrder._id.toString();
      const safeUsername = escapeMarkdown(username || 'unknown');
      let addressBlock = address.deliveryType === 'pickup'
        ? `📍 *Доставка в ПВЗ:*\nГород: ${escapeMarkdown(address.city)}\nПункт: ${escapeMarkdown(address.pickupAddress)}\nПолучатель: ${escapeMarkdown(address.name)}, ${escapeMarkdown(address.phone)}`
        : `🚚 *Доставка курьером:*\nГород: ${escapeMarkdown(address.city)}\nАдрес: ${escapeMarkdown(address.street)}\nПолучатель: ${escapeMarkdown(address.name)}, ${escapeMarkdown(address.phone)}`;

      const messageText = `📦 *Новый заказ:*\n\n` +
        `👤 Пользователь: @${safeUsername}\n` +
        `📎 Ссылка: ${escapeMarkdown(link)}\n` +
        `📂 Категория: ${escapeMarkdown(category)}\n` +
        `✈️ Доставка: ${escapeMarkdown(shipping)}\n` +
        `💰 *Итоговая цена: ${finalPrice}₽*\n` +
        `🆔 ID: ${escapeMarkdown(savedOrder.publicId)}\n\n` +
        `${addressBlock}\n\n` +
        `*Текущий статус: На проверке*`;
      
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

      await bot.telegram.sendMessage(process.env.MANAGER_CHAT_ID, messageText, { parse_mode: 'MarkdownV2', ...keyboard });
      res.status(201).json({ success: true, id: savedOrder.publicId, calculatedPrice: finalPrice });

    } catch (err) {
      logger.error({ err }, "Ошибка создания заказа");
      if (err.code === 11000) {
        return res.status(500).json({ success: false, error: "Ошибка генерации ID заказа, попробуйте еще раз." });
      }
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  return router;
}