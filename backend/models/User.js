// models/User.js

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  createdAt: { // ✅ Вот наше новое поле
    type: Date,
    default: Date.now // При создании нового юзера дата поставится автоматически
  }
});

// Чтобы избежать ошибки переопределения модели при перезапуске dev-сервера
export default mongoose.models.User || mongoose.model('User', userSchema);