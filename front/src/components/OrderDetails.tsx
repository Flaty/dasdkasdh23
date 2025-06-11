// src/components/OrderDetails.tsx

import { CheckIcon, ClockIcon } from 'lucide-react';
import type { ProfileData } from '../hook/useProfile'; // Предполагаем, что тип заказа будет здесь

// Определяем полный пайплайн статусов и их порядок
const statusPipeline = [
  'pending', 'awaiting_payment', 'paid', 'to_warehouse', 'at_warehouse',
  'to_moscow', 'in_moscow', 'shipped_cdek', 'ready_for_pickup', 'completed'
];

// Человеко-читаемые названия для статусов
const statusLabels: Record<string, string> = {
  pending: "На проверке",
  awaiting_payment: "Ожидает оплаты",
  paid: "Выкуплен",
  to_warehouse: "Едет на склад",
  at_warehouse: "На складе в Китае",
  to_moscow: "Едет в Москву",
  in_moscow: "В Москве",
  shipped_cdek: "Отправлен СДЭК",
  ready_for_pickup: "Готов к выдаче",
  completed: "Завершён",
  rejected: "Отклонён"
};

// Тип для пропсов компонента. Используем last_order из ProfileData
type OrderDetailsProps = {
  order: NonNullable<ProfileData['last_order']>;
};

export default function OrderDetails({ order }: OrderDetailsProps) {
  // Находим индекс текущего статуса в пайплайне
  const currentStatusIndex = statusPipeline.indexOf(order.status);

  // Если статус 'rejected', показываем особое состояние
  if (order.status === 'rejected') {
    return (
      <div className="text-center p-4">
        <h3 className="text-lg font-bold text-red-400">Заказ отклонён</h3>
        <p className="text-sm text-white/50 mt-2">
          К сожалению, мы не смогли обработать ваш заказ. 
          Пожалуйста, свяжитесь с поддержкой для уточнения деталей.
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-6">
      {/* --- Информация о заказе --- */}
      <div>
        <h3 className="text-lg font-bold text-white">Заказ №{order.id.slice(-6)}</h3>
        <p className="text-sm text-white/50">{order.category} — {order.price} ₽</p>
      </div>

      {/* --- Дорожная карта (Roadmap) --- */}
      <div className="space-y-4">
        {statusPipeline.map((statusKey, index) => {
          const isCompleted = currentStatusIndex >= index;
          const isCurrent = currentStatusIndex === index;

          return (
            <div key={statusKey} className="flex items-start gap-4">
              {/* Иконка этапа */}
              <div className="relative flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}
                  ${isCurrent ? 'ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''}
                `}>
                  {isCompleted ? <CheckIcon size={16} /> : <ClockIcon size={16} />}
                </div>
                {/* Линия, соединяющая этапы */}
                {index < statusPipeline.length - 1 && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-white/10" />
                )}
              </div>
              
              {/* Описание этапа */}
              <div className={`pt-1 transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                <p className={`font-medium text-sm ${isCompleted ? 'text-white' : 'text-white/70'}`}>
                  {statusLabels[statusKey] || statusKey}
                </p>
                {isCurrent && (
                  <p className="text-xs text-green-400/80 animate-pulse">Текущий этап</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}