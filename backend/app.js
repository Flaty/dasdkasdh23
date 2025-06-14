// backend/app.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Telegraf } from "telegraf";
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import * as Sentry from "@sentry/node";

import { createAuthRouter, createAuthMiddleware } from './routes/auth.js';
import createOrderRouter from './routes/orders.js';
import createProfileRouter from './routes/profile.js';
import createCartRouter from './routes/cart.js';
import createCdekRouter from './routes/cdek.js';
import createUserRouter from './routes/user.js';
import createPublicRouter from './routes/public.js';

// --- Инициализация ---
export const logger = pino({ transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined });
export const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

Sentry.init({
  dsn: "https://c35ae6540be8f236e231007f854e84eb@o4509492849606656.ingest.us.sentry.io/4509492857929728",
  tracesSampleRate: 1.0, profilesSampleRate: 1.0,
});

// --- Middleware ---
app.use(cors({ origin: process.env.WEBAPP_URL, credentials: true }));
app.use(bodyParser.json());
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "Слишком много запросов." }
}));

// --- Роуты ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const authMiddleware = createAuthMiddleware({ logger });
const authRoutes = createAuthRouter({ logger });
const orderRoutes = createOrderRouter({ bot, logger });
const profileRoutes = createProfileRouter({ bot, logger });
const cartRoutes = createCartRouter({ logger });
const cdekRoutes = createCdekRouter({ logger });
const userRoutes = createUserRouter({ logger });
const publicRoutes = createPublicRouter({ logger });

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);

app.use('/api', authMiddleware);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/cdek', cdekRoutes);
app.use('/api/user', userRoutes);

// Экспортируем app для использования в server.js и тестах
export default app;