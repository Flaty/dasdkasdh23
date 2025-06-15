// src/layouts/TabBarLayout.tsx
import { Outlet } from "react-router-dom";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";

export default function TabBarLayout() {
  return (
    // Этот div теперь просто логический контейнер
    <div>
      <UnpaidOrderBanner />
      
      {/* `main` больше не нужен, каждая страница сама управляет своими отступами */}
      <Outlet />
      
      <TabBar />
    </div>
  );
}