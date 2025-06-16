// src/layouts/TabBarLayout.tsx - НОВАЯ, УЛУЧШЕННАЯ ВЕРСИЯ

import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useLayoutEffect } from "react";
import TabBar from "../components/TabBar";
import UnpaidOrderBanner from "../components/UnpaidOrderBanner";

// Высота плашки Telegram + небольшой "воздушный" отступ
const TELEGRAM_HEADER_HEIGHT = "56px"; 
const EXTRA_TOP_PADDING = "16px"; // 1rem

export default function TabBarLayout() {
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]">
      <UnpaidOrderBanner />
      <TabBar />

      <div
        ref={scrollContainerRef}
        className="absolute inset-x-0 top-0 bottom-0 overflow-y-auto no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="relative" style={{ minHeight: 'calc(100% + 1px)' }}>
          <div style={{
            paddingTop: `calc(var(--safe-area-top) + ${TELEGRAM_HEADER_HEIGHT} + ${EXTRA_TOP_PADDING})`,
            // 🔥 ФИКС: Нижний отступ теперь равен высоте таббара + отступ для "челки"
            paddingBottom: `calc(var(--tab-bar-height) + var(--safe-area-bottom))`,
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