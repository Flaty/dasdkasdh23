// BottomSheet.tsx (iOS-like feel, V3 - Physics Tweak)

import { AnimatePresence, motion, useDragControls, useMotionValue, animate } from "framer-motion";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { haptic } from "../utils/haptic";

export interface BottomSheetHandle {
  dismiss: () => void;
}

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  open: boolean;
}

// ✅ Параметры анимации вынесены в константы для легкой настройки
const IOS_SPRING = {
  type: "spring",
  stiffness: 400, // Чуть жестче
  damping: 40,    // Чуть больше затухания, чтобы не "дребезжала"
  mass: 0.8,      // Масса влияет на "инертность"
};

const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  ({ title, onClose, children, open }, ref) => {
    const dragControls = useDragControls();
    const y = useMotionValue(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(open);

    useEffect(() => {
      if (open) {
        setIsVisible(true);
      }
    }, [open]);
    
    const dismiss = () => {
      haptic.light();
      setIsVisible(false);
    };

    useImperativeHandle(ref, () => ({ dismiss }));

    const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
      const scrollTop = contentRef.current?.scrollTop || 0;
      if (scrollTop > 0) {
          // Если контент прокручен, не даем тащить шторку, а позволяем скроллить
          animate(y, 0, { type: "spring", damping: 30, stiffness: 400 });
          return;
      }

      // Вместо простого `dismiss()`, мы смотрим, как далеко и быстро потянули
      const closeThreshold = 100;
      if (info.offset.y > closeThreshold || info.velocity.y > 500) {
        // Если порог превышен - запускаем анимацию закрытия
        dismiss();
      } else {
        // Иначе - плавно возвращаем шторку на место
        animate(y, 0, { type: "spring", damping: 30, stiffness: 400 });
      }
    };

    return createPortal(
      <AnimatePresence onExitComplete={onClose}>
        {isVisible && (
          <motion.div className="fixed inset-0 z-[9998] flex items-end">
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={dismiss}
              style={{ touchAction: 'none' }}
            />
            
            <motion.div
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 500 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}

              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              // ✅ ГЛАВНЫЙ ФИКС: Используем константу с правильными параметрами анимации.
              transition={IOS_SPRING}
              
              style={{ y }} 

              className="relative z-[9999] w-full rounded-t-2xl bg-[#1c1c1f] pt-2 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Эти div'ы нужны, чтобы фон был сплошным при "резиновом" перетаскивании за пределы экрана */}
              <div className="absolute inset-x-0 -top-[200vh] h-[200vh] bg-[#1c1c1f] z-[-1] rounded-t-2xl" />
              <div className="absolute inset-x-0 bottom-[-100px] h-[100px] bg-[#1c1c1f] z-[-1]" />

              <div className="w-full py-4 flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => {
                   if (contentRef.current?.scrollTop === 0) {
                      dragControls.start(e);
                   }
                }}
              >
                <div className="w-12 h-1.5 bg-[#444] rounded-full" />
              </div>
              
              <h3 className="text-white text-center text-sm mb-4 px-4 leading-tight">{title}</h3>
              
              <div ref={contentRef} className="flex-1 px-4 pb-16 overflow-y-auto scroll-smooth max-h-[calc(100vh-120px)]">
                {children}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

export default BottomSheet;