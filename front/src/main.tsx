import '@unocss/reset/tailwind.css';
import 'uno.css';
import '@fontsource/inter';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { setUserData } from './utils/user';
import { TransitionDirectionProvider } from "./utils/TransitionDirectionContext";
import { customHistory } from './utils/history';
import { ToastProvider } from "./components/ToastProvider";

// 🎯 ВСТАВКА FONT-FACE
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

// 🌙 Тема
document.body.style.backgroundColor = "#0f0f10";
document.body.style.overflowX = 'hidden';

// Юзер
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
    <HistoryRouter history={customHistory}>
      <ToastProvider>
        <TransitionDirectionProvider>
          <App />
        </TransitionDirectionProvider>
      </ToastProvider>
    </HistoryRouter>
  </React.StrictMode>
);
