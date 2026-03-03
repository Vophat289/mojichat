import bcrypt from "bcrypt";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstname, lastname } = req.body;

    if (!username || !password || !email || !firstname || !lastname) {
      return res.status(400).json({
        message:
          "Không thể thiếu username, password, email, firstname và lastname",
      });
    }

    //kiểm tra username đã tồn tại chưa
    const duplicate = await User.findOne({ username });

    if (duplicate) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    //mã hóa pass
    const hashedPassword = await bcrypt.hash(password, 10); //salt = 10

    //tạo user mới
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstname} ${lastname}`,
    });

    //return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    //lấy inputs
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password" });
    }

    //lấy hashpassword trong db đề so với pass input
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    //kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    //nếu khớp, tạo access token với jwt
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    //tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    //tạo session mới để lưu refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    //trả refresh token về trong cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none", //deploy back với front riêng 2 domain
      maxAge: REFRESH_TOKEN_TTL,
    });

    //trả access token về trong res
    return res
      .status(200)
      .json({ message: `User ${user.displayName} đã logged in`, accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    //lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      //xóa refresh token trong Session
      await Session.deleteOne({ refreshToken: token });

      //xóa cookie
      res.clearCookie("refreshToken");
    }

    return res.sendStatus(204);

  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
