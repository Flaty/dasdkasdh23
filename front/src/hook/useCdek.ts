// src/hook/useCdek.ts

import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../api/fetchWithAuth'; // ✅ Используем наш авторизованный fetch на всякий случай

// --- Типы данных ---
export interface SuggestedCity {
  city: string;
  region: string;
  // ✅ ГЛАВНЫЙ ФИКС №1: Код города - это число
  code: number;
}

export interface PickupPoint {
  code: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// --- Функции для запросов ---
const fetchCities = async (query: string): Promise<SuggestedCity[]> => {
  if (!query) return [];
  // Используем fetchWithAuth, это хорошая практика
  const response = await fetchWithAuth(`/api/cdek/cities?city=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Ошибка поиска городов');
  return response.json();
};

// ✅ ГЛАВНЫЙ ФИКС №2: Функция принимает cityCode как число
const fetchPickupPoints = async (cityCode: number): Promise<PickupPoint[]> => {
  if (!cityCode) return [];
  const response = await fetchWithAuth(`/api/cdek/pvz?city_code=${cityCode}`);
  if (!response.ok) throw new Error('Ошибка загрузки ПВЗ');
  return response.json();
};


// --- Хуки ---
export function useCitySuggestions(query: string) {
  return useQuery({
    queryKey: ['cdek_cities', query],
    queryFn: () => fetchCities(query),
    enabled: !!query,
    staleTime: 1000 * 60 * 5,
  });
}

// ✅ ГЛАВНЫЙ ФИКС №3: Хук принимает cityCode как число
export function usePickupPoints(cityCode: number) {
  return useQuery({
    queryKey: ['cdek_pvz', cityCode],
    queryFn: () => fetchPickupPoints(cityCode),
    // Запрос активен только если cityCode - валидное число больше 0
    enabled: !!cityCode && cityCode > 0,
    staleTime: 1000 * 60 * 10,
  });
}