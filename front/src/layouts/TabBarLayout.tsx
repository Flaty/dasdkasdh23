// src/layouts/TabBarLayout.tsx
import { Outlet } from "react-router-dom";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";

export default function TabBarLayout() {
  // Получаем доступ к информации о видимой области

  return (
    // Этот div больше не управляет высотой и скроллом. Он просто контейнер.
    <div>
      <UnpaidOrderBanner />

      <main 
        style={{
          // 🔥🔥🔥 ГЛАВНЫЙ ФИКС СКРОЛЛА 🔥🔥🔥
          // Мы добавляем отступ сверху, равный ТЕКУЩЕЙ высоте хедера.
          // Когда хедер сожмется, эта переменная изменится, и отступ уменьшится.
          // Добавляем нижний отступ, чтобы контент не залезал под TabBar
          paddingBottom: '80px', 
          transition: 'padding-top 0.2s ease-out' // Плавная анимация отступа
        }}
      >
        <Outlet />
      </main>
      
      <TabBar />
    </div>
  );
}