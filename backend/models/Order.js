const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: String,
  userId: Number,
  username: String,
  link: String,
  category: String,
  shipping: String, // 'avia' | 'обычная'
  price: Number,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'to-warehouse', 'to-moscow'],
    default: 'pending'
  },

  // 👇 Новые поля
  deliveryType: { type: String, enum: ['address', 'pickup'], default: 'pickup' }, // что выбрал юзер
  city: String,        // например: 'Москва'
  street: String,      // если адрес
  fullName: String,    // имя получателя
  phone: String,       // контактный телефон
  pickupCode: String,  // если ПВЗ — код пункта выдачи из СДЭК
  pickupAddress: String, // если ПВЗ — человеко-читаемый адрес

  createdAt: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model('Order', OrderSchema);
