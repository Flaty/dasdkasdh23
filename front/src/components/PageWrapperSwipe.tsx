import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTransitionDirection } from "../utils/TransitionDirectionContext";

export default function PageWrapperSwipe({
  children,
  scrollable = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  const location = useLocation();
  const direction = useTransitionDirection();
  console.log("🌀 direction is:", direction); // <-- теперь используем контекст

  useEffect(() => {
    document.body.style.overflow = scrollable ? "auto" : "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [location.key]);

  const variants = {
    initial: { x: direction === "forward" ? 100 : -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: direction === "forward" ? -100 : 100, opacity: 0 },
  };

  return (
  <div className="w-screen overflow-x-clip">
    <motion.div
      style={{ overscrollBehaviorY: "none" }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      className={`min-h-screen ${
        scrollable
          ? "overflow-y-auto overscroll-contain"
          : "overflow-visible overscroll-none"
      }`}
    >
      {children}
    </motion.div>
  </div>
)

}
