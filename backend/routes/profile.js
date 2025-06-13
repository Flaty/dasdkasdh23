// backend/routes/profile.js

import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import UserAddress from '../models/UserAddress.js';

export default function createProfileRouter({ bot, logger }) {
  const router = express.Router();

  // GET /api/profile
  router.get('/', async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
      // Этот кейс почти невозможен из-за authenticateToken, но это хорошая практика
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      // Находим или создаем пользователя
      const dbUser = await User.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, username: req.user.username } },
        { new: true, upsert: true }
      );

      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Параллельно запрашиваем все связанные данные
      const [lastOrder, allOrders, userAddress] = await Promise.all([
        Order.findOne({ userId }).sort({ createdAt: -1 }),
        Order.find({ userId }),
        UserAddress.findOne({ userId })
      ]);
      
      // --- Расчеты и бизнес-логика ---
      const registrationDate = dbUser.createdAt;
      const daysInEcosystem = registrationDate ? Math.floor((new Date() - new Date(registrationDate)) / (1000 * 60 * 60 * 24)) : 0;
      const ordersCount = allOrders.length;
      const totalSpent = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);

      // Логика статуса лояльности
      let loyalty_status;
      if (ordersCount >= 10) {
        loyalty_status = { name: "Gold", icon: "🥇", next_status_name: null, orders_to_next_status: 0, progress_percentage: 100, current_cashback_percent: 5, perks: ["+5% кэшбэк", "Приоритетная поддержка", "Эксклюзивные предложения"] };
      } else if (ordersCount >= 5) {
        loyalty_status = { name: "Silver", icon: "🥈", next_status_name: "Gold", orders_to_next_status: 10 - ordersCount, progress_percentage: ((ordersCount - 5) / 5) * 100, current_cashback_percent: 2, perks: ["+2% кэшбэк", "Ранний доступ к скидкам"] };
      } else {
        loyalty_status = { name: "Bronze", icon: "🥉", next_status_name: "Silver", orders_to_next_status: 5 - ordersCount, progress_percentage: (ordersCount / 5) * 100, current_cashback_percent: 0, perks: ["Базовый доступ к заказам"] };
      }
      
      // Логика достижений
      const achievements = [
        { id: "first_purchase", name: "Первая покупка", icon: "🍆", is_completed: ordersCount > 0 },
        { id: "five_orders", name: "5 заказов", icon: "🔥", is_completed: ordersCount >= 5 },
        { id: "spent_30k", name: "30k+ потрачено", icon: "🧾", is_completed: totalSpent >= 30000 }
      ];

      // Информация для реферальной ссылки
      const botUsername = bot.botInfo?.username || 'your_bot'; 
      
      // Сборка финального объекта
      const profileData = {
        days_in_ecosystem: daysInEcosystem,
        loyalty_status,
        last_order: lastOrder ? lastOrder.toObject() : null,
        achievements,
        address: userAddress,
        referral_info: { 
          link: `https://t.me/${botUsername}?start=ref${userId}`, 
          is_active: true, 
          bonus_per_friend: 500 
        }
      };

      res.json(profileData);

    } catch (err) {
      logger.error({ err, userId }, "Ошибка получения профиля");
      res.status(500).json({ error: "Ошибка на сервере при сборке профиля" });
    }
  });

  return router;
}