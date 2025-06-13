// backend/index.test.js
import { test, expect } from 'vitest';
import supertest from 'supertest';
import app from './index.js'; // Тебе нужно будет немного рефакторить index.js, чтобы экспортировать app

test('GET /health should return status ok', async () => {
  const response = await supertest(app).get('/health');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
});