// src/hook/useUnpaidOrder.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';

export function useUnpaidOrder() {
  const [unpaidOrderId, setUnpaidOrderId] = useState<string | null>(() => {
    return localStorage.getItem('unpaidOrderId');
  });

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'unpaidOrderId') {
        setUnpaidOrderId(event.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const clearUnpaidOrder = useCallback(() => {
    const oldId = localStorage.getItem('unpaidOrderId');
    if (oldId) {
      localStorage.removeItem('unpaidOrderId');
      localStorage.removeItem('bannerDismissedUntil');
      setUnpaidOrderId(null);
      window.dispatchEvent(new StorageEvent('storage', { key: 'unpaidOrderId', oldValue: oldId, newValue: null }));
    }
  }, []);

  const checkOrderStatus = useCallback(async () => {
    const currentOrderId = localStorage.getItem('unpaidOrderId');
    if (!currentOrderId) {
      return;
    }

    try {
      // 🔥🔥🔥 ГЛАВНЫЙ ФИКС ЗДЕСЬ 🔥🔥🔥
      // Мы добавляем опцию { cache: 'no-store' }, чтобы браузер НИКОГДА не кэшировал этот запрос.
      const response = await fetchWithAuth(`/api/order/${currentOrderId}/status`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          clearUnpaidOrder();
        }
        return;
      }

      const { status } = await response.json();
      
      // Эта логика у тебя правильная.
      if (status !== 'pending' && status !== 'awaiting_payment') {
        clearUnpaidOrder();
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  }, [clearUnpaidOrder]);

  return { unpaidOrderId, clearUnpaidOrder, checkOrderStatus };
}