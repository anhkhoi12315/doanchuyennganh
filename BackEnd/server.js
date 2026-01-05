const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const swaggerDocs = require("./swagger"); 
dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Lưu io instance vào app để dùng trong controllers
app.set('io', io);


app.use(express.json());
app.use(cors());

app.use('/image', express.static('image'));
app.use('/img', express.static('../FrontEnd/img'));

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const behaviorRoutes = require("./routes/behaviorRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");
const adminOrderRoutes = require("./routes/admin/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const supportRoutes = require("./routes/supportRoutes");
const couponRoutes = require("./routes/couponRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const bannerRoutes = require("./routes/bannerRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/banners', bannerRoutes);

// Payment routes - Load after all other routes
try {
  const paymentRoutes = require("./routes/paymentRoutes");
  app.use('/api/payment', paymentRoutes);
  console.log('✅ Payment routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading payment routes:', err.message);
  console.error('Stack:', err.stack);
}
app.get("/", (req, res) => {
  res.send("API đang chạy! Thêm /docs để mở Swagger");
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global error handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 5000;

// Start server then connect DB
httpServer.listen(PORT, async () => {
  console.log(`Máy chủ chạy trên port ${PORT}`);
  console.log(`Socket.io đang chạy`);
  swaggerDocs(app, PORT);
  
  // Connect to database after server is listening
  await connectDB();
  console.log('Server sẵn sàng nhận requests');
});
