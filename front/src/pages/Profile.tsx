import { getUserData } from "../utils/user"
import { useCustomNavigate } from "../utils/useCustomNavigate"
import { motion } from "framer-motion"
import { useRef, useState } from "react"
import BottomSheet from "../components/BottomSheet"
import type { BottomSheetHandle } from "../components/BottomSheet"
import AddressEditor from "../components/AddressEditor"

export default function Profile() {
  const navigate = useCustomNavigate()
  const user = getUserData()

  const supportRef = useRef<BottomSheetHandle>(null)
  const [supportOpen, setSupportOpen] = useState(false)

  const [addressOpen, setAddressOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden">
      {/* 🎨 Glow Auras */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[15%] left-[25%] w-[360px] h-[360px] bg-purple-600/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-[8%] right-[15%] w-[280px] h-[280px] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* 👤 User Info */}
      <div className="flex flex-col items-center gap-2 text-center mb-4 relative">
        <motion.img
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          src={user.photo_url || "https://placehold.co/96x96"}
          alt="avatar"
          className="w-24 h-24 rounded-full border border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.1)]"
        />
        <button
          onClick={() => setSupportOpen(true)}
          className="absolute top-0 right-0 text-white/40 hover:text-white text-xl"
          aria-label="Поддержка"
        >❔</button>
        <div className="text-xl font-semibold drop-shadow-md">{user.first_name || "Имя"}</div>
        <div className="text-sm text-white/50">@{user.username || "user"}</div>
        <div className="text-xs text-white/30">В экосистеме 42 дней</div>
      </div>

      {/* 📦 Sections */}
      <div className="flex flex-col gap-4 pb-20">
        {getSections()}
      </div>

      {/* 🛠 Поддержка */}
      {supportOpen && (
        <BottomSheet
          ref={supportRef}
          title="Поддержка"
          onClose={() => setSupportOpen(false)}
        >
          <div className="text-left space-y-5 animate-fade-in">
            <p className="text-sm text-white/70 leading-snug">
              Свяжись с менеджером в Telegram, если у тебя возникли вопросы по расчёту, заказу или доставке.
            </p>
            <a
              href="https://t.me/your_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm font-medium text-white rounded-full py-2 bg-gradient-to-r from-sky-600/30 to-sky-400/30 border border-sky-400/40"
            >
              ✈️ Написать в Telegram
            </a>
            <p className="text-xs text-white/30 text-center mt-6">Отвечаем в течение пары минут</p>
          </div>
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

  function getSections() {
    return [
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <div className="text-xs text-white/40">Последний заказ</div>
        <div className="text-sm font-medium">👟 Nike Air Max — 7490 ₽</div>
        <div className="text-xs text-white/30">3 дня назад</div>
      </motion.div>,

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <div className="text-sm font-semibold mb-1">🎁 Награда за активность</div>
        <p className="text-xs text-white/50 mb-2">
          Сделай любой заказ — и получи скрытую награду
        </p>
        <button
          onClick={() => navigate("/calc")}
          className="w-full rounded-full bg-white/10 hover:bg-white/20 transition text-sm text-white py-2 px-4 font-medium"
        >
          Сделать заказ
        </button>
        <div className="flex flex-wrap gap-2 mt-2">
          {["🍆 Первая покупка", "🔥 5 заказов", "🧾 30k+ потрачено"].map((label, i) => (
            <span
              key={i}
              className="text-xs text-white px-3 py-1 rounded-full font-medium border border-white/20 bg-white/10"
            >
              {label}
            </span>
          ))}
        </div>
      </motion.div>,

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">🥈 Статус</span>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Silver</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-indigo-400 w-[66%]" />
        </div>
        <div className="text-xs text-white/50 mt-1">
          До <span className="text-white font-semibold">Gold</span> осталось 2 заказа
        </div>
      </motion.div>,

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <div className="text-sm font-medium mb-1">💎 Лояльность</div>
        <div className="text-sm text-white/60">+2% кэшбэк, ранний доступ к скидкам</div>
      </motion.div>,

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] cursor-pointer"
        onClick={() => setAddressOpen(true)}
      >
        <div className="text-sm font-medium mb-1">📦 Адрес доставки (СДЭК)</div>
        <div className="text-sm text-white/70">Открой для редактирования</div>
      </motion.div>,

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <div className="text-sm font-medium mb-1">👯‍♂️ Пригласи друга</div>
        <p className="text-xs text-white/50">
          Получи <span className="text-white font-semibold">+500 ₽</span> за первый заказ друга
        </p>
        <p className="text-xs text-white/30">Ссылка станет активна после авторизации</p>
      </motion.div>,

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <button
          onClick={() => setSupportOpen(true)}
          className="text-sm text-white/50 hover:text-white transition w-full text-left"
        >
          💬 Нужна поддержка? Нажми здесь
        </button>
      </motion.div>
    ]
  }
}