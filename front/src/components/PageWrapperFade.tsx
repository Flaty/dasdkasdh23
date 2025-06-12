// src/components/PageWrapperFade.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PageWrapperFade({
  children,
  scrollable = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = scrollable ? "auto" : "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [location.key]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          duration: 0.08, // Очень быстрый фейд как в Telegram
          ease: "easeOut"
        }}
        className={`min-h-screen ${
          scrollable
            ? "overflow-y-auto overscroll-contain"
            : "overflow-visible overscroll-none"
        }`}
      >
        {/* Дополнительный слой для микро-анимации контента */}
        <motion.div
          initial={{ opacity: 0.8, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.12,
            ease: [0.25, 0.1, 0.25, 1], // Custom easing
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}