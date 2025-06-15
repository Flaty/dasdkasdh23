// src/layouts/TabBarLayout.tsx - ОБНОВЛЕННЫЙ

import { Outlet, useLocation } from "react-router-dom";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";
import { useRef, useLayoutEffect } from "react";

export default function TabBarLayout() {
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Скроллим к верху при смене страницы
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    // Этот div — просто якорь на весь экран.
    <div className="fixed inset-0 bg-[#0a0a0a]">
      <UnpaidOrderBanner />

      {/* 
        🔥 ВОТ ОН, НАШ ГЛАВНЫЙ КОНТЕЙНЕР СКРОЛЛА 🔥
        - Он всегда есть, всегда может скроллиться.
        - Он "съедает" свайпы, не давая им улететь в Telegram.
        - Он задает глобальные отступы, которые не будут конфликтовать со страницами.
      */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto no-scrollbar"
        style={{
          // Верхний отступ для "челки"
          paddingTop: `env(safe-area-inset-top, 0px)`, 
          // Нижний отступ для таб-бара и системной навигации
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 64px)`, // 64px - высота TabBar
        }}
      >
        <main>
          {/* Outlet будет рендерить наш PageWrapperFade с контентом */}
          <Outlet />
        </main>
      </div>
      
      <TabBar />
    </div>
  );
}