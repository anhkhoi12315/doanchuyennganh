const User = require("../models/User");
// Avatar functionality removed
const validator = require("validator");
const crypto = require("crypto");
const { sendEmail } = require("../config/mail");
const { generateOTP, getNormalizedEmail } = require("./authController");

const otpStoreChangeEmail = {};

// Lấy thông tin cá nhân
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const userData = {
      _id: user._id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      gender: user.gender || null,
      phone: user.phone || "",
      birthday: user.birthday || null,
      address: user.address || null,
      city: user.city || null,
      district: user.district || null,
      ward: user.ward || null,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      __v: user.__v,
      refreshToken: user.refreshToken,
      isActive: user.isActive,
      avatar: null
    };
    res.json({ message: "Lấy thông tin cá nhân thành công", profile: userData });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy thông tin cá nhân", error });
  }
};

// Cập nhật thông tin cá nhân (không cho sửa email và password)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, fullname, gender, birthday, phone, address, city, district, ward } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // username uniqueness
    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists && String(exists._id) !== String(user._id)) {
        return res.status(400).json({ message: "Username đã được sử dụng" });
      }
      user.username = username;
    }

    // fullname uniqueness
    if (fullname && fullname !== user.fullname) {
      const existsFull = await User.findOne({ fullname });
      if (existsFull && String(existsFull._id) !== String(user._id)) {
        return res.status(400).json({ message: "Fullname đã được sử dụng" });
      }
      user.fullname = fullname;
    }

    // gender
    if (gender !== undefined) {
      if (gender === null || (typeof gender === 'string' && gender.trim().length === 0)) {
        return res.status(400).json({ message: "Giới tính không hợp lệ" });
      }
      user.gender = gender;
    }

    // birthday
    if (birthday !== undefined) {
      if (birthday === null || birthday === "") {
        user.birthday = undefined;
      } else {
        const parsed = new Date(birthday);
        if (isNaN(parsed.getTime()) || parsed > new Date()) {
          return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
        }
        user.birthday = parsed;
      }
    }

    // phone
    if (phone !== undefined) {
      if (phone && (!validator.isMobilePhone(phone, 'vi-VN') || phone.length < 9 || phone.length > 12)) {
        return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
      }
      user.phone = phone || "";
    }

    // address (nullable)
    if (address !== undefined) {
      if (address !== null && typeof address === 'string' && address.trim().length === 0) {
        return res.status(400).json({ message: "Địa chỉ không hợp lệ" });
      }
      user.address = address === "" ? null : address;
    }

    // city (nullable)
    if (city !== undefined) {
      user.city = city === "" ? null : city;
    }

    // district (nullable)
    if (district !== undefined) {
      user.district = district === "" ? null : district;
    }

    // ward (nullable)
    if (ward !== undefined) {
      user.ward = ward === "" ? null : ward;
    }

    await user.save();
    const userData = {
      _id: user._id,
      username: user.username,
      fullname: user.fullname,
      gender: user.gender,
      email: user.email,
      phone: user.phone || "",
      address: user.address || null,
      city: user.city || null,
      district: user.district || null,
      ward: user.ward || null,
      birthday: user.birthday || null,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      __v: user.__v,
      refreshToken: user.refreshToken,
      isActive: user.isActive
    };
    res.json({ message: "Cập nhật thông tin cá nhân thành công", profile: userData });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật thông tin cá nhân", error });
  }
};

// Gửi OTP đến email hiện tại để xác thực đổi email
exports.requestChangeEmailOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Tài khoản đã bị vô hiệu hóa" });
    }
  const otp = generateOTP(6);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút
    otpStoreChangeEmail[userId] = { otpHash, expiresAt };
    await sendEmail({
      to: user.email,
      subject: "Mã OTP xác thực đổi email",
      text: `Mã OTP xác thực đổi email của bạn là: ${otp} (hết hạn sau 10 phút)`
    });
    res.json({ message: "Nếu email tồn tại, OTP đã được gửi" });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi gửi OTP xác thực đổi email", error });
  }
};

