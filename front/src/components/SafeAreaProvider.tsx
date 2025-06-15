// src/components/SafeAreaProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const SafeAreaContext = createContext<SafeAreaInsets>({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export const useSafeArea = () => useContext(SafeAreaContext);

// Функция для определения safe area
function detectSafeArea(): SafeAreaInsets {
  // Сначала пробуем получить из CSS env()
  const computedStyle = getComputedStyle(document.documentElement);
  
  const envTop = computedStyle.getPropertyValue('--sat') || 
    computedStyle.paddingTop || '0px';
  const envBottom = computedStyle.getPropertyValue('--sab') || 
    computedStyle.paddingBottom || '0px';
    
  let top = parseInt(envTop) || 0;
  let bottom = parseInt(envBottom) || 0;
  
  // Если env() не сработал, определяем по user agent и размерам экрана
  if (top === 0) {
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isIPad = /iPad/.test(navigator.userAgent);
    const isIOS = isIPhone || isIPad;
    
    if (isIOS) {
      const screenHeight = window.screen.height;
      const screenWidth = window.screen.width;
      
      // iPhone X и новее (с челкой)
      const iPhoneXSeries = isIPhone && (
        // iPhone X, XS, 11 Pro
        (screenWidth === 375 && screenHeight === 812) ||
        // iPhone XS Max, XR, 11, 11 Pro Max
        (screenWidth === 414 && screenHeight === 896) ||
        // iPhone 12, 12 Pro, 13, 13 Pro, 14, 14 Pro
        (screenWidth === 390 && screenHeight === 844) ||
        // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
        (screenWidth === 428 && screenHeight === 926) ||
        // iPhone 14 Pro, 15 Pro
        (screenWidth === 393 && screenHeight === 852) ||
        // iPhone 14 Pro Max, 15 Pro Max
        (screenWidth === 430 && screenHeight === 932)
      );
      
      if (iPhoneXSeries) {
        // Стандартные значения для iPhone с челкой
        top = 44; // Стандартная высота safe area сверху
        bottom = 34; // Стандартная высота safe area снизу
      }
    }
  }
  
  // Дополнительная проверка через Telegram WebApp API
  const tg = window.Telegram?.WebApp as any;
  if (tg) {
    const viewportHeight = tg.viewportHeight;
    const viewportStableHeight = tg.viewportStableHeight;
    
    // Если есть разница, значит есть safe area
    if (viewportHeight && viewportStableHeight && viewportHeight !== viewportStableHeight) {
      const diff = viewportStableHeight - viewportHeight;
      if (diff > 0 && top === 0) {
        top = Math.min(diff, 50); // Ограничиваем максимальное значение
      }
    }
  }
  
  return { top, bottom, left: 0, right: 0 };
}

export function SafeAreaProvider({ children }: { children: ReactNode }) {
  const [insets, setInsets] = useState<SafeAreaInsets>(detectSafeArea());
  
  useEffect(() => {
    // Обновляем при изменении размера viewport
    const updateInsets = () => {
      setInsets(detectSafeArea());
    };
    
    // Слушаем изменения viewport в Telegram
    const tg = window.Telegram?.WebApp as any;
    if (tg && tg.onEvent) {
      tg.onEvent('viewportChanged', updateInsets);
    }
    
    // Также слушаем resize
    window.addEventListener('resize', updateInsets);
    
    // Пробуем обновить через небольшую задержку (для случаев медленной инициализации)
    const timer = setTimeout(updateInsets, 100);
    
    return () => {
      if (tg && tg.offEvent) {
        tg.offEvent('viewportChanged', updateInsets);
      }
      window.removeEventListener('resize', updateInsets);
      clearTimeout(timer);
    };
  }, []);
  
  // Добавляем CSS переменные для использования в стилях
  useEffect(() => {
    document.documentElement.style.setProperty('--safe-area-top', `${insets.top}px`);
    document.documentElement.style.setProperty('--safe-area-bottom', `${insets.bottom}px`);
    document.documentElement.style.setProperty('--safe-area-left', `${insets.left}px`);
    document.documentElement.style.setProperty('--safe-area-right', `${insets.right}px`);
  }, [insets]);
  
  return (
    <SafeAreaContext.Provider value={insets}>
      {children}
    </SafeAreaContext.Provider>
  );
}