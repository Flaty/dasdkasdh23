// src/pages/OrdersPage.tsx

import { useEffect, useState, useRef } from "react";
// ✨ 1. ИМПОРТИРУЕМ НАШ АВТОРИЗОВАННЫЙ FETCH
import { fetchWithAuth } from "../api/fetchWithAuth"; 
import BottomSheet, { type BottomSheetHandle } from "../components/BottomSheet"; 
import { OrderCard } from "../components/ui/Card"
import OrderDetails from "../components/OrderDetails"; 
import type { Order } from '../utils/types'; //


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

const getStatusLabel = (status: string) => statusLabels[status] || "Неизвестный статус";

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const activeStatuses = ['pending', 'awaiting_payment', 'paid', 'to_warehouse', 'at_warehouse', 'to_moscow', 'in_moscow', 'shipped_cdek'];
const readyStatuses = ['ready_for_pickup'];
const archiveStatuses = ['completed', 'rejected'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'ready' | 'archive'>('active');

  const detailsSheetRef = useRef<BottomSheetHandle>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        // ✨ 3. ИСПОЛЬЗУЕМ FETCH С АВТОРИЗАЦИЕЙ
        const res = await fetchWithAuth('/api/orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Ошибка при загрузке заказов", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [statusFilter]);

  // Я ВЕРНУЛ ТВОЮ ОРИГИНАЛЬНУЮ ЛОГИКУ КЛИКА. ОНА БУДЕТ РАБОТАТЬ.
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'active') return activeStatuses.includes(order.status);
    if (statusFilter === 'ready') return readyStatuses.includes(order.status);
    if (statusFilter === 'archive') return archiveStatuses.includes(order.status);
    return true;
  });

  const sortedOrders = filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

 return (
    <>
      {/* Я УБРАЛ СВОИ ЛИШНИЕ ОБЕРТКИ. ТЕПЕРЬ ТВОЙ ОРИГИНАЛЬНЫЙ ДИЗАЙН. */}
      <div className="px-4 pb-4 space-y-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-ui-h1">Мои заказы</h1>

          <div className="pt-1 pb-2">
            <div className="flex gap-2 text-sm font-medium">
                {/* ...твои кнопки фильтров... */}
                <button onClick={() => setStatusFilter('active')} className={`px-4 py-1.5 rounded-full border border-white/10 transition-all duration-200 ${statusFilter === 'active' ? "bg-white text-black shadow-sm" : "text-white/40 hover:bg-white/10"}`}>Активные</button>
                <button onClick={() => setStatusFilter('ready')} className={`px-4 py-1.5 rounded-full border border-white/10 transition-all duration-200 ${statusFilter === 'ready' ? "bg-white text-black shadow-sm" : "text-white/40 hover:bg-white/10"}`}>К выдаче</button>
                <button onClick={() => setStatusFilter('archive')} className={`px-4 py-1.5 rounded-full border border-white/10 transition-all duration-200 ${statusFilter === 'archive' ? "bg-white text-black shadow-sm" : "text-white/40 hover:bg-white/10"}`}>Архив</button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-white/40 px-1">Загрузка...</p>
          ) : sortedOrders.length === 0 ? (
            <p className="text-sm text-white/40 mt-8 text-center">🙃 Здесь пока пусто</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedOrders.map((order) => {
                // ✨ 4. ГЛАВНЫЙ ФИКС ОШИБКИ. БЕЗ ЛИШНИХ ИЗМЕНЕНИЙ.
                const displayId = order.publicId || ''; // Для совместимости со старыми заказами
                
                return (
                  <OrderCard
                    key={order._id} // Используем _id от Mongo, он 100% уникален
                    orderNumber={displayId} // Показываем наш новый красивый ID, без .slice()
                    status={getStatusLabel(order.status)}
                    date={formatDate(order.createdAt)}
                    category={order.shipping === "air" ? "✈️ Авиа доставка" : "🚚 Обычная доставка"}
                    price={order.price}
                    onClick={() => handleOrderClick(order)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* ТВОЙ ОРИГИНАЛЬНЫЙ BOTTOMSHEET С ТВОЕЙ ЛОГИКОЙ. ОН БУДЕТ РАБОТАТЬ. */}
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