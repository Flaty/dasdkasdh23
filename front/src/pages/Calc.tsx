// src/pages/Calc.tsx

import { useReducer, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { getUserData } from "../utils/user";
import { createOrder } from "../api/createOrder";
import { useToast } from "../components/ToastProvider";
import { useRate } from "../hook/useRate";
import { useAddress } from "../hook/useAddress";

import { InteractiveButton } from "../components/ui/InteractiveButton";
import BottomSheetSelector from "../components/BottomSheetSelector";
import OrderCreatedSheet from "../components/OrderCreatedSheet";

import AddressEditor from "../components/AddressEditor";

import { ShoppingBagIcon, TruckIcon, CubeIcon, TagIcon } from "@heroicons/react/24/outline";
import SpinnerIcon from "../components/SpinnerIcon";
import { haptic } from "../utils/haptic";

type CalcStatus = 'idle' | 'calculating' | 'calculated' | 'error' | 'submitting' | 'submitted';

interface CalcState {
  status: CalcStatus;
  url: string;
  price: string;
  category: string;
  delivery: string;
  resultText: string;
}

type CalcAction =
  | { type: 'FIELD_CHANGE'; payload: Partial<CalcState> }
  | { type: 'CALCULATE' }
  | { type: 'CALCULATION_SUCCESS'; payload: string }
  | { type: 'CALCULATION_ERROR'; payload: string }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_SUCCESS' };

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'FIELD_CHANGE':
      return { ...state, ...action.payload, status: 'idle', resultText: '' };
    case 'CALCULATE':
      return { ...state, status: 'calculating', resultText: '' };
    case 'CALCULATION_SUCCESS':
      return { ...state, status: 'calculated', resultText: action.payload };
    case 'CALCULATION_ERROR':
      return { ...state, status: 'error', resultText: action.payload };
    case 'SUBMIT':
      return { ...state, status: 'submitting' };
    case 'SUBMIT_SUCCESS':
      return { ...state, status: 'submitted' };
    default:
      return state;
  }
}

