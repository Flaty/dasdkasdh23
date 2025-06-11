// models/CartItem.js
import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  userId: Number,
  link: String,
  category: String,
  shipping: String,
  price: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CartItem || mongoose.model("CartItem", CartItemSchema);