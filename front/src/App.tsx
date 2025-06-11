// src/App.tsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Calc from "./pages/Calc";
import Profile from "./pages/Profile";
import OrdersPage from "./pages/OrdersPage";

import PageWrapperSwipe from "./components/PageWrapperSwipe";
// ✅ Импортируем наш layout-компонент
import TabBarLayout from "./layouts/TabBarLayout";

export default function App() {
  const location = useLocation();
  return (
    // ✅ AnimatePresence теперь на самом верхнем уровне, оборачивает Routes.
    <AnimatePresence mode="wait" initial={false}>
      {/* ✅ Передаем location и key напрямую в Routes для корректной работы анимаций. */}
      <Routes location={location} key={location.key}>
        {/* 
          ✅ Создаем родительский маршрут (layout route), который рендерит TabBarLayout.
          Все дочерние маршруты будут отображаться внутри <Outlet /> в TabBarLayout.
        */}
        <Route element={<TabBarLayout />}>
          {/* 👇 Эти маршруты теперь дочерние и отрендерены внутри TabBarLayout */}
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route
            path="/calc"
            element={
              // ⛔️ Обертка TabBarLayout отсюда убрана
              <PageWrapperSwipe>
                <Calc />
              </PageWrapperSwipe>
            }
          />
          <Route
            path="/profile"
            element={
              <PageWrapperSwipe>
                <Profile />
              </PageWrapperSwipe>
            }
          />
          <Route
            path="/cart"
            element={
              <PageWrapperSwipe scrollable>
                <OrdersPage />
              </PageWrapperSwipe>
            }
          />
        </Route>
        
        {/* 
          💡 P.S. Сюда в будущем можно будет добавлять маршруты, 
          которые НЕ должны иметь таббар, например, страница логина.
          <Route path="/login" element={<LoginPage />} />
        */}
      </Routes>
    </AnimatePresence>
  );
}