export default function Calc() {
  const initialState: CalcState = { status: 'idle', url: '', price: '', category: '', delivery: '', resultText: '' };
  const [state, dispatch] = useReducer(calcReducer, initialState);

  const [isAddressEditorOpen, setIsAddressEditorOpen] = useState(false);
  
  // ✅ Добавляем состояния для боттом-шита
  const [orderCreatedOpen, setOrderCreatedOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>("");

  const user = getUserData();
  const { data: rateData, isLoading: isRateLoading } = useRate();
  const { addressData, isLoadingAddress } = useAddress(user?.id); // Просто используй isLoadingAddress
  const toast = useToast();

  // Эта функция теперь нужна только для предварительного расчета, чтобы показать юзеру
  const handleCalc = () => {
    dispatch({ type: 'CALCULATE' });
    
    if (!rateData) {
      return dispatch({ type: 'CALCULATION_ERROR', payload: "Ошибка: не удалось загрузить курс." });
    }

    try {
      const priceCny = Number(state.price.replace(",", ".").trim());
      if (!state.price || isNaN(priceCny) || priceCny <= 0) {
        throw new Error("Введите корректную цену товара в юанях.");
      }
      
      // Временный расчет на клиенте для показа
      const fixFee = 590;
      const deliveryCost = state.delivery === "air" ? 800 : state.delivery === "standard" ? 400 : 0;
      if (deliveryCost === 0) throw new Error("Выберите способ доставки");
      const total = Math.round(priceCny * rateData.rate + fixFee + deliveryCost);
      const details = `(курс: ${rateData.rate.toFixed(2)}₽, комиссия: ${fixFee}₽, доставка: ${deliveryCost}₽)`;

      dispatch({ type: 'CALCULATION_SUCCESS', payload: `Примерно: ${total} ₽\n${details}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      dispatch({ type: 'CALCULATION_ERROR', payload: message });
    }
  };

  const handleSubmit = async () => {
    const { url, price, category, delivery } = state;

    if (!isFormFilled || !user) {
        toast("❌ Сначала заполните все поля заказа");
        return;
    }
    if (!addressData || !addressData.city_code) { // Проверяем city_code, он надежнее
      haptic.warning();
      // Вместо тоста - открываем боттом-шит
      setIsAddressEditorOpen(true);
      return; // И останавливаем выполнение
    }

    dispatch({ type: 'SUBMIT' });
    try {
      // ✅ ФИКС: Создаем "чистый" объект адреса только с нужными полями
      const cleanAddress = {
        deliveryType: addressData.deliveryType,
        city: addressData.city,
        city_code: Number(addressData.city_code),
        street: addressData.street,
        name: addressData.name,
        phone: addressData.phone,
        pickupCode: addressData.pickupCode,
        pickupAddress: addressData.pickupAddress,
        userId: addressData.userId
      };

      const result = await createOrder({
        userId: user.id,
        username: user.username || 'unknown',
        link: url,
        category,
        shipping: delivery,
        rawPoizonPrice: Number(price.replace(",", ".").trim()),
        address: cleanAddress,
      });

      // ✅ Сохраняем ID созданного заказа
      haptic.success();
      dispatch({ type: 'SUBMIT_SUCCESS' });
      
      // ✅ Открываем боттом-шит с информацией о заказе
      setCreatedOrderId(result.id);
      setOrderCreatedOpen(true);
      localStorage.setItem('unpaidOrderId', result.id);
      localStorage.setItem('unpaidOrderStatus', 'awaiting_payment');

    } catch (err) {
      haptic.error();
      toast(err instanceof Error ? err.message : "❌ Ошибка при оформлении заказа");
      dispatch({ type: 'FIELD_CHANGE', payload: { status: 'calculated' } });
    }
  };

  // ✅ Обработчик закрытия боттом-шита
  const handleOrderSheetClose = () => {
    setOrderCreatedOpen(false);
  };

  const isFormFilled = useMemo(() => !!(state.url && state.price && state.category && state.delivery), [state]);
  const isSubmitDisabled = state.status === 'submitting' || isLoadingAddress;

  const resultData = useMemo(() => {
    if (!state.resultText) return null;
    const [main, details] = state.resultText.split('\n');
    return { main: main.replace("Примерно: ", ""), details };
  }, [state.resultText]);

  return (
    <div className="px-4 pb-4 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Рассчитать стоимость</h1>
          <p className="text-sm text-white/40">Узнай итоговую цену прямо сейчас</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">Ссылка на товар</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 text-sm outline-none ring-2 ring-transparent focus:ring-white/10 transition-all duration-200"
              placeholder="https://dw4.co/item/..."
              value={state.url}
              onChange={(e) => dispatch({ type: 'FIELD_CHANGE', payload: { url: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">Категория товара</label>
            <BottomSheetSelector
              title="Категория товара" value={state.category} setValue={(v) => dispatch({ type: 'FIELD_CHANGE', payload: { category: v } })}
              placeholder={<span className="text-white/30">Выбери категорию</span>}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
              options={[
                { label: (<div className="flex items-center gap-2"><TagIcon className="w-4 h-4 text-white/40" /> Аксессуары</div>), value: "accessories" },
                { label: (<div className="flex items-center gap-2"><ShoppingBagIcon className="w-4 h-4 text-white/40" /> Обувь</div>), value: "shoes" },
                { label: (<div className="flex items-center gap-2"><CubeIcon className="w-4 h-4 text-white/40" /> Одежда</div>), value: "clothes" },
                { label: (<div className="flex items-center gap-2"><TruckIcon className="w-4 h-4 text-white/40" /> Другое</div>), value: "other" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">Способ доставки</label>
            <BottomSheetSelector
              title="Способ доставки" value={state.delivery} setValue={(v) => dispatch({ type: 'FIELD_CHANGE', payload: { delivery: v } })}
              placeholder={<span className="text-white/30">Выбери способ</span>}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
              options={[
                { label: (<div className="flex items-center gap-2"><TruckIcon className="w-4 h-4 text-white/40" /> Авиа — 800₽</div>), value: "air" },
                { label: (<div className="flex items-center gap-2"><TruckIcon className="w-4 h-4 text-white/40" /> Обычная — 400₽</div>), value: "standard" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">Цена в юанях (¥)</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 text-sm outline-none ring-2 ring-transparent focus:ring-white/10 transition-all duration-200"
              placeholder="Например: 499"
              value={state.price}
              onChange={(e) => dispatch({ type: 'FIELD_CHANGE', payload: { price: e.target.value } })}
              type="number"
              inputMode="decimal"
            />
          </div>
        </div>

        <InteractiveButton onClick={handleCalc} disabled={state.status === 'calculating' || isRateLoading}
          className="min-h-[48px] rounded-xl bg-white text-black font-semibold text-sm">
          {isRateLoading ? "Загрузка курса..." : state.status === 'calculating' ? "Расчет..." : "Рассчитать предварительно"}
        </InteractiveButton>

        <AnimatePresence>
          {state.resultText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-2 p-4 rounded-xl border ${state.status === 'error' ? 'bg-red-900/50 border-red-500/50 text-red-300' : 'bg-green-900/50 border-green-500/50 text-green-300'}`}
            >
              {state.status === 'calculated' && resultData ? (
                  <div className="text-center space-y-1">
                      <div className="text-sm text-white/60">Итоговая стоимость</div>
                      <div className="text-2xl font-bold">{resultData.main}</div>
                      <div className="text-xs text-white/40 pt-1">{resultData.details}</div>
                  </div>
              ) : (
                <p className="text-white text-center whitespace-pre-line text-sm">{state.resultText}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {(state.status === 'calculated' || state.status === 'submitting') && isFormFilled && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <InteractiveButton
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className="w-full"
                >
                  {state.status === 'submitting' 
                    ? <SpinnerIcon className="w-5 h-5"/> 
                    : isLoadingAddress 
                    ? 'Загрузка адреса...' 
                    : 'Оформить заказ'
                  }
                </InteractiveButton>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* 🔥 ШАГ 4: ДОБАВЛЯЕМ РЕНДЕР РЕДАКТОРА АДРЕСА */}
      {/* Он будет невидим, пока isAddressEditorOpen не станет true */}
      {user && (
        <AddressEditor
          userId={user.id}
          open={isAddressEditorOpen}
          onClose={() => setIsAddressEditorOpen(false)}
        />
      )}

      {/* ✅ Вот здесь подключаем наш OrderCreatedSheet */}
      {resultData && (
        <OrderCreatedSheet
          open={orderCreatedOpen}
          onClose={handleOrderSheetClose}
          orderId={createdOrderId}
          estimatedPrice={parseInt(resultData.main.replace(/\D/g, ''))}
          category={state.category}
          deliveryType={state.delivery}
        />
      )}
    </div>
  );
}