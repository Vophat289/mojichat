import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Map lưu userId -> Set of socketIds (user có thể login nhiều tab)
const onlineUsers = new Map();

export const getOnlineUsers = () => onlineUsers;

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Middleware xác thực JWT cho socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Không tìm thấy token'));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select('-hashedPassword');

      if (!user) return next(new Error('Người dùng không tồn tại'));

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Token không hợp lệ hoặc đã hết hạn'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User ${socket.user.username} kết nối: ${socket.id}`);

    // Thêm vào onlineUsers
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Thông báo online cho tất cả
    io.emit('user_online', { userId });

    // ───── JOIN CONVERSATION ROOM ─────
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`[Socket] ${socket.user.username} join room: ${conversationId}`);
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(conversationId);
    });

    // ───── GỬI TIN NHẮN REALTIME ─────
    // Đây là emit từ server sau khi REST API /sendMessage đã lưu DB thành công
    // Client gọi REST API → server emit → client khác nhận
    socket.on('message_sent', ({ conversationId, message }) => {
      // Broadcast cho tất cả người trong room NGOẠI TRỪ người gửi
      socket.to(conversationId).emit('receive_message', { conversationId, message });
    });

    // ───── TYPING INDICATORS ─────
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', {
        userId,
        username: socket.user.username,
        displayName: socket.user.displayName,
        conversationId
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stop_typing', {
        userId,
        conversationId
      });
    });

    // ───── MARK AS READ ─────
    socket.on('mark_read', ({ conversationId }) => {
      socket.to(conversationId).emit('message_read', {
        userId,
        conversationId
      });
    });

    // ───── FRIEND REQUEST REALTIME ─────
    socket.on('friend_request_sent', ({ toUserId, request }) => {
      const toSockets = onlineUsers.get(toUserId.toString());
      if (toSockets) {
        toSockets.forEach(sid => {
          io.to(sid).emit('receive_friend_request', { request });
        });
      }
    });

    socket.on('friend_request_accepted', ({ toUserId }) => {
      const toSockets = onlineUsers.get(toUserId.toString());
      if (toSockets) {
        toSockets.forEach(sid => {
          io.to(sid).emit('friend_accepted', { fromUser: socket.user });
        });
      }
    });

    // ───── WEBRTC SIGNALING ─────
    socket.on('call_user', ({ toUserId, offer, type }) => {
      const toSockets = onlineUsers.get(toUserId.toString());
      if (toSockets) {
        toSockets.forEach(sid => {
          io.to(sid).emit('incoming_call', {
            fromUser: socket.user,
            offer,
            type
          });
        });
      }
    });

    socket.on('make_answer', ({ toUserId, answer }) => {
      const toSockets = onlineUsers.get(toUserId.toString());
      if (toSockets) {
        toSockets.forEach(sid => {
          io.to(sid).emit('call_answered', { answer });
        });
      }
    });

    socket.on('ice_candidate', ({ toUserId, candidate }) => {
      const toSockets = onlineUsers.get(toUserId.toString());
      if (toSockets) {
        toSockets.forEach(sid => {
          io.to(sid).emit('ice_candidate', { candidate });
        });
      }
    });

    socket.on('reject_call', ({ toUserId }) => {
      const toSockets = onlineUsers.get(toUserId.toString());
      if (toSockets) {
        toSockets.forEach(sid => {
          io.to(sid).emit('call_rejected');
        });
      }
    });

    socket.on('end_call', ({ toUserId }) => {
      const toSockets = onlineUsers.get(toUserId.toString());
      if (toSockets) {
        toSockets.forEach(sid => {
          io.to(sid).emit('call_ended');
        });
      }
    });

    // ───── GET ONLINE STATUS ─────
    socket.on('get_online_users', () => {
      socket.emit('online_users_list', {
        onlineUserIds: [...onlineUsers.keys()]
      });
    });

    // ───── DISCONNECT ─────
    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.user.username} ngắt kết nối: ${socket.id}`);

      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
        }
      }
    });
  });

  return io;
}
