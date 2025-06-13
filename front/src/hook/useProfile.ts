// src/hooks/useProfile.ts

import { useQuery } from '@tanstack/react-query';
import { getUserData } from '../utils/user';
import { getJSON } from '../api/fetchWithAuth';

// Описываем типы данных, которые приходят с нашего нового эндпоинта /api/profile
// Это наш "контракт" с бэкендом. Он гарантирует, что мы не опечатаемся в названиях полей.
export interface ProfileData {
    days_in_ecosystem: number;
  loyalty_status: {
    name: string;
    icon: string;
    next_status_name: string | null;
    orders_to_next_status: number;
    progress_percentage: number;
    current_cashback_percent: number;
    perks: string[];
  };
  last_order: {
    id: string;
    category: string;
    price: number;
    currency: string;
    status: string;
    created_at: string;
  } | null;
  achievements: {
    id: string;
    category: string;
    icon: string;
    is_completed: boolean;
  }[];
  address_preview: string;
  referral_info: {
    link: string;
    is_active: boolean;
    bonus_per_friend: number;
  };
}

// Эта функция будет делать сам запрос к API
// Она должна быть асинхронной и возвращать данные или кидать ошибку
const fetchProfile = async (userId: number): Promise<ProfileData> => {
  // ✅ Используем getJSON. Токен добавится автоматически.
  return getJSON<ProfileData>(`/api/profile`); 
};



// Наш главный кастомный хук, который мы будем использовать в компоненте
export function useProfile() {
  const user = getUserData();
  const userId = user?.id;

  // useQuery - это сердце React Query. Он принимает:
  // 1. queryKey: Уникальный ключ. Если ключ не меняется, данные берутся из кеша.
  // 2. queryFn: Функция, которая делает запрос.
  // 3. options: Дополнительные настройки.
  return useQuery<ProfileData>({
    // Ключ - это массив. Первый элемент - название запроса, второй - зависимость.
    // Если userId поменяется, React Query автоматически сделает новый запрос.
    queryKey: ['profile', userId],
    
    // Передаем саму функцию запроса.
    // React Query сам вызовет ее с нужными параметрами.
    queryFn: () => fetchProfile(userId!),
    
    // Опция `enabled` - это предохранитель.
    // Запрос не будет выполнен, пока `userId` не будет определен (true).
    // Это спасает от запроса `/api/profile?userId=undefined` при первом рендере.
    enabled: !!userId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}