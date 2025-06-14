// src/main.tsx - Финальная, отказоустойчивая версия

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App';
import { setUserData, clearUserData } from './utils/user';
import { ToastProvider } from "./components/ToastProvider";
import { TransitionDirectionProvider } from "./utils/TransitionDirectionContext";

import '@unocss/reset/tailwind.css';
import './styles/globals.css';
import 'uno.css';
import '@fontsource/inter';

const queryClient = new QueryClient();

// --- Стили ---
document.body.style.backgroundColor = "#0f0f10";

// --- Главная функция ---
async function startApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const tg = window.Telegram?.WebApp as any;

  let authFailed = false;

  if (tg?.initData && tg?.initDataUnsafe?.user) { 
    tg.ready();

    setTimeout(() => {
      tg.expand();
    }, 50);

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
        if (!response.ok) throw new Error(`Auth verification failed: ${response.status}`);
        const data = await response.json();
        token = data.token;
        localStorage.setItem('jwt_token', token);
      }
      setUserData(tg.initDataUnsafe.user);
    } catch (e) {
      console.error("Telegram auth failed", e);
      authFailed = true;
    }
  } else {
    console.warn("Не в среде Telegram. Запуск в режиме просмотра.");
    clearUserData();
  }

  if (authFailed) {
    rootElement.innerHTML = `<h1 style="color: red; text-align: center; padding: 2rem;">Ошибка авторизации. Перезапустите приложение.</h1>`;
    return;
  }

  // универсальный рендер
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
}


startApp();