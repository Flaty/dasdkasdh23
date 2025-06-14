// src/layouts/TabBarLayout.tsx
import { Outlet } from "react-router-dom";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";
import { CloseButton } from "../components/CloseButton"; // 👈 ИМПОРТ НАШЕЙ КНОПКИ

export default function TabBarLayout() {
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      
      {/* Наша новая, простая кнопка. Она будет на всех страницах. */}
      <CloseButton />
      
      <UnpaidOrderBanner />

      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Контенту больше не нужен отступ, так как кнопка не занимает всю ширину */}
        <Outlet />
      </main>
      
      <TabBar />
    </div>
  );
}