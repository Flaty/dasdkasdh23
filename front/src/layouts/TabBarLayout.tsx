// src/layouts/TabBarLayout.tsx
import { Outlet } from "react-router-dom";
import TabBar from "../components/TabBar";

export default function TabBarLayout() {
  return (
    <div className="relative h-screen flex flex-col bg-[#0a0a0a]">
      {/* 
        ✅ <main> теперь содержит <Outlet />. 
        Сюда react-router будет рендерить дочерние маршруты (наши страницы).
        overflow-x-hidden важен, чтобы анимация сдвига не создавала горизонтальный скролл.
      */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <Outlet />
      </main>
      {/* ✅ TabBar находится ЗА пределами Outlet, поэтому он не будет анимироваться при смене страниц. */}
      <TabBar />
    </div>
  );
}