// api/createOrder.ts

import type { CreateOrderPayload } from "../utils/types";

export async function createOrder(payload: CreateOrderPayload) {
  const res = await fetch("http://localhost:3001/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Не удалось создать заказ");
  }

  return await res.json(); // вернёт { success: true, id }
}
