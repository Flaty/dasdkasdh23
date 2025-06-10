import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import FloatingInput from "../components/FloatingInput"
import BottomSheetSelector from "../components/BottomSheetSelector"
import { getCnyRateWithFee } from "../utils/rate"
import { getUserData } from "../utils/user"
import { addToCart } from "../api/cart"
import { createOrder } from "../api/createOrder"
import { useCustomNavigate } from "../utils/useCustomNavigate"
import { useToast } from "../components/ToastProvider"
import { CalcSkeleton } from "../components/skeletons/CalcSkeleton"
import { ShoppingBagIcon, TruckIcon, CubeIcon, TagIcon, LinkIcon, CurrencyYenIcon } from "@heroicons/react/24/outline"

// Haptic feedback
const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    const patterns = { light: [10], medium: [15], heavy: [25] }
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
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
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

const resultVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: -10,
    transition: { duration: 0.2 }
  }
}

export default function Calc() {
  const [url, setUrl] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [delivery, setDelivery] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastCalcInput, setLastCalcInput] = useState<{ price: string; delivery: string } | null>(null)
  const [show, setShow] = useState(false)
  const [resultVisible, setResultVisible] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const toast = useToast()
  const customNavigate = useCustomNavigate()

  useEffect(() => {
    setShow(true)
    // Simulate initial loading
    setTimeout(() => setPageLoading(false), 800)
  }, [])

  function setResultWithFade(text: string) {
    setResult(text)
    setLoading(false)
    setTimeout(() => setResultVisible(true), 10)
  }

  async function handleCalc() {
    const currentInput = { price, delivery }
    if (!delivery) return setResultWithFade("Выберите способ доставки")
    if (lastCalcInput && lastCalcInput.price === price && lastCalcInput.delivery === delivery) return
    
    hapticFeedback('light')
    setLastCalcInput(currentInput)
    setResultVisible(false)
    setResult("")
    setLoading(true)

    try {
      const rate = await getCnyRateWithFee()
      const fixFee = 590
      const deliveryCost = delivery === "air" ? 800 : delivery === "standard" ? 400 : 0
      const priceCny = Number(price.replace(",", ".").trim())
      if (!price) return setResultWithFade("Введите цену товара")
      if (isNaN(priceCny) || priceCny <= 0) return setResultWithFade("Некорректная цена")

      const total = Math.round(priceCny * rate + fixFee + deliveryCost)
      setResult(`Итог: ${total} ₽\n(курс: ${rate}₽, фикс: ${fixFee}₽, доставка: ${deliveryCost}₽)`)
    } catch {
      setResult("Ошибка при расчёте")
    }

    setLoading(false)
    setTimeout(() => setResultVisible(true), 10)
  }

  async function handleAddToCart() {
    if (!url || !price || !category || !delivery) {
      toast("❌ Пожалуйста, заполните все поля")
      return
    }
    const user = getUserData()
    if (!user) {
      toast("❌ Пользователь не найден")
      return
    }

    try {
      hapticFeedback('medium')
      setSubmitting(true)
      await addToCart({ userId: user.id, link: url, category, shipping: delivery, price: Number(price) })
      toast("✅ Товар добавлен в корзину")
    } catch (err) {
      toast("❌ Ошибка при добавлении в корзину")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit() {
    if (!url || !price || !category || !delivery) {
      toast("❌ Пожалуйста, заполните все поля")
      return
    }
    const user = getUserData()
    if (!user) {
      toast("❌ Пользователь не найден")
      return
    }

    try {
      hapticFeedback('heavy')
      setSubmitting(true)
      const rawPoizonPrice = Number(price.replace(",", ".").trim())
      if (isNaN(rawPoizonPrice) || rawPoizonPrice <= 0) {
        toast("❌ Некорректная цена")
        return
      }

      await createOrder({
        userId: user.id,
        username: user.username,
        link: url,
        category,
        shipping: delivery,
        rawPoizonPrice,
      })

      toast("✅ Заказ оформлен")
      setTimeout(() => {
        customNavigate("/profile", "forward")
      }, 1800)
    } catch (err) {
      toast("❌ Ошибка при отправке заказа")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (pageLoading) return <CalcSkeleton />

  return (
    <motion.div 
      className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col space-y-6">

        {/* Заголовок */}
        <motion.div 
          className="flex flex-col gap-1"
          variants={itemVariants}
        >
          <h1 className="text-ui-h1 leading-[32px]">Рассчитать стоимость</h1>
          <p className="text-sm text-white/40">Узнай итоговую цену прямо сейчас</p>
        </motion.div>

        {/* ССЫЛКА */}
        <motion.div 
          className="flex flex-col gap-2"
          variants={itemVariants}
        >
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Ссылка на товар
          </label>
          <motion.input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 text-sm outline-none ring-2 ring-transparent focus:ring-white/20 focus:border-white/30 transition-all duration-300"
            placeholder="https://dw4.co/item/..."
            value={url}
            onInput={(e) => setUrl(e.currentTarget.value)}
            whileFocus={{ 
              scale: 1.01,
              transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
          />
        </motion.div>

        {/* КАТЕГОРИЯ */}
        <motion.div 
          className="flex flex-col gap-2"
          variants={itemVariants}
        >
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            Категория товара
          </label>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <BottomSheetSelector
              title="Категория товара"
              value={category}
              setValue={setCategory}
              placeholder="Выбери категорию"
              options={[
                { label: "🎽 Аксессуары", value: "accessories" },
                { label: "👟 Обувь", value: "shoes" },
                { label: "👕 Одежда", value: "clothes" },
                { label: "📦 Другое", value: "other" },
              ]}
            />
          </motion.div>
        </motion.div>

        {/* ДОСТАВКА */}
        <motion.div 
          className="flex flex-col gap-2"
          variants={itemVariants}
        >
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
            <TruckIcon className="w-4 h-4" />
            Способ доставки
          </label>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <BottomSheetSelector
              title="Способ доставки"
              value={delivery}
              setValue={setDelivery}
              placeholder="Выбери способ"
              options={[
                { label: "✈️ Авиа — 800₽", value: "air" },
                { label: "🚚 Обычная — 400₽", value: "standard" },
              ]}
            />
          </motion.div>
        </motion.div>

        {/* ЦЕНА */}
        <motion.div 
          className="flex flex-col gap-2"
          variants={itemVariants}
        >
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
            <CurrencyYenIcon className="w-4 h-4" />
            Цена в юанях
          </label>
          <motion.input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 text-sm outline-none ring-2 ring-transparent focus:ring-white/20 focus:border-white/30 transition-all duration-300"
            placeholder="Например: 499"
            value={price}
            onInput={(e) => setPrice(e.currentTarget.value)}
            whileFocus={{ 
              scale: 1.01,
              transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
          />
        </motion.div>

        {/* КНОПКА РАСЧЁТА */}
        <motion.button
          onClick={handleCalc}
          disabled={loading}
          className="min-h-[48px] rounded-2xl bg-white text-black font-semibold text-sm transition-all duration-300 disabled:opacity-50"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: "#f5f5f5",
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
              />
              Рассчитываем...
            </div>
          ) : (
            "🧮 Рассчитать цену"
          )}
        </motion.button>

        {/* РЕЗУЛЬТАТ */}
        <AnimatePresence mode="wait">
          {resultVisible && (
            <motion.div
              key="calc-result"
              variants={resultVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <motion.div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4 text-white backdrop-blur-sm">
                <motion.div 
                  className="text-lg font-bold mb-2 flex items-center gap-2"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  💰 {result.split("\n")[0].replace("Итог: ", "")}
                </motion.div>

                <motion.div 
                  className="text-sm text-white/60 leading-relaxed whitespace-pre-line"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {result.split("\n").slice(1).join("\n")}
                </motion.div>

                <motion.div 
                  className="pt-3 border-t border-white/10 text-xs text-white/40 flex items-center gap-2 mt-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-green-400">✓</span>
                  Всё готово — можешь оформить заказ
                </motion.div>
              </motion.div>

              <motion.button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full min-h-[48px] bg-gradient-to-r from-green-600/20 to-emerald-500/20 border border-green-400/30 text-white font-semibold text-sm rounded-2xl transition-all duration-300 hover:from-green-600/30 hover:to-emerald-500/30 disabled:opacity-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 0 20px rgba(34, 197, 94, 0.2)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Отправка...
                  </div>
                ) : (
                  "🚀 Оформить заказ"
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  )
}