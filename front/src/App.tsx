// src/App.tsx
import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Утилиты
import { setUserData, clearUserData } from './utils/user';

// Компоненты и страницы
import Calc from "./pages/Calc";
import Profile from "./pages/Profile";
import OrdersPage from "./pages/OrdersPage";
import PageWrapperFade from "./components/PageWrapperFade";
import TabBarLayout from "./layouts/TabBarLayout";


// --- Компоненты для состояний загрузки и ошибки ---

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', backgroundColor: '#0f0f10' }}>
    Загрузка...
  </div>
);

// ✅ ФИКС №1: Явно указываем тип для пропса message
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
  // ✅ ФИКС №2: Указываем, что состояние может быть string или null
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
        let token: string;
        const cachedToken = localStorage.getItem('jwt_token');
        if (cachedToken) {
          token = cachedToken;
        } else {
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData }),
          });
          if (!response.ok) {
            throw new Error(`Ошибка авторизации (статус: ${response.status}). Попробуйте перезапустить приложение.`);
          }
          const data = await response.json();
          token = data.token;
          localStorage.setItem('jwt_token', token);
        }
        
        setUserData(tg.initDataUnsafe.user);

        requestAnimationFrame(() => tg.expand());

      } catch (e: unknown) { // ✅ ФИКС №3: Обрабатываем ошибку типа unknown
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