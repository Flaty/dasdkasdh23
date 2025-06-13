// src/main.tsx

import '@unocss/reset/tailwind.css';
import './styles/globals.css';
import 'uno.css';
import '@fontsource/inter';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { BrowserRouter } from 'react-router-dom';
import { setUserData, clearUserData } from './utils/user';
// import { fetchWithAuth } from './api/fetchWithAuth'; // Если ты его не используешь напрямую здесь, можно убрать

import { ToastProvider } from "./components/ToastProvider";
import { TransitionDirectionProvider } from "./utils/TransitionDirectionContext"; // ✅ Импортируем провайдер
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

// --- Стили ---
const style = document.createElement('style');
style.innerHTML = `
  @font-face {
    font-family: 'Satoshi';
    src: url('/fonts/Satoshi-Regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
  }
  @font-face {
    font-family: 'Satoshi';
    src: url('/fonts/Satoshi-Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
  }
`;
document.head.appendChild(style);
document.body.style.backgroundColor = "#0f0f10";

// --- Главная функция запуска ---
async function startApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  
  const isDev = import.meta.env.DEV;
  const tg = window.Telegram?.WebApp;

  try {
    let userDataForApp: any = null;

    if (tg && tg.initData) {
      // --- ЛОГИКА ДЛЯ TELEGRAM WEB APP ---
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0a0a0a');
      tg.setBackgroundColor('#0a0a0a');
      
      let token = localStorage.getItem('jwt_token');

      if (!token) {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
        });

        if (!response.ok) {
          throw new Error(`Auth verification failed with status: ${response.status}`);
        }
        
        const { token: newToken, user } = await response.json();
        localStorage.setItem('jwt_token', newToken);
        token = newToken;
        userDataForApp = user;
      }
      
      if (token && !userDataForApp) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userDataForApp = tg.initDataUnsafe?.user || { id: payload.userId };
      }

    } else if (isDev) {
      // --- ЛОГИКА ДЛЯ РЕЖИМА РАЗРАБОТКИ ---
      console.warn("⚠️ РЕЖИМ РАЗРАБОТКИ: Используется моковый пользователь.");
      userDataForApp = {
        id: 12345,
        first_name: "Dev",
        username: "dev_user",
        photo_url: "https://placehold.co/96x96"
      };
      
    } else {
      rootElement.innerHTML = '<h1 style="color: white; text-align: center; padding-top: 50px;">Это приложение можно запустить только через Telegram.</h1>';
      return;
    }
    
    if (userDataForApp) {
      setUserData(userDataForApp);
    } else {
      clearUserData();
      localStorage.removeItem('jwt_token');
      throw new Error("Не удалось получить данные пользователя.");
    }
    
    // ✅ ФИКС: Оборачиваем App во все необходимые провайдеры
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ToastProvider>
              <TransitionDirectionProvider>
                <App />
              </TransitionDirectionProvider>
            </ToastProvider>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </React.StrictMode>
    );

  } catch (e) {
    console.error("Auth process failed", e);
    rootElement.innerHTML = `<h1 style="color: #f87171; text-align: center; padding-top: 50px;">Ошибка аутентификации. Попробуйте перезапустить приложение.</h1><p style="color: #9ca3af; text-align: center;">${e instanceof Error ? e.message : ''}</p>`;
  }
}

// Запускаем!
startApp();