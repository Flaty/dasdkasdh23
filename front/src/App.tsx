// src/App.tsx
import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { setUserData, clearUserData } from './utils/user';
import Calc from "./pages/Calc";
import Profile from "./pages/Profile";
import OrdersPage from "./pages/OrdersPage";
import PageWrapperFade from "./components/PageWrapperFade";
import TabBarLayout from "./layouts/TabBarLayout";

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', backgroundColor: '#0f0f10' }}>
    Загрузка...
  </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
   <div style={{ padding: '2rem', textAlign: 'center', color: 'white', backgroundColor: '#a00', fontFamily: 'sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Произошла ошибка</h1>
      <p style={{ marginTop: '1rem' }}>{message}</p>
    </div>
  </div>
);

export default function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      const tg = window.Telegram?.WebApp as any;

      if (!tg || !tg.initData) {
        setError("Это приложение должно быть запущено внутри Telegram.");
        setIsLoading(false);
        clearUserData();
        return;
      }
      
      tg.ready();
      tg.setHeaderColor('#0a0a0a');
      tg.setBackgroundColor('#0a0a0a');
      tg.enableClosingConfirmation();

      try {
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
        
        setUserData(tg.initDataUnsafe.user);

        // 🔥🔥🔥 ВЫЗЫВАЕМ EXPAND ЗДЕСЬ! 🔥🔥🔥
        // После всех проверок, когда мы уверены, что React сейчас отрисует приложение.
        requestAnimationFrame(() => tg.expand());

      } catch (e: unknown) {
        console.error("Критическая ошибка инициализации:", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Произошла неизвестная ошибка.");
        }
        clearUserData();
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
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.key}>
        <Route element={<TabBarLayout />}>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/calc" element={<PageWrapperFade><Calc /></PageWrapperFade>} />
          <Route path="/profile" element={<PageWrapperFade><Profile /></PageWrapperFade>} />
          <Route path="/cart" element={<PageWrapperFade scrollable><OrdersPage /></PageWrapperFade>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}