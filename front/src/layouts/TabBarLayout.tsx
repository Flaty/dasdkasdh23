// src/layouts/TabBarLayout.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ (SENIOR MODE)

import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useLayoutEffect } from "react";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";

export default function TabBarLayout() {
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    // ✅ ФИКС 1: Родительский div теперь чистый. Без inline-стилей с padding.
    <div className="fixed inset-0 bg-[#0a0a0a]">
      {/* Эти компоненты плавающие, они позиционируются независимо */}
      <UnpaidOrderBanner />
      <TabBar />

      {/* ГЛАВНЫЙ СКРОЛЛ-КОНТЕЙНЕР */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-x-0 top-0 bottom-0 overflow-y-auto no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Трюк с min-height оставляем, он полезен для скролла */}
        <div className="relative" style={{ minHeight: 'calc(100% + 1px)' }}>
          {/* 
            ✅ ФИКС 2: ВОТ ГДЕ МАГИЯ!
            Мы добавляем padding к обертке КОНТЕНТА.
            Теперь сам контент (Outlet) будет иметь отступы, не залезая под "челку" и TabBar.
            Используем CSS переменные, которые определили в index.html.
          */}
          <div style={{
            paddingTop: `var(--safe-area-top)`,
            paddingBottom: `calc(64px + var(--safe-area-bottom))`, // Высота TabBar (64px) + нижний отступ
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}