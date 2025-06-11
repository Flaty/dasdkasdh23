import { getUserData } from "../utils/user"
import { useCustomNavigate } from "../utils/useCustomNavigate"
import { motion } from "framer-motion"
import { useRef, useState } from "react"
import BottomSheet from "../components/BottomSheet"
import type { BottomSheetHandle } from "../components/BottomSheet"
import AddressEditor from "../components/AddressEditor"
import { ProfileCard } from "../components/ui/Card"

export default function Profile() {
  const navigate = useCustomNavigate()
  const user = getUserData()

  const supportRef = useRef<BottomSheetHandle>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden max-w-screen mx-auto">
      {/* 🎨 Glow Auras */}
{/* 🎨 Glow Auras */}
<div
  id="glow-wrapper"
  className="absolute top-0 left-0 right-0 bottom-0 z-[-10] pointer-events-none overflow-hidden"
>
  <div
    className="absolute top-[15%] left-[25%] w-[360px] h-[360px] rounded-full"
    style={{
      backgroundColor: "transparent",
      boxShadow: "0 0 160px 80px rgba(147, 51, 234, 0.2)",
    }}
  />
  <div
    className="absolute bottom-[8%] right-[15%] w-[280px] h-[280px] rounded-full"
    style={{
      backgroundColor: "transparent",
      boxShadow: "0 0 120px 60px rgba(59, 130, 246, 0.2)",
    }}
  />
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
        <AnimatedCard delay={0.3}>
          <ProfileCard
            title="👟 Последний заказ"
            subtitle="3 дня назад"
          >
            <div className="text-sm font-medium">Nike Air Max — 7490 ₽</div>
          </ProfileCard>
        </AnimatedCard>

        <AnimatedCard delay={0.35}>
          <ProfileCard
            title="🎁 Награда за активность"
            subtitle="Сделай любой заказ — и получи скрытую награду"
          >
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
          </ProfileCard>
        </AnimatedCard>

        <AnimatedCard delay={0.4}>
          <ProfileCard
            title="🥈 Статус"
            subtitle="До Gold осталось 2 заказа"
          >
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-2">
              <div className="h-full bg-indigo-400 w-[66%]" />
            </div>
          </ProfileCard>
        </AnimatedCard>

        <AnimatedCard delay={0.45}>
          <ProfileCard
            title="💎 Лояльность"
            subtitle="+2% кэшбэк, ранний доступ к скидкам"
          />
        </AnimatedCard>

        <AnimatedCard delay={0.5}>
          <ProfileCard
            title="📦 Адрес доставки (СДЭК)"
            subtitle="Открой для редактирования"
            onClick={() => setAddressOpen(true)}
          />
        </AnimatedCard>

        <AnimatedCard delay={0.55}>
          <ProfileCard
            title="👯‍♂️ Пригласи друга"
            subtitle="Получи +500 ₽ за первый заказ друга"
          >
            <p className="text-xs text-white/30 mt-1">Ссылка станет активна после авторизации</p>
          </ProfileCard>
        </AnimatedCard>

        <AnimatedCard delay={0.6}>
          <ProfileCard
            title="💬 Нужна поддержка? Нажми здесь"
            onClick={() => setSupportOpen(true)}
          />
        </AnimatedCard>
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
    </div>
  )
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      {children}
    </motion.div>
  )
}
