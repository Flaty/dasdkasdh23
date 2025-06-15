
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PageWrapperFade({
  children,
  scrollable = false, // Этот пропс теперь будет реально управлять скроллом
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  const location = useLocation();

  // 🔥 ФИКС: Управляем скроллом на уровне body при монтировании/размонтировании страницы
  useEffect(() => {
    // Если страница помечена как scrollable, разрешаем скролл для body
    document.body.style.overflow = scrollable ? "auto" : "hidden";
    
    // Функция очистки: возвращаем скролл по умолчанию, когда страница уходит
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [scrollable, location.key]); // Зависим от scrollable и ключа локации

  return (
    // AnimatePresence убираем отсюда, он уже есть в App.tsx
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.1, // Очень быстрый фейд
        ease: "easeOut"
      }}
      // 🔥 ФИКС: Этот div теперь всегда может быть прокручен, если контента много.
      // Это "съедает" свайпы, не давая им уйти в Telegram.
      className={`min-h-screen ${
        scrollable
          ? "overflow-y-auto" // Если страница должна скроллиться
          : "overflow-y-hidden" // Если не должна
      }`}
    >
      {/* Дополнительный слой для микро-анимации контента */}
      <motion.div
        initial={{ opacity: 0.8, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}