import mongoose from "mongoose"

const CartItemSchema = new mongoose.Schema({
  userId: Number,
  link: String,
  category: String,
  shipping: String,
  price: Number,
  createdAt: { type: Date, default: Date.now },
})

const CartItem = mongoose.model("CartItem", CartItemSchema)
export default CartItem
