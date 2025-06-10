// src/api/address.ts
import type { UserAddress } from "../hook/useAddress"

export async function postAddress(data: UserAddress) {
  const res = await fetch("/api/user/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error("❌ Ошибка при сохранении:", text)
    throw new Error("Ошибка при сохранении адреса")
  }

  return true
}
