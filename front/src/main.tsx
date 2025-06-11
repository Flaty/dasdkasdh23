// main.tsx

import '@unocss/reset/tailwind.css';
import './styles/globals.css';
import 'uno.css';
import '@fontsource/inter';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ✅ Импортируем стандартный BrowserRouter
import { BrowserRouter } from 'react-router-dom';

import { setUserData } from './utils/user';
import { TransitionDirectionProvider } from "./utils/TransitionDirectionContext";
import { ToastProvider } from "./components/ToastProvider";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

// ... (твой код со стилями и юзером остается без изменений) ...
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
document.body.style.overflowX = 'hidden';

const userParam = new URLSearchParams(window.location.search).get('user');
if (userParam) {
  try {
    const parsed = JSON.parse(decodeURIComponent(userParam));
    setUserData(parsed);
    window.history.replaceState({}, '', window.location.pathname);
  } catch (err) {
    console.error('Ошибка парсинга user из URL', err);
  }
}

// 🚀 Рендер
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* ✅ Используем BrowserRouter вместо HistoryRouter */}
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