const RATE_STORAGE_KEY = "cny_rate_cache";

interface CachedRate {
  rate: number;
  timestamp: number;
}

export async function getCnyRateWithFee(): Promise<number> {
  const cacheStr = localStorage.getItem(RATE_STORAGE_KEY);
  const now = Date.now();

  // Используем кэш, если не старше 12 часов
  if (cacheStr) {
    try {
      const cache: CachedRate = JSON.parse(cacheStr);
      if (now - cache.timestamp < 12 * 60 * 60 * 1000) {
        return cache.rate;
      }
    } catch {
      // игнорируем ошибки
    }
  }

  try {
    const res = await fetch("http://localhost:3001/api/rate");
    const data = await res.json();

    if (!data?.rate || typeof data.rate !== "number") {
      throw new Error("Неверный ответ от API");
    }

    const finalRate = data.rate;

    localStorage.setItem(
      RATE_STORAGE_KEY,
      JSON.stringify({ rate: finalRate, timestamp: now })
    );

    return finalRate;
  } catch (e) {
    console.error("Ошибка получения курса:", e);
    return 14; // fallback
  }
}
