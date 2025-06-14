// src/layouts/TabBarLayout.tsx
import { Outlet } from "react-router-dom";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";
import { CustomHeader } from "../components/CustomHeader"; // 👈 ИМПОРТ

export default function TabBarLayout() {
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Наш новый, кастомный хедер, который будет на всех страницах */}
      <CustomHeader />
      
      <UnpaidOrderBanner />

      {/* Основной контент теперь имеет отступ сверху, чтобы не залезать под хедер */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
        style={{
            // 🔥🔥🔥 ВАЖНО: 60px (высота хедера) + высота системной плашки
            paddingTop: `calc(60px + var(--tg-viewport-header-height))`
        }}
      >
        <Outlet />
      </main>
      
      <TabBar />
    </div>
  );
}