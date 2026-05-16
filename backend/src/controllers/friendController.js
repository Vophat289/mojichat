import Friend from '../models/friend.js';
import User from '../models/user.js';
import FriendRequest from '../models/friendRequest.js';
import Conversation from '../models/conversation.js';

// ========== GỬI LỜI MỜI KẾT BẠN ==========
export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    if (!to) {
      return res.status(400).json({ message: 'Thiếu ID người nhận' });
    }

    if (from.toString() === to.toString()) {
      return res.status(400).json({ message: 'Không thể gửi lời mời kết bạn cho chính mình' });
    }

    const userExists = await User.exists({ _id: to });
    if (!userExists) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from }
        ]
      })
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: 'Hai người đã là bạn bè' });
    }

    if (existingRequest) {
      return res.status(400).json({ message: 'Đã có lời mời kết bạn tồn tại' });
    }

    const request = await FriendRequest.create({ from, to, message });

    return res.status(201).json({ message: 'Gửi lời mời kết bạn thành công', request });
  } catch (error) {
    console.error('Lỗi khi gửi lời mời kết bạn:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== CHẤP NHẬN LỜI MỜI ==========
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Lời mời kết bạn không tồn tại' });
    }

    // Chỉ người nhận mới có thể chấp nhận
    if (request.to.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
    }

    let userA = request.from.toString();
    let userB = request.to.toString();
    if (userA > userB) [userA, userB] = [userB, userA];

    // Tạo friend và xóa request song song
    const [friend] = await Promise.all([
      Friend.create({ userA, userB }),
      FriendRequest.findByIdAndDelete(requestId)
    ]);

    // Tạo direct conversation nếu chưa có
    let conversation = await Conversation.findOne({
      type: 'direct',
      'participants.userId': { $all: [request.from, request.to] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [
          { userId: request.from },
          { userId: request.to }
        ]
      });
    }

    return res.status(200).json({ message: 'Đã chấp nhận lời mời kết bạn', friend });
  } catch (error) {
    console.error('Lỗi khi chấp nhận lời mời kết bạn:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== TỪ CHỐI LỜI MỜI ==========
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Lời mời kết bạn không tồn tại' });
    }

    // Người nhận hoặc người gửi đều có thể từ chối/hủy
    if (
      request.to.toString() !== currentUserId.toString() &&
      request.from.toString() !== currentUserId.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({ message: 'Đã từ chối lời mời kết bạn' });
  } catch (error) {
    console.error('Lỗi khi từ chối lời mời kết bạn:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== HỦY LỜI MỜI ĐÃ GỬI ==========
export const cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Lời mời kết bạn không tồn tại' });
    }

    if (request.from.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Bạn chỉ có thể hủy lời mời do chính mình gửi' });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({ message: 'Đã hủy lời mời kết bạn' });
  } catch (error) {
    console.error('Lỗi khi hủy lời mời:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== LẤY DANH SÁCH BẠN BÈ ==========
export const getAllFriends = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    const friendDocs = await Friend.find({
      $or: [{ userA: currentUserId }, { userB: currentUserId }]
    });

    // Lấy ID của những người bạn (không phải current user)
    const friendIds = friendDocs.map(f =>
      f.userA.toString() === currentUserId ? f.userB : f.userA
    );

    const friends = await User.find({ _id: { $in: friendIds } })
      .select('-hashedPassword')
      .lean();

    return res.status(200).json({ friends });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bạn bè:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== LẤY LỜI MỜI NHẬN ĐƯỢC ==========
export const getFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const requests = await FriendRequest.find({ to: currentUserId })
      .populate('from', '-hashedPassword')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lời mời:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== LẤY LỜI MỜI ĐÃ GỬI ==========
export const getSentRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const requests = await FriendRequest.find({ from: currentUserId })
      .populate('to', '-hashedPassword')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('Lỗi khi lấy lời mời đã gửi:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== XÓA BẠN BÈ ==========
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id.toString();

    let userA = currentUserId;
    let userB = friendId;
    if (userA > userB) [userA, userB] = [userB, userA];

    const deleted = await Friend.findOneAndDelete({ userA, userB });

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy mối quan hệ bạn bè' });
    }

    return res.status(200).json({ message: 'Đã xóa bạn bè thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa bạn:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// ========== KIỂM TRA XEM CÓ LÀ BẠN KHÔNG ==========
export const checkFriendship = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    let userA = currentUserId;
    let userB = userId;
    if (userA > userB) [userA, userB] = [userB, userA];

    const [isFriend, sentRequest, receivedRequest] = await Promise.all([
      Friend.exists({ userA, userB }),
      FriendRequest.findOne({ from: currentUserId, to: userId }),
      FriendRequest.findOne({ from: userId, to: currentUserId })
    ]);

    return res.status(200).json({
      isFriend: !!isFriend,
      sentRequest: sentRequest || null,
      receivedRequest: receivedRequest || null
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra bạn bè:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};