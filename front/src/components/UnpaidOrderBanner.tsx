// src/components/UnpaidOrderBanner.tsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { useUnpaidOrder } from "../hook/useUnpaidOrder";
import { haptic } from "../utils/haptic";

export default function UnpaidOrderBanner() {
  const { unpaidOrderId, clearUnpaidOrder, checkOrderStatus } = useUnpaidOrder();
  const [isVisible, setIsVisible] = useState(false);
  const [lastDismissed, setLastDismissed] = useState(0);
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0], [0, 1]);
  const controls = useAnimation();

  useEffect(() => {
    if (unpaidOrderId) {
      // Показываем через секунду после появления или через 5 секунд после свайпа
      const now = Date.now();
      const timeSinceDismiss = now - lastDismissed;
      const delay = lastDismissed === 0 ? 1000 : Math.max(0, 5000 - timeSinceDismiss);
      
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [unpaidOrderId, lastDismissed]);

  // Проверяем статус заказа каждые 30 секунд
  useEffect(() => {
    if (!unpaidOrderId) return;
    const interval = setInterval(checkOrderStatus, 30000);
    return () => clearInterval(interval);
  }, [unpaidOrderId, checkOrderStatus]);

  const handlePayClick = () => {
    haptic.medium();
    window.open("https://t.me/Littleton59", "_blank");
  };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y < -50) {
      // Свайп вверх - скрываем
      haptic.light();
      controls.start({ y: -200, opacity: 0 });
      setTimeout(() => {
        setIsVisible(false);
        setLastDismissed(Date.now());
        y.set(0);
      }, 300);
    } else {
      // Возвращаем на место
      controls.start({ y: 0 });
    }
  };

  if (!unpaidOrderId) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag="y"
          dragConstraints={{ bottom: 0, top: -200 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          initial={{ y: -150, scale: 0.8, opacity: 0 }}
          animate={controls.length ? controls : { y: 0, scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 35
          }}
          style={{ y, opacity }}
          className="fixed left-0 right-0 z-[999] px-3 cursor-grab active:cursor-grabbing"
          whileDrag={{ scale: 0.98 }}
        >
          <div
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              marginTop: '12px'
            }}
          >
            {/* iOS-style notification */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={handlePayClick}
              className="relative mx-auto max-w-md overflow-hidden rounded-2xl"
              style={{
                background: 'rgba(28, 28, 30, 0.98)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 0 0.5px rgba(255, 255, 255, 0.1)',
              }}
            >
              
              {/* Content */}
              <div className="flex items-start gap-3 p-4 pt-5">
                {/* App icon - чистый минимализм */}
                <div className="relative flex-shrink-0">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10"
                    style={{
                      boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" 
                      />
                    </svg>
                  </div>
                  {/* Subtle pulse */}
                  <div className="absolute -right-0.5 -top-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-semibold text-white leading-tight">Оплата ожидается</p>
                      <p className="text-[13px] text-white/60 mt-0.5 leading-tight">
                        Заказ №{unpaidOrderId?.slice(-6)} • Нажмите для оплаты
                      </p>
                    </div>
                    
                    {/* Time */}
                    <span className="text-[11px] text-white/40 flex-shrink-0 mt-0.5">сейчас</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Shadow */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)',
                transform: 'translateY(10px) scaleX(0.85)',
                filter: 'blur(25px)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}