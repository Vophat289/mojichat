import express from "express";
import dotenv from "dotenv";
import http from "http";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cors from "cors";
import { initSocket } from "./libs/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Tạo HTTP server từ Express app để dùng với Socket.io
const httpServer = http.createServer(app);

// Khởi tạo Socket.io
const io = initSocket(httpServer);

// Lưu io vào app để có thể dùng trong controllers nếu cần
app.set('io', io);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Public routes
app.use("/api/auth", authRoute);

// Private routes (yêu cầu xác thực)
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);

// Error handler (phải đặt ở cuối cùng)
app.use(errorHandler);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    console.log(`Socket.io đã được khởi tạo`);
  });
});
