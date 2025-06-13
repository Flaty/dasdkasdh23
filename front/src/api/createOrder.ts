// api/createOrder.ts

import { fetchWithAuth } from './fetchWithAuth'; // ✅ Импортируем
import type { CreateOrderPayload } from "../utils/types";

export async function createOrder(payload: CreateOrderPayload) {
  // ✅ Используем fetchWithAuth
  const res = await fetchWithAuth("/api/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Не удалось создать заказ' }));
    throw new Error(errorData.message);
  }

  return await res.json();
}