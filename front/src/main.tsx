// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App';
import { ToastProvider } from "./components/ToastProvider";
import { TransitionDirectionProvider } from "./utils/TransitionDirectionContext";
import { SafeAreaProvider } from "./components/SafeAreaProvider";

import '@unocss/reset/tailwind.css';
import './styles/globals.css';
import 'uno.css';
import '@fontsource/inter';

const queryClient = new QueryClient();

document.body.style.backgroundColor = "#0f0f10";

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <TransitionDirectionProvider>
              {/* ✅ 2. ОБОРАЧИВАЕМ APP В ПРОВАЙДЕР */}
              <SafeAreaProvider>
                <App />
              </SafeAreaProvider>
            </TransitionDirectionProvider>
          </ToastProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  );
}