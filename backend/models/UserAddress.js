// models/UserAddress.js
import mongoose from "mongoose";

const userAddressSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  name: String,
  phone: String,
  city: String,
  city_code: {
    type: Number, // По-прежнему храним как число
    // Эта функция будет вызвана перед сохранением.
    // Она попытается преобразовать любое входящее значение в число.
    set: v => (typeof v === 'string' ? parseInt(v, 10) : v) 
  },
  street: String,
  deliveryType: {
    type: String,
    enum: ["pickup", "address"],
    default: "pickup",
  },
  pickupCode: String,
  pickupAddress: String,
});

export default mongoose.models.UserAddress || mongoose.model("UserAddress", userAddressSchema);