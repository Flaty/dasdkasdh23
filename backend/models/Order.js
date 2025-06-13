// backend/models/Order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  // 🔥 НОВОЕ ПОЛЕ: Короткий, уникальный и читаемый ID для клиента и менеджера
  publicId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Индекс для быстрого поиска
  },

  // 🗑️ УДАЛЕНО ПОЛЕ: id: String, - оно больше не нужно.
  // MongoDB сама создает уникальный _id, который мы используем внутри системы.

  // --- Остальные поля остаются как были ---
  userId: { type: Number, required: true },
  username: String,
  link: String,
  category: String,
  shipping: String,
  price: Number,
  status: {
    type: String,
    enum: [
      'pending',          // На проверке
      'awaiting_payment', // Ожидает оплаты
      'paid',             // Оплачен, выкупается
      'to_warehouse',     // Едет на склад
      'at_warehouse',     // На складе
      'to_moscow',        // Едет в Москву
      'in_moscow',        // В Москве
      'shipped_cdek',     // Отправлен СДЭК
      'ready_for_pickup', // Готов к выдаче
      'completed',        // Завершен
      'rejected'          // Отклонен
    ],
    default: 'pending'
  },
  deliveryType: { type: String, enum: ['address', 'pickup'], default: 'pickup' },
  city: String,
  street: String,
  fullName: String,
  phone: String,
  pickupCode: String,
  pickupAddress: String,
}, {
  // ✨ УЛУЧШЕНИЕ: Используем встроенную опцию Mongoose.
  // Она автоматически добавит и будет управлять полями createdAt и updatedAt.
  timestamps: true
});

// Используем mongoose.models для предотвращения ошибки при hot-reload
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);