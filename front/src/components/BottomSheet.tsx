import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"

export interface BottomSheetHandle {
  dismiss: () => void
}

interface BottomSheetProps {
  title: string
  onClose: () => void
  children: ReactNode
}

const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  ({ title, onClose, children }, ref) => {
    const dragControls = useDragControls()
    const rawY = useMotionValue(0)
    const y = useSpring(rawY, {
      stiffness: 400,
      damping: 30,
      mass: 0.25,
    })

    const boxShadow = useTransform(
      rawY,
      (v) => (v < -10 ? "none" : "0 -4px 30px rgba(0, 0, 0, 0.4)")
    )

    const closeThreshold = 100
    const [isVisible, setIsVisible] = useState(true)

    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      rawY.set(0)
    }, [])

    const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
      const scrollTop = contentRef.current?.scrollTop || 0
      if (scrollTop > 0) {
        rawY.set(0)
        return
      }

      if (info.offset.y > closeThreshold || info.velocity.y > 500) {
        dismiss()
      } else {
        rawY.set(0)
      }
    }

    const dismiss = () => {
      if (navigator.vibrate) navigator.vibrate(10)
      setIsVisible(false)
    }

    useImperativeHandle(ref, () => ({ dismiss }))

    return createPortal(
      <AnimatePresence onExitComplete={onClose}>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-[9998] flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Блур на фон */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Модалка + фон снизу как единое целое */}
<motion.div
  drag="y"
  dragListener={false}
  dragControls={dragControls}
  style={{ y, boxShadow }}
  dragElastic={0.2}
  dragConstraints={{ top: 0, bottom: 0 }}
  onDragEnd={handleDragEnd}
  initial={{ y: 100 }}
  animate={{ y: 0 }}
  exit={{ y: 300 }}
  transition={{ type: "spring", stiffness: 500, damping: 50, mass: 0.2 }}
  className="relative z-[9999] w-full rounded-t-2xl bg-[#1c1c1f] pt-2 flex flex-col overflow-hidden"
>
  {/* Верхний фон для pull-up */}
  <div className="absolute inset-x-0 -top-[200vh] h-[200vh] bg-[#1c1c1f] z-[-1] rounded-t-2xl" />

  {/* Нижний фон для продолжения модалки при pull-up */}
  <div className="absolute inset-x-0 bottom-[-100px] h-[100px] bg-[#1c1c1f] z-[-1]" />

  {/* Пипка */}
  <div
    className="w-full py-4 flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing touch-none"
    onPointerDown={(e) => dragControls.start(e)}
  >
    <div className="w-12 h-1.5 bg-[#444] rounded-full" />
  </div>

  {/* Заголовок */}
  <h3 className="text-white text-center text-sm mb-4 px-4 leading-tight">
    {title}
  </h3>

  {/* Контент */}
  <div
    ref={contentRef}
    className="flex-1 px-4 pb-16 overflow-y-auto scroll-smooth max-h-[calc(100vh-120px)]"
  >
    {children}
  </div>
</motion.div>


          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )
  }
)

export default BottomSheet
