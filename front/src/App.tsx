// src/App.tsx - ВОЗВРАЩЕНИЕ К СТАБИЛЬНОМУ ОРИГИНАЛУ

import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import { setUserData, clearUserData } from './utils/user';
import Calc from "./pages/Calc";
import Profile from "./pages/Profile";
import OrdersPage from "./pages/OrdersPage";
import TabBarLayout from "./layouts/TabBarLayout";

// Твой оригинальный, рабочий интерфейс. Он правильный.
interface ExtendedWebApp {
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

// Твоя оригинальная, рабочая функция ожидания.
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
        reject(new Error("Не удалось получить данные для входа. Пожалуйста, перезапустите приложение."));
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
        
        // ПРОСТАЯ И НАДЕЖНАЯ ИНИЦИАЛИЗАЦИЯ
        tg.ready();
        tg.expand();
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
    <Routes location={location} key={location.key}>
      <Route element={<TabBarLayout />}>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/calc" element={<Calc />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<OrdersPage />} />
      </Route>
    </Routes>
  );
}