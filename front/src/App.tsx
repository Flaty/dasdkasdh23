// src/App.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ C ТИПАМИ
import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import { setUserData, clearUserData } from './utils/user';
import Calc from "./pages/Calc";
import Profile from "./pages/Profile";
import OrdersPage from "./pages/OrdersPage";
import TabBarLayout from "./layouts/TabBarLayout";

// Расширяем типы для новых методов
interface ExtendedWebApp {
  isExpanded: boolean;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      allows_write_to_pm?: boolean;
      photo_url?: string;
    };
    start_param?: string;
  };
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  enableVerticalSwipes(): void;
  disableVerticalSwipes(): void;
  viewportHeight: number;
  viewportStableHeight: number;
  onEvent(eventType: string, callback: () => void): void;
  offEvent(eventType: string, callback: () => void): void;
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  openTelegramLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: ExtendedWebApp;
    };
  }
}

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', backgroundColor: '#0f0f10' }}>
    Загрузка...
  </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
   <div style={{ padding: '2rem', textAlign: 'center', color: 'white', backgroundColor: '#a00', fontFamily: 'sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Произошла ошибка</h1>
      <p style={{ marginTop: '1rem', lineHeight: '1.5' }}>{message}</p>
    </div>
  </div>
);

/**
 * Ожидает инициализации Telegram WebApp с небольшим таймаутом.
 * @param {number} timeout - Максимальное время ожидания в миллисекундах.
 * @returns {Promise<ExtendedWebApp>} - Промис, который разрешается с объектом Telegram.WebApp.
 */
const waitForTelegram = (timeout = 3000): Promise<ExtendedWebApp> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = 100;
    const maxAttempts = timeout / interval;

    const check = () => {
      if (window.Telegram?.WebApp?.initData) {
        resolve(window.Telegram.WebApp);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, interval);
      } else {
        if (window.Telegram?.WebApp) {
            reject(new Error("Не удалось получить данные для входа. Пожалуйста, запускайте приложение через меню или кнопку в боте Telegram."));
        } else {
            reject(new Error("Это приложение должно быть запущено внутри Telegram. Если ошибка повторяется, попробуйте перезапустить клиент."));
        }
      }
    };
    check();
  });
};


export default function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const tg = await waitForTelegram();
        
        // 🔥🔥🔥 НАЧАЛО ХАКА "ХИТРЫЙ РЕДИРЕКТ" 🔥🔥🔥
        // Проверяем два условия:
        // 1. Приложение НЕ в полноэкранном режиме (т.е. открыто в шторке)
        // 2. У нас НЕТ start_param (чтобы избежать бесконечного цикла редиректов)
        if (!tg.initDataUnsafe.start_param) {
            // ...НО вместо редиректа через window.location...
            // window.location.href = `https://t.me/ariyaappbot?startapp=force_fullscreen`;

            // ...мы используем ОФИЦИАЛЬНЫЙ, ПРАВИЛЬНЫЙ метод Telegram API.
            // Это приказ самому клиенту, а не браузеру. Он должен обработать его корректно.
            tg.openTelegramLink(`https://t.me/ariyaappbot?startapp=force_fullscreen`);
            
            // Прерываем выполнение, чтобы избежать ошибок.
            return;
        }
        // 🔥🔥🔥 КОНЕЦ ХАКА 🔥🔥🔥

        // Если редирект не потребовался, выполняем обычную инициализацию
        tg.ready();
        tg.expand(); // Эта команда все еще нужна для обычных запусков
        tg.setHeaderColor('secondary_bg_color'); 
        tg.setBackgroundColor('#0a0a0a');
        tg.enableClosingConfirmation();
        
        if (typeof tg.enableVerticalSwipes === 'function') {
          tg.enableVerticalSwipes();
        }

        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
        });
        if (!response.ok) {
          throw new Error(`Ошибка авторизации (статус: ${response.status}). Попробуйте перезапустить приложение.`);
        }
        const data = await response.json();
        localStorage.setItem('jwt_token', data.token);
        
        if (tg.initDataUnsafe.user) {
            setUserData(tg.initDataUnsafe.user);
        }

      } catch (e: unknown) {
        console.error("Критическая ошибка инициализации:", e);
        clearUserData();
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Произошла неизвестная ошибка.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  return (
    // AnimatePresence переехал в TabBarLayout, поэтому здесь он больше не нужен.
    // Это обеспечивает анимацию ТОЛЬКО контента страницы, а не всего layout'а вместе с TabBar.
    <Routes location={location} key={location.key}>
      <Route element={<TabBarLayout />}>
        {/* Главный роут редиректит на профиль */}
        <Route path="/" element={<Navigate to="/profile" replace />} />
        
        {/* 
          Страницы теперь рендерятся напрямую.
          Обертка PageWrapperFade больше не нужна, так как TabBarLayout
          уже содержит motion.div, который обрабатывает анимацию
          появления/исчезновения Outlet'а.
        */}
        <Route path="/calc" element={<Calc />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<OrdersPage />} />
      </Route>
    </Routes>
  );
}