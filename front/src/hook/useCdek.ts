// src/hooks/useCdek.ts
import { useQuery } from '@tanstack/react-query';

// --- Типы данных ---
export interface SuggestedCity {
  city: string;
  region: string;
  code: string;
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
  const response = await fetch(`/api/cdek/cities?city=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Ошибка поиска городов');
  return response.json();
};

const fetchPickupPoints = async (cityCode: string): Promise<PickupPoint[]> => {
  if (!cityCode) return [];
  const response = await fetch(`/api/cdek/pvz?city_code=${cityCode}`);
  if (!response.ok) throw new Error('Ошибка загрузки ПВЗ');
  return response.json();
};


// --- Хуки ---
export function useCitySuggestions(query: string) {
  return useQuery({
    queryKey: ['cdek_cities', query],
    queryFn: () => fetchCities(query),
    enabled: !!query, // Запрос активен только когда есть поисковый запрос
    staleTime: 1000 * 60 * 5, // Кешируем результаты на 5 минут
  });
}

export function usePickupPoints(cityCode: string) {
  return useQuery({
    queryKey: ['cdek_pvz', cityCode],
    queryFn: () => fetchPickupPoints(cityCode),
    enabled: !!cityCode, // Запрос активен только когда выбран код города
    staleTime: 1000 * 60 * 10, // Кешируем ПВЗ на 10 минут
  });
}