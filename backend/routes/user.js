// backend/routes/user.js

import express from 'express';
import UserAddress from '../models/UserAddress.js';

export default function createUserRouter({ logger }) {
  const router = express.Router();

  // POST /api/user/address - Сохранить/обновить адрес
  router.post('/address', async (req, res) => {
    try {
      const { name, phone, city, city_code, street, deliveryType, pickupCode, pickupAddress } = req.body;
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({ error: "userId обязателен" });
      }
      
      await UserAddress.findOneAndUpdate(
        { userId },
        { name, phone, city, city_code, street, deliveryType, pickupCode, pickupAddress },
        { upsert: true }
      );
      res.json({ success: true });
    } catch (err) {
      logger.error({ err, userId }, "❌ Ошибка сохранения адреса");
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // GET /api/user/address - Получить адрес
  router.get('/address', async (req, res) => {
    try {
      const userId = req.user.userId;
      const address = await UserAddress.findOne({ userId });
      res.json(address || {});
    } catch (err) {
      logger.error({ err, userId }, "❌ Ошибка получения адреса");
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  return router;
}