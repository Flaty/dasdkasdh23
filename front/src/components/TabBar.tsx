// src/components/TabBar.tsx - Translucent version with subtle glow
import { useLocation } from "react-router-dom";
import { User, Package, Calculator } from "lucide-react";
import { useCustomNavigate } from "../utils/useCustomNavigate";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { haptic } from "../utils/haptic";
import { useSafeArea } from "./SafeAreaProvider";

const tabs = [
  { to: "/profile", label: "Профиль", icon: User },
  { to: "/calc", label: "Расчёт", icon: Calculator },
  { to: "/cart", label: "Заказы", icon: Package },
];

export default function TabBar() {
  const navigate = useCustomNavigate();
  const location = useLocation();
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const [touchPoint, setTouchPoint] = useState({ x: 0, y: 0 });
  const safeArea = useSafeArea();

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-50 flex justify-around items-center"
      style={{
        height: `calc(64px + ${safeArea.bottom}px)`,
        paddingBottom: `${safeArea.bottom}px`,
        // Более прозрачный фон с усиленным blur
        background: 'rgba(0, 0, 0, 0.65)', // Было 0.90, теперь 0.65
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Мягкое свечение для активного таба с меньшим радиусом */}
      <div className="absolute inset-0 overflow-hidden">
        {tabs.map(({ to }, index) => {
          const isActive = location.pathname === to;
          const position = index * 33.33; // Равномерное распределение для 3 табов
          
          return isActive ? (
            <motion.div
              key={to}
              className="absolute top-0 h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                left: `${position}%`,
                width: '33.33%',
                background: `radial-gradient(ellipse 80px 40px at center top, rgba(255,255,255,0.04) 0%, transparent 60%)`,
                filter: 'blur(12px)', // Меньше blur для более четкого свечения
              }}
            />
          ) : null;
        })}
      </div>

      {tabs.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to;
        const isPressed = pressedTab === to;
        const ref = useRef<HTMLButtonElement>(null);

        return (
          <motion.button
            ref={ref}
            key={to}
            onPointerDown={(e) => {
              setPressedTab(to);
              const rect = ref.current?.getBoundingClientRect();
              if (rect) {
                setTouchPoint({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }
            }}
            onPointerUp={() => setPressedTab(null)}
            onPointerLeave={() => setPressedTab(null)}
            onClick={() => {
              if (isActive) return;
              
              // Haptic feedback
              haptic.light();
              
              // Микро-задержка для анимации
              setTimeout(() => {
                navigate(to, { replace: true });
              }, 50);
            }}
            className="relative flex flex-col items-center gap-0.5 py-2 px-4 min-w-[80px] touch-none select-none"
            animate={{
              scale: isPressed ? 0.88 : 1,
              opacity: isPressed ? 0.8 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 25,
              mass: 0.6,
            }}
          >
            {/* Touch ripple с точкой касания */}
            {isPressed && (
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: touchPoint.x,
                    top: touchPoint.y,
                    background: 'rgba(255, 255, 255, 0.15)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </motion.div>
            )}

            {/* Иконка с 3D эффектом */}
            <motion.div
    className="relative"
    // 🔥🔥🔥 SENIOR FIX 🔥🔥🔥
    animate={{
        // УБИРАЕМ: scale: isActive ? 1.12 : 1,
        y: isActive ? -4 : (isPressed ? 2 : 0), // 👈 Активная иконка приподнимается на 4px
        rotateX: isPressed ? -10 : 0,
    }}
    transition={{
        type: "spring",
        stiffness: 400, // Чуть жестче пружина
        damping: 15,   // Чуть больше "колебаний" для живости
    }}
    style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
    }}
>
    <Icon 
        size={20} 
        strokeWidth={isActive ? 2.2 : 1.8} 
        className={`relative z-10 transition-all duration-300 ${
            isActive 
            ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"
            : "text-white/50"
        }`}
    />
    
    {/* Мягкое свечение под иконкой */}
    {isActive && (
    <motion.div
        className="absolute -inset-1 bg-white/15 rounded-full blur-sm"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 0.3 }}
    />
    )}
</motion.div>

<motion.span 
    className={`relative z-10 text-[11px] transition-all duration-300 ${
    isActive 
        ? "text-white font-semibold" 
        : "text-white/50 font-medium"
    }`}
    // 🔥 И текст тоже приподнимаем вместе с иконкой
    animate={{
        y: isActive ? -2 : (isPressed ? 1 : 0),
        letterSpacing: isActive ? "0.01em" : "0",
    }}
    transition={{
        type: "spring",
        stiffness: 400,
        damping: 15,
    }}
>
    {label}
</motion.span>

            {/* Индикатор активности */}
            {isActive && (
              <motion.div
                className="absolute -bottom-0.5 flex items-center justify-center"
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                <motion.div
                  className="w-1 h-1 bg-white/90 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}