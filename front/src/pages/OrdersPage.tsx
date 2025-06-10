import { useEffect, useState } from "react";
import { getUserData } from "../utils/user";

interface Order {
  id: string;
  category: string;
  shipping: string;
  price: number;
  status: string;
  createdAt: string;
}

const statusPriority = {
  pending: 1,
  "to-warehouse": 2,
  "to-moscow": 3,
  approved: 4,
  rejected: 5,
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "На проверке";
    case "approved":
      return "Готов к выдаче";
    case "rejected":
      return "Отклонён";
    case "to-warehouse":
      return "На складе";
    case "to-moscow":
      return "Едет в Москву";
    default:
      return "Неизвестно";
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function OrdersPage() {
  const user = getUserData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [statusFilter]);

  const sortedOrders = [...orders]
    .filter((o) => !statusFilter || o.status === statusFilter)
    .sort(
      (a, b) =>
        (statusPriority[a.status as keyof typeof statusPriority] ?? 99) -
        (statusPriority[b.status as keyof typeof statusPriority] ?? 99)
    );

return (
  <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden">
    <div className="flex flex-col gap-4">
      <h1 className="text-ui-h1">Мои заказы</h1>

      {/* 🔍 ФИЛЬТРЫ */}
      <div className="bg-[#0f0f10] pt-1 pb-2">
        <div className="flex gap-2 flex-wrap text-sm font-medium">
          {["pending", "to-warehouse", "to-moscow", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={`px-3 py-1 rounded-full border border-white/10 transition-all duration-200 ${
                statusFilter === status
                  ? "bg-white text-black shadow-sm"
                  : "text-white/40 hover:bg-white/10"
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
        {statusFilter && (
          <div className="text-xs text-white/40 mt-1 px-1">
            Показаны: <span className="text-white font-medium">{getStatusLabel(statusFilter)}</span>
          </div>
        )}
      </div>

      {/* 💾 СОДЕРЖИМОЕ */}
      {loading ? (
        <p className="text-sm text-white/40 px-1">Загрузка...</p>
      ) : sortedOrders.length === 0 ? (
        <p className="text-sm text-white/40 mt-8 text-center">
          🙃 У вас пока нет заказов
        </p>
      ) : (
        <div className="flex flex-col gap-3"> {/* уменьшено с gap-4 */}
          {sortedOrders.map((order, i) => (
            <div
              key={order.id}
              onClick={() => alert(`Открыт заказ №${order.id}`)}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 fade-in hover:bg-white/10 transition cursor-pointer"
              style={{
                animationDelay: `${i * 40}ms`,
                animationFillMode: "both",
                animationName: "fadeIn",
                animationDuration: "0.35s",
                animationTimingFunction: "ease-out",
              }}
            >
              {/* 🧾 ХЕДЕР */}
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-white">
                  №{order.id.slice(-6)}
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap leading-5 ${
                    {
                      pending: "bg-yellow-900/20 text-yellow-400",
                      approved: "bg-green-900/20 text-green-400",
                      rejected: "bg-neutral-800 text-[#888]",
                      "to-warehouse": "bg-blue-900/20 text-blue-400",
                      "to-moscow": "bg-purple-900/20 text-purple-400",
                    }[order.status] || "bg-neutral-800 text-[#888]"
                  }`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* 📦 ДЕТАЛИ */}
              <div className="text-xs text-white/50 leading-snug mt-2 space-y-1">
                <div>
                  {formatDate(order.createdAt)} · {order.category}
                </div>
                <div className="flex items-center gap-1">
                  {order.shipping === "air" ? "✈️ Авиа доставка" : "🚚 Обычная доставка"}
                </div>
              </div>

              {/* 💰 СУММА */}
              <div className="text-lg font-bold text-white mt-3 flex items-center gap-2">
                {order.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽
                {order.price > 100000 && (
                  <span className="ml-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full animate-pulse">
                    🔥 Высокая сумма
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);


}
