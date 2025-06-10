// src/hooks/useAddress.ts
import { useEffect, useState } from "react"

export interface UserAddress {
  userId: number
  city: string
  city_code: string
  street: string
  name: string
  phone: string
  deliveryType: "pickup" | "address"
  pickupCode?: string
  pickupAddress?: string
}

const DEFAULT_ADDRESS: UserAddress = {
  userId: 0,
  city: "",
  city_code: "",
  street: "",
  name: "",
  phone: "",
  deliveryType: "pickup",
  pickupCode: "",
  pickupAddress: "",
}

export function useAddress(userId: number | undefined) {
  const [serverAddress, setServerAddress] = useState<UserAddress>(DEFAULT_ADDRESS)
  const [localDraft, setLocalDraft] = useState<UserAddress>(DEFAULT_ADDRESS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    fetch(`/api/user/address?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const clean = {
          userId,
          city: data.city || "",
          city_code: data.city_code?.toString() || "",
          street: data.street || "",
          name: data.name || "",
          phone: data.phone || "",
          deliveryType: data.deliveryType === "address" ? "address" : "pickup",
          pickupCode: data.pickupCode || "",
          pickupAddress: data.pickupAddress || "",
        }
        setServerAddress(clean)
        setLocalDraft(clean)
        setLoading(false)
      })
      .catch((err) => {
        console.error("❌ Ошибка загрузки адреса:", err)
        setError("Ошибка загрузки адреса")
        setLoading(false)
      })
  }, [userId])

  const saveAddress = async () => {
    if (!localDraft || !userId) return false
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localDraft),
      })
      if (!res.ok) throw new Error("Ошибка сохранения адреса")
      setServerAddress(localDraft) // 🧠 теперь мы точно знаем, что это "сохранено"
      return true
    } catch (err) {
      console.error("❌ Ошибка при сохранении адреса:", err)
      setError("Ошибка при сохранении")
      return false
    }
  }

  return {
    address: localDraft,
    setAddress: setLocalDraft,
    loading,
    error,
    saveAddress,
    serverAddress,
  }
}
