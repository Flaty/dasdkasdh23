import { useEffect, useState } from "react";
import { getUserData } from "../utils/user";
import { motion, AnimatePresence } from "framer-motion";
import { OrdersSkeleton } from "../components/skeletons/OrdersSkeleton";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-900/20 text-yellow-400 border-yellow-400/20";
    case "approved":
      return "bg-green-900/20 text-green-400 border-green-400/20";
    case "rejected":
      return "bg-neutral-800 text-[#888] border-neutral-700";
    case "to-warehouse":
      return "bg-blue-900/20 text-blue-400 border-blue-400/20";
    case "to-moscow":
      return "bg-purple-900/20 text-purple-400 border-purple-400/20";
    default:
      return "bg-neutral-800 text-[#888] border-neutral-700";
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

const hapticFeedback = (type: 'light' | 'medium' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(type === 'light' ? [10] : [15]);
  }
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const filterVariants = {
  inactive: { 
    scale: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)"
  },
  active: { 
    scale: 1.02,
    backgroundColor: "rgba(255,255,255,1)",
    borderColor: "rgba(255,255,255,0.2)",
    color: "#000",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  hover: {
    scale: 1.05,
    backgroundColor: "rgba(255,255,255,0.1)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

export default function OrdersPage() {
  const user = getUserData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:3001/api/orders?userId=${user.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Ошибка при загрузке заказов", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [statusFilter]);

  const handleRefresh = async () => {
    hapticFeedback('medium');
    setRefreshing(true);
    await fetchOrders();
  };

  const handleFilterChange = (status: string) => {
    hapticFeedback('light');
    setStatusFilter(statusFilter === status ? null : status);
  };

  const handleOrderClick = (orderId: string) => {
    hapticFeedback('light');
    // TODO: Navigate to order details
    alert(`Открыт заказ №${orderId}`);
  };

  if (loading) return <OrdersSkeleton />;

  const sortedOrders = [...orders]
    .filter((o) => !statusFilter || o.status === statusFilter)
    .sort(
      (a, b) =>
        (statusPriority[a.status as keyof typeof statusPriority] ?? 99) -
        (statusPriority[b.status as keyof typeof statusPriority] ?? 99)
    );

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden">
      <motion.div 
        className="flex flex-col gap-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header with refresh */}
        <motion.div 
          className="flex items-center justify-between"
          variants={cardVariants}
        >
          <h1 className="text-ui-h1">Мои заказы</h1>
          <motion.button
            onClick={handleRefresh}
            className="p-2 rounded-full bg-white/5 border border-white/10"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            animate={refreshing ? { rotate: 360 } : {}}
            transition={refreshing ? { 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            } : {
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            🔄
          </motion.button>
        </motion.div>

        {/* 🔍 ФИЛЬТРЫ */}
        <motion.div 
          className="bg-[#0f0f10] pt-1 pb-2"
          variants={cardVariants}
        >
          <div className="flex gap-2 flex-wrap text-sm font-medium">
            {["pending", "to-warehouse", "to-moscow", "approved", "rejected"].map((status) => (
              <motion.button
                key={status}
                onClick={() => handleFilterChange(status)}
                className="px-3 py-1 rounded-full border transition-all duration-200"
                variants={filterVariants}
                initial="inactive"
                animate={statusFilter === status ? "active" : "inactive"}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                {getStatusLabel(status)}
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {statusFilter && (
              <motion.div 
                className="text-xs text-white/40 mt-1 px-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                Показаны: <span className="text-white font-medium">{getStatusLabel(statusFilter)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 💾 СОДЕРЖИМОЕ */}
        <AnimatePresence mode="wait">
          {sortedOrders.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mt-16"
            >
              <div className="text-4xl mb-4">📦</div>
              <p className="text-sm text-white/40">
                {statusFilter 
                  ? `Нет заказов со статусом "${getStatusLabel(statusFilter)}"`
                  : "У вас пока нет заказов"
                }
              </p>
              {!statusFilter && (
                <motion.button
                  onClick={() => window.location.href = '/calc'}
                  className="mt-4 px-6 py-2 bg-white/10 rounded-full text-sm font-medium border border-white/20"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Сделать первый заказ
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="orders-list"
              className="flex flex-col gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {sortedOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    variants={cardVariants}
                    layout
                    onClick={() => handleOrderClick(order.id)}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 cursor-pointer transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    whileHover={{ 
                      scale: 1.02,
                      y: -2,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* 🧾 ХЕДЕР */}
                    <div className="flex justify-between items-center">
                      <motion.div 
                        className="text-sm font-medium text-white"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        №{order.id.slice(-6)}
                      </motion.div>
                      <motion.span
                        className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap leading-5 border ${getStatusColor(order.status)}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: i * 0.05 + 0.1,
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {getStatusLabel(order.status)}
                      </motion.span>
                    </div>

                    {/* 📦 ДЕТАЛИ */}
                    <motion.div 
                      className="text-xs text-white/50 leading-snug mt-2 space-y-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + 0.2 }}
                    >
                      <div>
                        {formatDate(order.createdAt)} · {order.category}
                      </div>
                      <div className="flex items-center gap-1">
                        {order.shipping === "air" ? "✈️ Авиа доставка" : "🚚 Обычная доставка"}
                      </div>
                    </motion.div>

                    {/* 💰 СУММА */}
                    <motion.div 
                      className="text-lg font-bold text-white mt-3 flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: i * 0.05 + 0.3,
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                    >
                      {order.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽
                      {order.price > 100000 && (
                        <motion.span 
                          className="ml-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full"
                          animate={{ 
                            scale: [1, 1.05, 1],
                            opacity: [0.8, 1, 0.8]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          🔥 Высокая сумма
                        </motion.span>
                      )}
                    </motion.div>

                    {/* Progress indicator for active orders */}
                    {(order.status === "pending" || order.status === "to-warehouse" || order.status === "to-moscow") && (
                      <motion.div 
                        className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: i * 0.05 + 0.4, duration: 0.5 }}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ 
                            width: order.status === "pending" ? "25%" : 
                                   order.status === "to-warehouse" ? "50%" : 
                                   order.status === "to-moscow" ? "75%" : "100%"
                          }}
                          transition={{ 
                            delay: i * 0.05 + 0.6,
                            duration: 0.8,
                            ease: "easeOut"
                          }}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pull to refresh indicator */}
        <AnimatePresence>
          {refreshing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium border border-white/20"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Обновление...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}