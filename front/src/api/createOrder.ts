// api/createOrder.ts

import { fetchWithAuth } from './fetchWithAuth';
import type { CreateOrderPayload } from "../utils/types";

export async function createOrder(payload: CreateOrderPayload) {
  const res = await fetchWithAuth("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Не удалось создать заказ' }));
    throw new Error(errorData.message);
  }

  // Получаем данные из ответа
  const orderData = await res.json();

  // 🔥🔥🔥 ГЛАВНЫЙ ФИКС ЗДЕСЬ 🔥🔥🔥
  // Если бэкенд вернул ID, сохраняем его в localStorage.
  if (orderData && orderData.id) {
    localStorage.setItem('unpaidOrderId', orderData.id);
    localStorage.setItem('unpaidOrderStatus', 'awaiting_payment'); // И статус тоже, для надежности
    // Очищаем таймер скрытия баннера, если он был
    localStorage.removeItem('bannerDismissedUntil'); 
  }

  // Возвращаем данные дальше, как и раньше
  return orderData;
}