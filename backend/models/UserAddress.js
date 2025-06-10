import mongoose from "mongoose"

const userAddressSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  name: String,
  phone: String,
  city: String,
  city_code: Number,
  street: String,
  deliveryType: {
    type: String,
    enum: ["pickup", "address"],
    default: "pickup",
  },
  pickupCode: String,
  pickupAddress: String,
})

export default mongoose.model("UserAddress", userAddressSchema)
