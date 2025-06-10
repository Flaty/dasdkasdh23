const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/telegram-orders"; // или твой Atlas URI

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB подключена");
  } catch (err) {
    console.error("❌ Ошибка подключения к MongoDB:", err);
  }
}

module.exports = connectDB;
