// backend/routes/cart.js

import express from 'express';
import CartItem from '../models/CartItem.js'; // Используем модель CartItem

export default function createCartRouter({ logger }) {
  const router = express.Router();

  // GET /api/cart - Получить все элементы корзины пользователя
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const items = await CartItem.find({ userId });
      res.json(items);
    } catch (err) {
      logger.error({ err, userId }, "Ошибка получения корзины");
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // POST /api/cart - Добавить новый элемент в корзину
  router.post('/', async (req, res) => {
    try {
      const { link, category, shipping, price } = req.body;
      const userId = req.user.userId;

      if (!userId || !link) {
        return res.status(400).json({ error: "Отсутствуют обязательные поля userId или link" });
      }

      const newItem = new CartItem({ userId, link, category, shipping, price });
      await newItem.save();
      
      res.status(201).json({ success: true, item: newItem });
    } catch (err) {
      logger.error({ err }, "Ошибка добавления товара в корзину");
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // DELETE /api/cart/:id - Удалить элемент из корзины по его _id
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId; // Для безопасности, убедимся, что юзер удаляет свой товар

      const result = await CartItem.findOneAndDelete({ _id: id, userId: userId });

      if (!result) {
        // Если ничего не найдено, значит либо ID неверный, либо юзер пытается удалить чужой товар
        return res.status(404).json({ error: "Элемент корзины не найден или у вас нет прав на его удаление" });
      }

      res.json({ success: true });
    } catch (err) {
      logger.error({ err, itemId: req.params.id }, "Ошибка удаления товара из корзины");
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  return router;
}