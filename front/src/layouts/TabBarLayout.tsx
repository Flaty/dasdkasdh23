// src/layouts/TabBarLayout.tsx
import { Outlet } from "react-router-dom";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";

export default function TabBarLayout() {
  return (
    // 🔥 ЭТОТ DIV БОЛЬШЕ НЕ 'relative'. ОН ПРОСТО КОНТЕЙНЕР.
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      
      {/* 
        ✅ Баннер живет здесь, на самом верхнем уровне.
        Он будет позиционироваться относительно всего окна браузера.
      */}
      <UnpaidOrderBanner />

      {/* Основной контент и TabBar теперь живут своей жизнью */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <Outlet />
      </main>
      
      <TabBar />
    </div>
  );
}