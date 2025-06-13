// src/components/OrderDetails.tsx

import { CheckIcon, ClockIcon, MessageSquare } from 'lucide-react';
// ✨ 1. ИМПОРТИРУЕМ НАШ ГЛАВНЫЙ ТИП ЗАКАЗА
import type { Order } from '../utils/types';

// Константы выносим за пределы компонента
const statusPipeline = [
  'pending', 'awaiting_payment', 'paid', 'to_warehouse', 'at_warehouse',
  'to_moscow', 'in_moscow', 'shipped_cdek', 'ready_for_pickup', 'completed'
];

const statusLabels: Record<string, string> = {
  pending: "На проверке",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен", // ✅ ИЗМЕНЕНО ПО ТВОЕЙ ПРОСЬБЕ
  to_warehouse: "Едет на склад",
  at_warehouse: "На складе в Китае",
  to_moscow: "Едет в Москву",
  in_moscow: "В Москве",
  shipped_cdek: "Отправлен СДЭК",
  ready_for_pickup: "Готов к выдаче",
  completed: "Завершён",
  rejected: "Отклонён"
};

const categoryLabels: Record<string, string> = {
  'accessories': 'Аксессуары',
  'shoes': 'Обувь', 
  'clothes': 'Одежда',
  'other': 'Другое' // ✅ ПЕРЕВОД ДЛЯ 'other'
};

// ✨ 2. ОБНОВЛЯЕМ ТИП ПРОПСОВ, ЧТОБЫ ИСПОЛЬЗОВАТЬ ПРАВИЛЬНЫЙ ИНТЕРФЕЙС
type OrderDetailsProps = {
  order: Order;
};

export default function OrderDetails({ order }: OrderDetailsProps) {
  const currentStatusIndex = statusPipeline.indexOf(order.status);
  
  // Создаем "безопасный" ID, который работает и для старых, и для новых заказов
  const displayId = order.publicId || order.id || '';
  
  // Получаем переведенное название категории
  const displayCategory = categoryLabels[order.category] || order.category;

  if (order.status === 'rejected') {
    return (
      <div className="space-y-6 p-2">
        <div className="text-center p-4">
          <h3 className="text-lg font-bold text-red-400">Заказ отклонён</h3>
          <p className="text-sm text-white/50 mt-2">
            К сожалению, мы не смогли обработать ваш заказ. 
            Пожалуйста, свяжитесь с поддержкой для уточнения деталей.
          </p>
        </div>
        <div className="px-2">
          {/* ✨ БОНУС: Добавляем ID заказа в ссылку для удобства */}
          <a 
            href={`https://t.me/Littleton59?text=Здравствуйте, у меня вопрос по отклонённому заказу №${displayId}`}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => { if (navigator.vibrate) navigator.vibrate(20); }}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white rounded-xl py-3 bg-red-500/20 border border-red-400/40 hover:bg-red-500/30 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Узнать причину отклонения
          </a>
        </div>
      </div>
    );
  }

    return (
    <div className="p-2 space-y-6">
      <div>
        {/* ✅ ИСПОЛЬЗУЕМ КОРОТКИЙ displayId */}
        <h3 className="text-lg font-bold text-white">Заказ №{displayId}</h3>
        {/* ✅ ИСПОЛЬЗУЕМ ПЕРЕВЕДЕННУЮ КАТЕГОРИЮ */}
        <p className="text-sm text-white/50">{displayCategory} — {order.price.toLocaleString('ru-RU')} ₽</p>
      </div>

      <div className="space-y-4">
        {statusPipeline.map((statusKey, index) => {
          const isCompleted = currentStatusIndex >= index;
          const isCurrent = currentStatusIndex === index;
          return (
            <div key={statusKey} className="flex items-start gap-4">
              <div className="relative flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'} ${isCurrent ? 'ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''}`}>
                  {isCompleted ? <CheckIcon size={16} /> : <ClockIcon size={16} />}
                </div>
                {index < statusPipeline.length - 1 && (<div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-white/10" />)}
              </div>
              <div className={`pt-1 transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                <p className={`font-medium text-sm ${isCompleted ? 'text-white' : 'text-white/70'}`}>{statusLabels[statusKey] || statusKey}</p>
                {isCurrent && (<p className="text-xs text-green-400/80 animate-pulse">Текущий этап</p>)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <a 
          href={`https://t.me/Littleton59?text=Здравствуйте, у меня вопрос по заказу №${displayId}`}
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => { if (navigator.vibrate) navigator.vibrate(20); }}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white rounded-xl py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Задать вопрос по заказу
        </a>
        <p className="text-xs text-white/40 text-center mt-2">Ответим в течение пары минут</p>
      </div>
    </div>
  );
}