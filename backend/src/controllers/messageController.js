import Conversation from '../models/conversation.js';
import Message from '../models/message.js';
import Friend from '../models/friend.js';
import mongoose from 'mongoose';

// ========== LẤY DANH SÁCH CONVERSATIONS ==========
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      'participants.userId': currentUserId
    })
      .sort({ lastMessageAt: -1 })
      .populate({
        path: 'participants.userId',
        select: '-hashedPassword'
      })
      .lean();

    return res.status(200).json({ conversations });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách conversations:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== TẠO HOẶC LẤY CONVERSATION TRỰC TIẾP ==========
export const getOrCreateDirect = async (req, res) => {
  try {
    const { friendId } = req.body;
    const currentUserId = req.user._id;

    if (!friendId) {
      return res.status(400).json({ message: 'Thiếu friendId' });
    }

    // Kiểm tra có là bạn không
    let userA = currentUserId.toString();
    let userB = friendId.toString();
    if (userA > userB) [userA, userB] = [userB, userA];

    const areFriends = await Friend.exists({ userA, userB });
    if (!areFriends) {
      return res.status(403).json({ message: 'Hai người chưa là bạn bè' });
    }

    // Tìm existing conversation
    let conversation = await Conversation.findOne({
      type: 'direct',
      'participants.userId': { $all: [currentUserId, friendId] }
    }).populate({ path: 'participants.userId', select: '-hashedPassword' });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [
          { userId: currentUserId },
          { userId: friendId }
        ]
      });
      await conversation.populate({ path: 'participants.userId', select: '-hashedPassword' });
    }

    return res.status(200).json({ conversation });
  } catch (error) {
    console.error('Lỗi khi tạo/lấy conversation:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== LẤY TIN NHẮN TRONG CONVERSATION ==========
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;
    const { before, limit = 30 } = req.query;

    // Kiểm tra quyền truy cập
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const query = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', '-hashedPassword')
      .lean();

    return res.status(200).json({
      messages: messages.reverse(), // Trả về theo thứ tự cũ → mới
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== GỬI TIN NHẮN ==========
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, imgUrl } = req.body;
    const currentUserId = req.user._id;

    if (!content && !imgUrl) {
      return res.status(400).json({ message: 'Tin nhắn không được để trống' });
    }

    // Kiểm tra quyền truy cập
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    // Tạo tin nhắn
    const message = await Message.create({
      conversationId,
      senderId: currentUserId,
      content,
      imgUrl
    });

    await message.populate('senderId', '-hashedPassword');

    // Cập nhật unreadCounts cho những người khác
    const unreadUpdates = {};
    conversation.participants.forEach(p => {
      const pid = p.userId.toString();
      if (pid !== currentUserId.toString()) {
        const current = conversation.unreadCounts?.get(pid) || 0;
        unreadUpdates[`unreadCounts.${pid}`] = current + 1;
      }
    });

    // Cập nhật lastMessage và lastMessageAt trong conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        _id: message._id.toString(),
        content: content || null,
        senderId: currentUserId,
        createdAt: message.createdAt
      },
      lastMessageAt: message.createdAt,
      $unset: { seenBy: '' },
      ...unreadUpdates
    });

    return res.status(201).json({ message });
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== ĐÁNH DẤU ĐÃ ĐỌC ==========
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { seenBy: currentUserId },
      [`unreadCounts.${currentUserId}`]: 0
    });

    return res.status(200).json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error('Lỗi khi đánh dấu đã đọc:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== TẠO NHÓM CHAT ==========
export const createGroupChat = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const currentUserId = req.user._id;

    if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({ message: 'Cần ít nhất 2 thành viên và tên nhóm' });
    }

    // Loại bỏ duplicates và đảm bảo không bao gồm current user trong memberIds
    const uniqueMemberIds = [...new Set(memberIds.map(id => id.toString()))].filter(id => id !== currentUserId.toString());

    const allParticipants = [
      { userId: currentUserId },
      ...uniqueMemberIds.map(id => ({ userId: id }))
    ];

    const conversation = await Conversation.create({
      type: 'group',
      participants: allParticipants,
      group: { name: name.trim(), createdBy: currentUserId }
    });

    await conversation.populate({ path: 'participants.userId', select: '-hashedPassword' });

    return res.status(201).json({ conversation });
  } catch (error) {
    console.error('Lỗi khi tạo nhóm:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== THÊM THÀNH VIÊN VÀO NHÓM ==========
export const addToGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm chat' });
    }

    // Kiểm tra đã trong nhóm chưa
    const alreadyIn = conversation.participants.some(
      p => p.userId.toString() === userId
    );
    if (alreadyIn) {
      return res.status(400).json({ message: 'Người dùng đã trong nhóm' });
    }

    conversation.participants.push({ userId });
    await conversation.save();

    return res.status(200).json({ message: 'Đã thêm thành viên vào nhóm' });
  } catch (error) {
    console.error('Lỗi khi thêm thành viên:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== RỜI NHÓM ==========
export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm chat' });
    }

    conversation.participants = conversation.participants.filter(
      p => p.userId.toString() !== currentUserId.toString()
    );

    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
    } else {
      await conversation.save();
    }

    return res.status(200).json({ message: 'Đã rời nhóm' });
  } catch (error) {
    console.error('Lỗi khi rời nhóm:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};
