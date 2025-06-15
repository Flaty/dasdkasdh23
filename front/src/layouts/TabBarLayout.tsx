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
    <div className="fixed inset-0 bg-[#0a0a0a]" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>

      <UnpaidOrderBanner />

      {/* ГЛАВНЫЙ СКРОЛЛ-КОНТЕЙНЕР */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto no-scrollbar"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* 🔥🔥🔥 ВОТ ОН, ТРЮК С 1 ПИКСЕЛЕМ 🔥🔥🔥 */}
        {/* Этот div ВСЕГДА чуть-чуть выше экрана, заставляя родителя быть скроллящимся */}
        <div className="relative" style={{ 
          minHeight: 'calc(100% + 1px)',
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom))'
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
      
      <TabBar />
    </div>
  );
}