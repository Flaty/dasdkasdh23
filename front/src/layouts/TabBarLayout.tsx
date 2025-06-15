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
    <div className="fixed inset-0 bg-[#0a0a0a]">
      {/* Эффект свечения, который не скроллится */}
      <div className="absolute top-0 left-0 right-0 bottom-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[25%] w-[360px] h-[360px] rounded-full" style={{ backgroundColor: "transparent", boxShadow: "0 0 160px 80px rgba(147, 51, 234, 0.2)" }} />
        <div className="absolute bottom-[8%] right-[15%] w-[280px] h-[280px] rounded-full" style={{ backgroundColor: "transparent", boxShadow: "0 0 120px 60px rgba(59, 130, 246, 0.2)" }} />
      </div>

      <UnpaidOrderBanner />

      {/* ГЛАВНЫЙ СКРОЛЛ-КОНТЕЙНЕР */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto no-scrollbar"
        style={{
          paddingTop: `max(env(safe-area-inset-top, 0px), 0px)`,
          paddingBottom: `max(calc(env(safe-area-inset-bottom, 0px) + 64px), 64px)`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* 🔥🔥🔥 ВОТ ОН, ТРЮК С 1 ПИКСЕЛЕМ 🔥🔥🔥 */}
        {/* Этот div ВСЕГДА чуть-чуть выше экрана, заставляя родителя быть скроллящимся */}
        <div className="relative" style={{ minHeight: 'calc(100% + 1px)' }}>
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
      
      <TabBar />
    </div>
  );
}