// src/hooks/useRate.ts
import { useQuery } from '@tanstack/react-query';

interface RateData {
    rate: number;
}

const fetchRate = async (): Promise<RateData> => {
    // Используем прокси, который мы настроили в vite.config.ts
    const response = await fetch('/api/rate');
    if (!response.ok) {
        throw new Error('Не удалось загрузить курс');
    }
    return response.json();
};

export function useRate() {
    return useQuery<RateData>({
        queryKey: ['cnyRate'], // Уникальный ключ для кеша
        queryFn: fetchRate,
        // Кешируем курс на 1 час. TanStack Query сам будет следить за временем.
        staleTime: 1000 * 60 * 60, 
        // Если запрос упал, не пытаться повторить его 100 раз.
        retry: 1,
        // Не делать повторный запрос при фокусе окна, для курса это не нужно.
        refetchOnWindowFocus: false, 
    });
}