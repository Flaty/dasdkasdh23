// models/Order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  id: String,
  userId: Number,
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Используем mongoose.models для предотвращения ошибки при hot-reload
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);