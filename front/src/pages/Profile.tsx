import { getUserData } from "../utils/user"
import { useCustomNavigate } from "../utils/useCustomNavigate"
import { motion, useReducedMotion } from "framer-motion"
import { useRef, useState } from "react"
import BottomSheet from "../components/BottomSheet"
import type { BottomSheetHandle } from "../components/BottomSheet"
import AddressEditor from "../components/AddressEditor"
import { ProfileSkeleton } from "../components/skeletons/ProfileSkeleton"

// Haptic feedback helper
const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [15],
      heavy: [25]
    }
    navigator.vibrate(patterns[type])
  }
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

export default function Profile() {
  const navigate = useCustomNavigate()
  const user = getUserData()
  const prefersReducedMotion = useReducedMotion()

  const supportRef = useRef<BottomSheetHandle>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleNavigation = (path: string) => {
    hapticFeedback('light')
    navigate(path)
  }

  const handleAction = (action: () => void) => {
    hapticFeedback('medium')
    action()
  }

  if (!user) return <ProfileSkeleton />

  return (
    <motion.div 
      className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 🎨 Glow Auras */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <motion.div 
          className="absolute top-[15%] left-[25%] w-[360px] h-[360px] bg-purple-600/20 rounded-full blur-[160px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[8%] right-[15%] w-[280px] h-[280px] bg-blue-600/20 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.25, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* 👤 User Info */}
      <motion.div 
        className="flex flex-col items-center gap-2 text-center mb-4 relative"
        variants={cardVariants}
      >
        <motion.img
          variants={avatarVariants}
          src={user.photo_url || "https://placehold.co/96x96"}
          alt="avatar"
          className="w-24 h-24 rounded-full border border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.1)]"
          whileHover={{ 
            scale: 1.05,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          whileTap={{ scale: 0.95 }}
        />
        
        <motion.button
          onClick={() => handleAction(() => setSupportOpen(true))}
          className="absolute top-0 right-0 text-white/40 hover:text-white text-xl"
          aria-label="Поддержка"
          whileHover={{ 
            scale: 1.1, 
            rotate: 15,
            color: "rgba(255,255,255,0.8)"
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          ❔
        </motion.button>

        <motion.div 
          className="text-xl font-semibold drop-shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {user.first_name || "Имя"}
        </motion.div>
        
        <motion.div 
          className="text-sm text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          @{user.username || "user"}
        </motion.div>
        
        <motion.div 
          className="text-xs text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          В экосистеме 42 дней
        </motion.div>
      </motion.div>

      {/* 📦 Sections */}
      <motion.div 
        className="flex flex-col gap-4 pb-20"
        variants={containerVariants}
      >
        {getSections().map((section, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {section}
          </motion.div>
        ))}
      </motion.div>

      {/* 🛠 Поддержка */}
      {supportOpen && (
        <BottomSheet
          ref={supportRef}
          title="Поддержка"
          onClose={() => setSupportOpen(false)}
        >
          <motion.div 
            className="text-left space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-white/70 leading-snug">
              Свяжись с менеджером в Telegram, если у тебя возникли вопросы по расчёту, заказу или доставке.
            </p>
            <motion.a
              href="https://t.me/your_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm font-medium text-white rounded-full py-2 bg-gradient-to-r from-sky-600/30 to-sky-400/30 border border-sky-400/40"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => hapticFeedback('medium')}
            >
              ✈️ Написать в Telegram
            </motion.a>
            <p className="text-xs text-white/30 text-center mt-6">Отвечаем в течение пары минут</p>
          </motion.div>
        </BottomSheet>
      )}

      {/* 📍 Адрес */}
      {addressOpen && (
        <AddressEditor
          userId={user.id}
          open={addressOpen}
          onClose={() => setAddressOpen(false)}
        />
      )}
    </motion.div>
  )

  function getSections() {
    return [
      <div className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300">
        <div className="text-xs text-white/40">Последний заказ</div>
        <div className="text-sm font-medium">👟 Nike Air Max — 7490 ₽</div>
        <div className="text-xs text-white/30">3 дня назад</div>
      </div>,

      <div className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300">
        <div className="text-sm font-semibold mb-1">🎁 Награда за активность</div>
        <p className="text-xs text-white/50 mb-2">
          Сделай любой заказ — и получи скрытую награду
        </p>
        <motion.button
          onClick={() => handleNavigation("/calc")}
          className="w-full rounded-full bg-white/10 hover:bg-white/20 transition text-sm text-white py-2 px-4 font-medium"
          whileHover={{ 
            scale: 1.02,
            backgroundColor: "rgba(255,255,255,0.15)"
          }}
          whileTap={{ scale: 0.98 }}
        >
          Сделать заказ
        </motion.button>
        <div className="flex flex-wrap gap-2 mt-2">
          {["🍆 Первая покупка", "🔥 5 заказов", "🧾 30k+ потрачено"].map((label, i) => (
            <motion.span
              key={i}
              className="text-xs text-white px-3 py-1 rounded-full font-medium border border-white/20 bg-white/10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              {label}
            </motion.span>
          ))}
        </div>
      </div>,

      <div className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">🥈 Статус</span>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Silver</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-400"
            initial={{ width: "0%" }}
            animate={{ width: "66%" }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-white/50 mt-1">
          До <span className="text-white font-semibold">Gold</span> осталось 2 заказа
        </div>
      </div>,

      <div className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300">
        <div className="text-sm font-medium mb-1">💎 Лояльность</div>
        <div className="text-sm text-white/60">+2% кэшбэк, ранний доступ к скидкам</div>
      </div>,

      <motion.div 
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] cursor-pointer transition-all duration-300"
        onClick={() => handleAction(() => setAddressOpen(true))}
        whileHover={{ 
          backgroundColor: "rgba(255,255,255,0.08)",
          borderColor: "rgba(255,255,255,0.15)"
        }}
      >
        <div className="text-sm font-medium mb-1">📦 Адрес доставки (СДЭК)</div>
        <div className="text-sm text-white/70">Открой для редактирования</div>
      </motion.div>,

      <div className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300">
        <div className="text-sm font-medium mb-1">👯‍♂️ Пригласи друга</div>
        <p className="text-xs text-white/50">
          Получи <span className="text-white font-semibold">+500 ₽</span> за первый заказ друга
        </p>
        <p className="text-xs text-white/30">Ссылка станет активна после авторизации</p>
      </div>,

      <motion.div 
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={() => handleAction(() => setSupportOpen(true))}
          className="text-sm text-white/50 hover:text-white transition w-full text-left"
        >
          💬 Нужна поддержка? Нажми здесь
        </button>
      </motion.div>
    ]
  }
}