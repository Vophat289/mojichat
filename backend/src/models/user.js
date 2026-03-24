import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarURL: {
      type: String, // link cdn để hiển thị hình ảnh
    },
    avatarId: {
      type: String, //lưu cdn public_id để xóa ảnh
    },
    bio: {
      type: String,
      maxlength: 500, //giới hạn 500 kí tự
    },
    phone: {
      type: String,
      sparse: true, // cho phép null nhưng 0 đc trùng
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
