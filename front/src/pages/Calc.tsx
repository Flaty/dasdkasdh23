import { useState, useEffect } from "react"
import { ShoppingCartIcon } from "@heroicons/react/24/solid"
import FloatingInput from "../components/FloatingInput"
import PageHeader from "../components/PageHeader"
import BottomSheetSelector from "../components/BottomSheetSelector"
import { motion, AnimatePresence } from "framer-motion";
import { getCnyRateWithFee } from "../utils/rate"
import { getUserData } from "../utils/user"
import { addToCart } from "../api/cart"
import { createOrder } from "../api/createOrder"
import { useCustomNavigate } from "../utils/useCustomNavigate"
import { useToast } from "../components/ToastProvider"
import { InteractiveButton } from "../components/ui/InteractiveButton"
import { ShoppingBagIcon, TruckIcon, CubeIcon, TagIcon } from "@heroicons/react/24/outline"


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

  const toast = useToast()
  const customNavigate = useCustomNavigate()

  useEffect(() => setShow(true), [])

  function setResultWithFade(text: string) {
    setResult(text)
    setLoading(false)
    setTimeout(() => setResultVisible(true), 10)
  }

  async function handleCalc() {
    const currentInput = { price, delivery }
    if (!delivery) return setResultWithFade("Выберите способ доставки")
    if (lastCalcInput && lastCalcInput.price === price && lastCalcInput.delivery === delivery) return
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

return (
  <div className="relative min-h-screen bg-[#0a0a0a] text-white px-16px pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden font-sans fade-in">
    <div className="flex flex-col space-y-16px">

      {/* Заголовок */}
      <div className="flex flex-col gap-1 animate-fadeIn">
        <h1 className="text-ui-h1 leading-[32px]">Рассчитать стоимость</h1>
        <p className="text-sm text-white/40">Узнай итоговую цену прямо сейчас</p>
      </div>

      {/* ССЫЛКА */}
      <div className="flex flex-col gap-1 animate-fadeIn duration-300 delay-75">
        <label className="text-sm font-medium text-white/60">ССЫЛКА</label>
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-16px py-12px text-white placeholder-white/30 text-sm outline-none ring-2 ring-transparent focus:ring-white/10 transition-all duration-200 focus:shadow-white/10 focus:shadow-md"
          placeholder="https://dw4.co/item/..."
          value={url}
          onInput={(e) => setUrl(e.currentTarget.value)}
        />
      </div>

      {/* КАТЕГОРИЯ */}
      <div className="flex flex-col gap-1 animate-fadeIn duration-300 delay-100">
        <label className="text-sm font-medium text-white/60">КАТЕГОРИЯ</label>
        <BottomSheetSelector
          title="Категория товара"
          value={category}
          setValue={setCategory}
          placeholder={<span className="text-white/30">Выбери категорию</span>}
          className="rounded-xl border border-white/10 bg-white/5 px-16px py-12px text-sm text-white transition-all duration-200 hover:bg-white/10"
          options={[
            { label: (<><TagIcon className="w-4 h-4 mr-2 text-white/40" /> Аксессуары</>), value: "accessories" },
            { label: (<><ShoppingBagIcon className="w-4 h-4 mr-2 text-white/40" /> Обувь</>), value: "shoes" },
            { label: (<><CubeIcon className="w-4 h-4 mr-2 text-white/40" /> Одежда</>), value: "clothes" },
            { label: (<><TruckIcon className="w-4 h-4 mr-2 text-white/40" /> Другое</>), value: "other" },
          ]}
        />
      </div>

      {/* ДОСТАВКА */}
      <div className="flex flex-col gap-1 animate-fadeIn duration-300 delay-150">
        <label className="text-sm font-medium text-white/60">СПОСОБ ДОСТАВКИ</label>
        <BottomSheetSelector
          title="Способ доставки"
          value={delivery}
          setValue={setDelivery}
          placeholder={<span className="text-white/30">Выбери способ</span>}
          className="rounded-xl border border-white/10 bg-white/5 px-16px py-12px text-sm text-white transition-all duration-200 hover:bg-white/10"
          options={[
            { label: (<><TruckIcon className="w-4 h-4 mr-2 text-white/40" /> Авиа — 800₽</>), value: "air" },
            { label: (<><TruckIcon className="w-4 h-4 mr-2 text-white/40" /> Обычная — 400₽</>), value: "standard" },
          ]}
        />
      </div>

      {/* ЦЕНА */}
      <div className="flex flex-col gap-1 animate-fadeIn duration-300 delay-200">
        <label className="text-sm font-medium text-white/60">ЦЕНА</label>
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-16px py-12px text-white placeholder-white/30 text-sm outline-none ring-2 ring-transparent focus:ring-white/10 transition-all duration-200 focus:shadow-white/10 focus:shadow-md"
          placeholder="Например: 499"
          value={price}
          onInput={(e) => setPrice(e.currentTarget.value)}
        />
      </div>

      {/* КНОПКА РАСЧЁТА */}
      <InteractiveButton
        onClick={handleCalc}
        disabled={loading}
        className="min-h-[48px] rounded-xl bg-white text-black font-semibold text-sm transition-all duration-200 ease-out hover:scale-98 active:scale-95 animate-fadeIn delay-300"
      >
        {loading ? "Рассчитываем..." : "Рассчитать цену"}
      </InteractiveButton>

      {/* РЕЗУЛЬТАТ */}
<AnimatePresence mode="wait">
  {resultVisible && (
    <>
      <motion.div
        key="calc-result"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mt-3 rounded-xl bg-[#18181b] border border-white/10 px-4 py-3 text-white space-y-2 shadow-sm"
      >
        <div className="text-sm font-semibold">
          Итог:{" "}
          <span className="text-white/90 font-bold">
            {result.split("\n")[0].replace("Итог: ", "")}
          </span>
        </div>

        <div className="text-sm text-white/60 leading-tight whitespace-pre-line">
          {result.split("\n").slice(1).join("\n")}
        </div>

        <div className="pt-2 border-t border-white/10 text-xs text-white/40 flex items-center gap-1">
          <span className="text-white/40">ℹ️</span>
          Всё готово — можешь оформить заказ
        </div>
      </motion.div>

      <motion.div
        key="submit-btn"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="pt-3"
      >
        <InteractiveButton
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full min-h-[44px] bg-white text-black font-semibold text-sm rounded-xl transition-all duration-200 ease-out hover:scale-98 active:scale-95"
        >
          {submitting ? "Отправка..." : "Оформить заказ"}
        </InteractiveButton>
      </motion.div>
    </>
  )}
</AnimatePresence>


    </div>
  </div>
)




}
