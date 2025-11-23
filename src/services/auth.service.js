import pool from '../configs/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; // Import để tạo mã token ngẫu nhiên
import { sendMail } from '../utils/mailer.js'; // Import hàm gửi mail 

const AuthService = {
    // --- ĐĂNG KÝ (Giữ nguyên) ---
    async register({ fullname, email, password }) {
        let connection;
        try {
            const [existingUser] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ?', [email]);
            if (existingUser.length > 0) {
                throw new Error('Email này đã được sử dụng!');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [userResult] = await connection.query(
                `INSERT INTO TaiKhoan (TenDangNhap, MatKhauHash, TrangThai, MaVT) 
                 VALUES (?, ?, 'ACTIVE', 2)`,
                [email, hashedPassword]
            );
            const newUserId = userResult.insertId;

            await connection.query(
                `INSERT INTO KhachHang (HoTen, Email, MaTK) VALUES (?, ?, ?)`,
                [fullname, email, newUserId]
            );

            await connection.commit();
            return true;

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    // --- ĐĂNG NHẬP (Giữ nguyên) ---
    async login(email, password) {
        const [users] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ?', [email]);
        const user = users[0];

        if (!user) throw new Error('Tài khoản không tồn tại');
        if (user.TrangThai !== 'ACTIVE') throw new Error('Tài khoản đã bị khóa');

        const isMatch = await bcrypt.compare(password, user.MatKhauHash);
        if (!isMatch) throw new Error('Mật khẩu không đúng');

        const [customers] = await pool.query('SELECT * FROM KhachHang WHERE MaTK = ?', [user.MaTK]);
        const customer = customers[0];

        return {
            id: user.MaTK,
            email: user.TenDangNhap,
            roleId: user.MaVT,
            fullname: customer ? customer.HoTen : 'Khách hàng'
        };
    },

    // 1. GỬI MÃ OTP (Thay vì gửi Link)
    async sendOtp(email) {
        const [users] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ?', [email]);
        if (users.length === 0) throw new Error('Email không tồn tại');

        // Sinh mã 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expireTime = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

        // Lưu OTP vào DB
        await pool.query('UPDATE TaiKhoan SET ResetToken = ?, TokenExp = ? WHERE TenDangNhap = ?', 
            [otp, expireTime, email]);

        // Gửi Email chứa mã
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0d6efd;">Mã xác minh của bạn</h2>
                <p>Xin chào,</p>
                <p>Mã xác minh để đặt lại mật khẩu của bạn là:</p>
                <h1 style="letter-spacing: 5px; color: #333; background: #f8f9fa; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h1>
                <p style="color: red;">Mã này sẽ hết hạn sau 5 phút.</p>
            </div>
        `;

        await sendMail(email, 'Mã xác minh BookStore', htmlContent);
        return true;
    },

    // 2. KIỂM TRA MÃ OTP
    async verifyOtp(email, otp) {
        const [users] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ? AND ResetToken = ? AND TokenExp > NOW()', 
            [email, otp]);
        
        if (users.length === 0) return false;
        return true;
    },

    // 3. ĐỔI MẬT KHẨU (Dùng email để xác định)
    async resetPassword(email, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update pass và xóa OTP
        await pool.query('UPDATE TaiKhoan SET MatKhauHash = ?, ResetToken = NULL, TokenExp = NULL WHERE TenDangNhap = ?', 
            [hashedPassword, email]);
        return true;
    }
};

export default AuthService;