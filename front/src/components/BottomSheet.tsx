// BottomSheet.tsx (iOS-like feel, V4 - Telegram Swipe Fix)

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

const IOS_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.8,
};

const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  ({ title, onClose, children, open }, ref) => {
    const dragControls = useDragControls();
    const y = useMotionValue(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(open);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
      if (open) {
        setIsVisible(true);
        // Disable Telegram swipe when sheet is open
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.disableVerticalSwipes();
        }
      }
      
      return () => {
        // Re-enable Telegram swipe when sheet closes
        if (!open && window.Telegram?.WebApp) {
          window.Telegram.WebApp.enableVerticalSwipes();
        }
      };
    }, [open]);
    
    const dismiss = () => {
      haptic.light();
      setIsVisible(false);
    };

    useImperativeHandle(ref, () => ({ dismiss }));

    // Prevent default touch behavior on the entire sheet
    useEffect(() => {
      const sheet = sheetRef.current;
      if (!sheet) return;

      const preventDefaultTouch = (e: TouchEvent) => {
        // Only prevent if we're dragging the handle area
        const target = e.target as HTMLElement;
        if (target.closest('.drag-handle') || isDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      sheet.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      sheet.addEventListener('touchmove', preventDefaultTouch, { passive: false });

      return () => {
        sheet.removeEventListener('touchstart', preventDefaultTouch);
        sheet.removeEventListener('touchmove', preventDefaultTouch);
      };
    }, [isDragging]);

    const handleDragStart = () => {
      setIsDragging(true);
    };

    const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
      setIsDragging(false);
      
      const scrollTop = contentRef.current?.scrollTop || 0;
      if (scrollTop > 0) {
        animate(y, 0, { type: "spring", damping: 30, stiffness: 400 });
        return;
      }

      const closeThreshold = 100;
      if (info.offset.y > closeThreshold || info.velocity.y > 500) {
        dismiss();
      } else {
        animate(y, 0, { type: "spring", damping: 30, stiffness: 400 });
      }
    };

    // Handle exit complete to re-enable swipes
    const handleExitComplete = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.enableVerticalSwipes();
      }
      onClose();
    };

    return createPortal(
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isVisible && (
          <motion.div 
            className="fixed inset-0 z-[9998] flex items-end"
            onTouchMove={(e) => {
              // Prevent page scroll when touching backdrop
              e.preventDefault();
            }}
          >
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
              ref={sheetRef}
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 500 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}

              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={IOS_SPRING}
              
              style={{ y }} 

              className="relative z-[9999] w-full rounded-t-2xl bg-[#1c1c1f] pt-2 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-x-0 -top-[200vh] h-[200vh] bg-[#1c1c1f] z-[-1] rounded-t-2xl" />
              <div className="absolute inset-x-0 bottom-[-100px] h-[100px] bg-[#1c1c1f] z-[-1]" />

              <div 
                className="drag-handle w-full py-4 flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => {
                  if (contentRef.current?.scrollTop === 0) {
                    dragControls.start(e);
                  }
                }}
                style={{ touchAction: 'none' }}
              >
                <div className="w-12 h-1.5 bg-[#444] rounded-full" />
              </div>
              
              <h3 className="text-white text-center text-sm mb-4 px-4 leading-tight">{title}</h3>
              
              <div 
                ref={contentRef} 
                className="flex-1 px-4 pb-16 overflow-y-auto scroll-smooth max-h-[calc(100vh-120px)]"
                onTouchStart={(e) => {
                  // Allow scrolling in content area
                  e.stopPropagation();
                }}
              >
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