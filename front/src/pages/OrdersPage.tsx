// src/pages/OrdersPage.tsx

import { useEffect, useState } from "react";
import { getUserData } from "../utils/user";
import { useRef } from "react";
import BottomSheet, { type BottomSheetHandle } from "../components/BottomSheet"; 
import { OrderCard } from "../components/ui/Card"
import OrderDetails from "../components/OrderDetails"; 

interface Order {
  id: string;
  category: string;
  shipping: string;
  price: number;
  status: string; // Это будет ключ, например, 'awaiting_payment'
  createdAt: string;
}

// ✅ 1. Создаем "словарь" для статусов. 
// Ключ - статус с бэкенда, значение - текст для пользователя.
const statusLabels: Record<string, string> = {
  pending: "На проверке",
  awaiting_payment: "Ожидает оплаты",
  paid: "Выкупается",
  to_warehouse: "Едет на склад в Китае",
  at_warehouse: "На складе в Китае",
  to_moscow: "Едет в Москву",
  in_moscow: "В Москве",
  shipped_cdek: "Отправлен СДЭК",
  ready_for_pickup: "Готов к выдаче",
  completed: "Завершен",
  rejected: "Отклонен",
};

// Функция для получения лейбла, с фолбэком на неизвестный статус
const getStatusLabel = (status: string) => statusLabels[status] || "Неизвестный статус";

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ✅ 2. Определяем группы статусов для фильтров
const activeStatuses = ['pending', 'awaiting_payment', 'paid', 'to_warehouse', 'at_warehouse', 'to_moscow', 'in_moscow', 'shipped_cdek'];
const readyStatuses = ['ready_for_pickup'];
const archiveStatuses = ['completed', 'rejected'];

export default function OrdersPage() {
  const user = getUserData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // ✅ 3. Теперь фильтр - это строка 'active', 'ready' или 'archive'
  const [statusFilter, setStatusFilter] = useState<'active' | 'ready' | 'archive'>('active');


  const detailsSheetRef = useRef<BottomSheetHandle>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      try {
        const res = await fetch(`http://localhost:3001/api/orders?userId=${user.id}`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Ошибка при загрузке заказов", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [statusFilter]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // ✅ 4. Логика фильтрации и сортировки
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'active') return activeStatuses.includes(order.status);
    if (statusFilter === 'ready') return readyStatuses.includes(order.status);
    if (statusFilter === 'archive') return archiveStatuses.includes(order.status);
    return true; // На случай если фильтр не выбран
  });

  // Можно добавить сортировку, например, по дате
  const sortedOrders = filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

 return (
    // ✅ Оборачиваем все в React-фрагмент
    <>
      <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden no-scrollbar">
        <div className="flex flex-col gap-4">
          <h1 className="text-ui-h1">Мои заказы</h1>

          {/* Кнопки фильтров */}
          <div className="bg-[#0f0f10] pt-1 pb-2">
            <div className="flex gap-2 text-sm font-medium">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-1.5 rounded-full border border-white/10 transition-all duration-200 ${
                  statusFilter === 'active' ? "bg-white text-black shadow-sm" : "text-white/40 hover:bg-white/10"
                }`}
              >
                Активные
              </button>
              <button
                onClick={() => setStatusFilter('ready')}
                className={`px-4 py-1.5 rounded-full border border-white/10 transition-all duration-200 ${
                  statusFilter === 'ready' ? "bg-white text-black shadow-sm" : "text-white/40 hover:bg-white/10"
                }`}
              >
                К выдаче
              </button>
              <button
                onClick={() => setStatusFilter('archive')}
                className={`px-4 py-1.5 rounded-full border border-white/10 transition-all duration-200 ${
                  statusFilter === 'archive' ? "bg-white text-black shadow-sm" : "text-white/40 hover:bg-white/10"
                }`}
              >
                Архив
              </button>
            </div>
          </div>

          {/* Список заказов */}
          {loading ? (
            <p className="text-sm text-white/40 px-1">Загрузка...</p>
          ) : sortedOrders.length === 0 ? (
            <p className="text-sm text-white/40 mt-8 text-center">
              🙃 Здесь пока пусто
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedOrders.map((order, i) => (
                <OrderCard
                  key={order.id}
                  orderNumber={order.id.slice(-6)}
                  status={getStatusLabel(order.status)}
                  date={formatDate(order.createdAt)}
                  category={order.shipping === "air" ? "✈️ Авиа доставка" : "🚚 Обычная доставка"}
                  price={order.price}
                  onClick={() => handleOrderClick(order)}
                  className="fade-in"
                  style={{
                    animationDelay: `${i * 40}ms`,
                    animationFillMode: "both",
                    animationName: "fadeIn",
                    animationDuration: "0.35s",
                    animationTimingFunction: "ease-out",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 
        ✅ Вот куда вставляется BottomSheet.
        Он находится на одном уровне с основным div'ом страницы.
      */}
      {selectedOrder && (
        <BottomSheet
          ref={detailsSheetRef}
          title="Детали заказа"
          open={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        >
          <OrderDetails order={selectedOrder} />
        </BottomSheet>
      )}
    </>
  );
}