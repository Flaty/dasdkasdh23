// src/layouts/TabBarLayout.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useLayoutEffect } from "react";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";
import { useSafeArea } from "../components/SafeAreaProvider";

export default function TabBarLayout() {
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const safeArea = useSafeArea(); // Получаем отступы

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    // Этот div теперь использует значения из провайдера для отступов
    <div className="fixed inset-0 bg-[#0a0a0a]" style={{
      paddingTop: `${safeArea.top}px`,
      // paddingBottom больше не нужен, т.к. TabBar сам себя позиционирует
    }}>
      <UnpaidOrderBanner />

      {/* ГЛАВНЫЙ СКРОЛЛ-КОНТЕЙНЕР */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-x-0 top-0 bottom-0 overflow-y-auto no-scrollbar"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Трюк с 1 пикселем, чтобы скролл всегда был активен */}
        <div className="relative" style={{ minHeight: 'calc(100% + 1px)' }}>
          {/* 
            Нижний отступ для контента, чтобы он не заезжал под TabBar.
            Мы берем высоту таббара (64px) + отступ снизу
          */}
          <div style={{ paddingBottom: `calc(64px + ${safeArea.bottom}px)` }}>
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
      
      <TabBar />
    </div>
  );
}