// Xác thực OTP email hiện tại
exports.verifyCurrentEmailOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "Vui lòng nhập mã OTP" });
    }
    const record = otpStoreChangeEmail[userId];
    if (!record || Date.now() > record.expiresAt) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpHash) {
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }
    otpStoreChangeEmail[userId].verifiedCurrent = true;
    res.json({ message: "Xác thực OTP email hiện tại thành công" });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi xác thực OTP email hiện tại", error });
  }
};

// Gửi OTP tới email mới (sau khi đã xác thực email cũ)
exports.requestNewEmailOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;
    if (!newEmail) {
      return res.status(400).json({ message: "Email mới không hợp lệ" });
    }
    const normalizedEmail = getNormalizedEmail(newEmail);
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email mới không hợp lệ" });
    }
    const record = otpStoreChangeEmail[userId];
    if (!record || !record.verifiedCurrent) {
      return res.status(400).json({ message: "Bạn cần xác thực OTP email hiện tại trước" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (user.email === normalizedEmail) {
      return res.status(400).json({ message: "Email mới không được trùng email hiện tại" });
    }
    const existed = await User.findOne({ email: normalizedEmail });
    if (existed) {
      return res.status(400).json({ message: "Email mới đã được sử dụng" });
    }
    const otp = generateOTP(6);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStoreChangeEmail[userId].newEmail = normalizedEmail;
    otpStoreChangeEmail[userId].otpNewHash = otpHash;
    otpStoreChangeEmail[userId].otpNewExpiresAt = expiresAt;
    await sendEmail({
      to: normalizedEmail,
      subject: "Mã OTP xác thực email mới",
      text: `Mã OTP xác thực email mới của bạn là: ${otp} (hết hạn sau 10 phút)`
    });
    res.json({ message: "Nếu email hợp lệ, OTP đã được gửi tới email mới" });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi gửi OTP tới email mới", error });
  }
};

// Xác thực OTP email mới và đổi email
exports.changeEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "Vui lòng nhập mã OTP" });
    }
    const record = otpStoreChangeEmail[userId];
    if (!record || !record.verifiedCurrent || !record.otpNewHash || !record.otpNewExpiresAt || !record.newEmail) {
      return res.status(400).json({ message: "Bạn cần thực hiện đúng các bước xác thực trước" });
    }
    if (Date.now() > record.otpNewExpiresAt) {
      return res.status(400).json({ message: "Mã OTP email mới đã hết hạn" });
    }
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpNewHash) {
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    user.email = record.newEmail;
    await user.save();
    delete otpStoreChangeEmail[userId];
    res.json({ message: "Đổi email thành công" });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi xác thực OTP email mới và đổi email", error });
  }
};

// Store OTP đổi mật khẩu (theo userId)
const otpStoreChangePassword = {};

// Gửi OTP về email để xác thực đổi mật khẩu
exports.requestChangePasswordOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      // Không tiết lộ user tồn tại hay không, luôn trả về thành công
      return res.json({ message: "Nếu email tồn tại, OTP đã được gửi" });
    }
    const otp = generateOTP(6);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút
    otpStoreChangePassword[userId] = { otpHash, expiresAt };
    await sendEmail({
      to: user.email,
      subject: "Mã OTP đổi mật khẩu",
      text: `Mã OTP đổi mật khẩu của bạn là: ${otp} (hết hạn sau 10 phút)`
    });
    res.json({ message: "Nếu email tồn tại, OTP đã được gửi" });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi gửi OTP đổi mật khẩu", error });
  }
}; 

// Xác thực OTP và đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, newPassword, confirmPassword } = req.body;
    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }
    const record = otpStoreChangePassword[userId];
    if (!record || Date.now() > record.expiresAt) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpHash) {
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    }
    user.password = await require("bcryptjs").hash(newPassword, 10);
    await user.save();
    delete otpStoreChangePassword[userId];
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi đổi mật khẩu", error });
  }
};

// Avatar upload removed