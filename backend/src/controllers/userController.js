import User from '../models/user.js';

// Lấy thông tin user hiện tại
export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi khi gọi authMe', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// Tìm kiếm user theo displayName hoặc username
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
    }

    const keyword = q.trim();
    const currentUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: currentUserId }, // loại trừ chính mình
      $or: [
        { displayName: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } }
      ]
    })
      .select('-hashedPassword')
      .limit(20)
      .lean();

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm user:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// Lấy profile của user khác theo ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-hashedPassword').lean();

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi khi lấy profile user:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// Cập nhật thông tin cá nhân
export const updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { displayName, bio, phone, avatarURL, avatarId } = req.body;

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (phone !== undefined) updateData.phone = phone.trim() || undefined;
    if (avatarURL !== undefined) updateData.avatarURL = avatarURL;
    if (avatarId !== undefined) updateData.avatarId = avatarId;

    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-hashedPassword');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    return res.status(200).json({ message: 'Cập nhật thành công', user: updatedUser });
  } catch (error) {
    console.error('Lỗi khi cập nhật profile:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const test = async (req, res) => {
  return res.sendStatus(204);
};