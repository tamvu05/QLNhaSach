import pool from '../configs/db.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { sendMail } from '../utils/mailer.js'
import EmployeeModel from '../models/employee.model.js'

const AuthService = {
    // --- ĐĂNG KÝ (Đã chuẩn hóa trả về Object) ---
    async register({ fullname, email, password }) {
        let connection
        try {
            // 1. Kiểm tra Email tồn tại
            const [existingUser] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ?', [email])
            if (existingUser.length > 0) {
                return { success: false, message: 'Email này đã được sử dụng!' }
            }

            // 2. Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            // 3. Bắt đầu Transaction
            connection = await pool.getConnection()
            await connection.beginTransaction()

            // Tạo Tài Khoản
            const [userResult] = await connection.query(
                `INSERT INTO TaiKhoan (TenDangNhap, MatKhauHash, TrangThai, VaiTro) 
                 VALUES (?, ?, 'ACTIVE', 2)`,
                [email, hashedPassword]
            )
            const newUserId = userResult.insertId

            // Tạo Khách Hàng
            await connection.query(`INSERT INTO KhachHang (HoTen, Email, MaTK) VALUES (?, ?, ?)`, [fullname, email, newUserId])

            await connection.commit()
            
            // ✅ Trả về kết quả Thành Công
            return { success: true, message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.' }

        } catch (error) {
            if (connection) await connection.rollback()
            console.error('Lỗi đăng ký:', error)
            // ❌ Trả về kết quả Thất Bại
            return { success: false, message: 'Lỗi hệ thống: ' + error.message }
        } finally {
            if (connection) connection.release()
        }
    },

    // --- CÁC HÀM DƯỚI GIỮ NGUYÊN ---
    async login(email, password) {
        const [users] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ?', [email])
        const user = users[0]

        if (!user) throw new Error('Tài khoản không tồn tại')

        const isMatch = await bcrypt.compare(password, user.MatKhauHash)
        if (!isMatch) throw new Error('Mật khẩu không đúng')

        if (user.TrangThai !== 'ACTIVE') throw new Error('Tài khoản đã bị khóa')

        const [customers] = await pool.query('SELECT * FROM KhachHang WHERE MaTK = ?', [user.MaTK])
        const customer = customers[0]

        return {
            id: user.MaTK,
            email: user.TenDangNhap,
            roleId: user.MaVT,
            customerId: customer ? customer.MaKH : null,
            fullname: customer ? customer.HoTen : 'Khách hàng',
        }
    },

    async loginAdmin(email, password) {
        const [users] = await pool.query('SELECT * FROM TaiKhoan WHERE VaiTro > 2 AND TenDangNhap = ?', [email])
        const user = users[0]

        if (!user) throw new Error('Tài khoản hoặc mật khẩu không chính xác!')

        const isMatch = await bcrypt.compare(password, user.MatKhauHash)
        if (!isMatch) throw new Error('Tài khoản hoặc mật khẩu không chính xác!')

        if (user.TrangThai !== 'ACTIVE') throw new Error('Tài khoản đã bị khóa')

        const MaNV = await EmployeeModel.getEmpIdByAccountId(user.MaTK)

        return {
            MaTK: user.MaTK,
            MaNV,
            email: user.TenDangNhap,
            VaiTro: user.VaiTro
        }
    },

    async sendOtp(email) {
        const [users] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ?', [email])
        if (users.length === 0) throw new Error('Email không tồn tại')

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expireTime = new Date(Date.now() + 5 * 60 * 1000)

        await pool.query('UPDATE TaiKhoan SET ResetToken = ?, TokenExp = ? WHERE TenDangNhap = ?', [otp, expireTime, email])

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0d6efd;">Mã xác minh của bạn</h2>
                <p>Xin chào,</p>
                <p>Mã xác minh để đặt lại mật khẩu của bạn là:</p>
                <h1 style="letter-spacing: 5px; color: #333; background: #f8f9fa; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h1>
                <p style="color: red;">Mã này sẽ hết hạn sau 5 phút.</p>
            </div>
        `
        await sendMail(email, 'Mã xác minh BookStore', htmlContent)
        return true
    },

    async verifyOtp(email, otp) {
        const [users] = await pool.query('SELECT * FROM TaiKhoan WHERE TenDangNhap = ? AND ResetToken = ? AND TokenExp > NOW()', [email, otp])
        if (users.length === 0) return false
        return true
    },

    async resetPassword(email, newPassword) {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        await pool.query('UPDATE TaiKhoan SET MatKhauHash = ?, ResetToken = NULL, TokenExp = NULL WHERE TenDangNhap = ?', [hashedPassword, email])
        return true
    },
}

export default AuthService