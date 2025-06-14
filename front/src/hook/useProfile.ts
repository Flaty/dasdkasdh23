// src/hook/useProfile.ts

import { useQuery } from '@tanstack/react-query';
import { getUserData } from '../utils/user';
import { getJSON } from '../api/fetchWithAuth';
// ✅ 1. ИМПОРТИРУЕМ НАШИ ЕДИНЫЕ, ПРАВИЛЬНЫЕ ТИПЫ
import type { ProfileData } from '../utils/types'; // ✅ Сначала импортируем
export type { ProfileData };   

// ❌ 2. УДАЛЯЕМ СТАРОЕ, НЕПРАВИЛЬНОЕ ОПРЕДЕЛЕНИЕ INTERFACE PROFILEDATA ОТСЮДА

// ✅ 3. ФУНКЦИЯ ОСТАЕТСЯ ПРОСТОЙ И ЧИСТОЙ. УДАЛЯЕМ НЕИСПОЛЬЗУЕМЫЙ userId
const fetchProfile = async (): Promise<ProfileData> => {
  return getJSON<ProfileData>('/api/profile'); 
};

// Наш главный кастомный хук, который мы будем использовать в компоненте
export function useProfile() {
  const user = getUserData();
  const userId = user?.id;

  return useQuery<ProfileData>({
    queryKey: ['profile', userId],
    // ✅ 4. ПЕРЕДАЕМ АНОНИМНУЮ ФУНКЦИЮ, КОТОРАЯ ВЫЗЫВАЕТ НАШ fetchProfile
    queryFn: () => fetchProfile(),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 секунд
    refetchInterval: 1000 * 60, // 1 минута
  });
}