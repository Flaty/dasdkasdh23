// backend/routes/auth.js

import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

// --- Роутер для верификации и логина ---

export function createAuthRouter({ logger }) {
  const router = express.Router();

  // POST /api/auth/verify
  router.post('/verify', async (req, res) => {
    const { initData } = req.body;
    if (!initData) {
      return res.status(400).json({ error: "initData is required" });
    }

    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      params.delete('hash');
      
      // Сортируем ключи и создаем строку для проверки
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      // Хешируем токен бота для получения секретного ключа
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
      
      // Хешируем строку данных с секретным ключом
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      // Сравниваем хеши
      if (calculatedHash !== hash) {
        logger.warn({ remoteIp: req.ip }, "Попытка входа с невалидным хешем");
        return res.status(401).json({ error: "Invalid hash" });
      }
      
      const user = JSON.parse(params.get('user'));
      
      // Находим или создаем пользователя в нашей базе
      await User.findOneAndUpdate(
        { userId: user.id }, 
        { username: user.username, first_name: user.first_name }, 
        { upsert: true, new: true }
      );
      
      // Создаем наш собственный JWT токен для авторизации на бэкенде
      const token = jwt.sign(
        { userId: user.id, username: user.username }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      res.json({ token, user });

    } catch (error) {
      logger.error({ error }, "Критическая ошибка при верификации пользователя");
      res.status(500).json({ error: "Server error during verification" });
    }
  });

  return router;
}


// --- Middleware для защиты роутов ---

export function createAuthMiddleware({ logger }) {
  return (req, res, next) => {
    // В режиме разработки пропускаем проверку для удобства
    if (process.env.NODE_ENV !== 'production') {
      req.user = { userId: 12345, username: 'dev_user' };
      return next();
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) {
      return res.sendStatus(401); // Unauthorized
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn({ err, remoteIp: req.ip }, "Использован невалидный JWT токен");
        return res.sendStatus(403); // Forbidden
      }
      req.user = user;
      next();
    });
  };
}