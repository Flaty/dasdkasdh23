// src/components/OrderCreatedSheet.tsx

import { useRef } from "react";
import { motion } from "framer-motion";
import BottomSheet, { type BottomSheetHandle } from "./BottomSheet";
import { CheckCircleIcon, ChatBubbleLeftRightIcon, ClockIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { InteractiveButton } from "./ui/InteractiveButton";
import { haptic } from '../utils/haptic';

interface OrderCreatedSheetProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  estimatedPrice: number;
  category: string;
  deliveryType: string;
}

export default function OrderCreatedSheet({
  open,
  onClose,
  orderId,
  estimatedPrice,
  category,
  deliveryType
}: OrderCreatedSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);

  const handleContactManager = () => {
    // Haptic feedback для важного действия
    haptic.medium();
    
    // Открываем Telegram
    window.open(`https://t.me/Littleton59?text=Здравствуйте! Хочу оплатить заказ №${orderId}`, "_blank");
    
    // Закрываем шторку через небольшую задержку
    setTimeout(() => {
      sheetRef.current?.dismiss();
    }, 500);
  };

  const categoryLabels: Record<string, string> = {
    'accessories': 'Аксессуары',
    'shoes': 'Обувь', 
    'clothes': 'Одежда',
    'other': 'Другое'
  };

  const deliveryLabels: Record<string, string> = {
    'air': 'Авиа доставка',
    'standard': 'Обычная доставка'
  };

  return (
    <BottomSheet
      ref={sheetRef}
      title=""
      open={open}
      onClose={onClose}
    >
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Анимированная иконка успеха */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.1 
          }}
          className="relative"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-green-400" />
          </div>
          <motion.div
            className="absolute inset-0 bg-green-500/20 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Заголовки */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            Заказ создан! Остался один шаг
          </h2>
          <p className="text-sm text-white/60">
            Ваш заказ №{orderId.slice(-6)} ждет оплаты
          </p>
        </div>

        {/* Карточка с деталями заказа */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">Категория</span>
            <span className="text-white font-medium">{categoryLabels[category]}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">Доставка</span>
            <span className="text-white font-medium">{deliveryLabels[deliveryType]}</span>
          </div>
          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <span className="text-white/50 text-sm">Примерная стоимость</span>
            <span className="text-white font-bold text-lg">{estimatedPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
        </motion.div>

        {/* Основной текст */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <p className="text-sm text-white/70 leading-relaxed px-2">
            Для подтверждения и оплаты заказа, пожалуйста, напишите нашему менеджеру в Telegram. 
            Он уже получил уведомление и готов вам помочь.
          </p>

          {/* Преимущества */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <ClockIcon className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xs text-white/60">
                Ответим в течение 2-3 минут
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xs text-white/60">
                Безопасная оплата с гарантией
              </div>
            </div>
          </div>
        </motion.div>

        {/* Кнопки */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full space-y-3"
        >
          <InteractiveButton
            onClick={handleContactManager}
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            hapticType="success"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span className="font-semibold">Связаться с менеджером</span>
          </InteractiveButton>

          <button
            onClick={() => sheetRef.current?.dismiss()}
            className="w-full text-sm text-white/50 py-2 hover:text-white/70 transition-colors"
          >
            Закрыть и связаться позже
          </button>
        </motion.div>

        {/* Дополнительная информация */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-2 border-t border-white/10 w-full"
        >
          <p className="text-xs text-white/40 leading-relaxed">
            💡 Совет: Сохраните номер заказа. Менеджер может его спросить для быстрой идентификации.
          </p>
        </motion.div>
      </div>
    </BottomSheet>
  );
}