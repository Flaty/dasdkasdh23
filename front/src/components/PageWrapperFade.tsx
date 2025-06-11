import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }} // Быстрый fade для отзывчивости
      className={`min-h-screen ${
        scrollable
          ? "overflow-y-auto overscroll-contain"
          : "overflow-visible overscroll-none"
      }`}
    >
      {children}
    </motion.div>
  );
}