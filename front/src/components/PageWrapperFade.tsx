// src/components/PageWrapperFade.tsx - НОВАЯ, ПРАВИЛЬНАЯ ВЕРСИЯ

import { motion } from "framer-motion";

export default function PageWrapperFade({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🔥 ЭТОТ motion.div - ТОЛЬКО ДЛЯ АНИМАЦИИ ВХОДА/ВЫХОДА
    // Он НЕ имеет высоты, отступов или стилей overflow.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.15, // Быстрый фейд, как в Telegram
        ease: "easeOut"
      }}
    >
      {/* Дополнительный слой для микро-анимации контента при загрузке */}
      <motion.div
        initial={{ opacity: 0.8, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.2,
          ease: "easeOut"
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}