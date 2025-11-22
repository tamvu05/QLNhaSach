import pool from '../configs/db.js';

const UserService = {
    // Lấy thông tin chi tiết khách hàng theo MaTK (ID tài khoản)
    async getProfile(userId) {
        try {
            // JOIN bảng KhachHang với TaiKhoan để lấy cả Email đăng nhập
            const query = `
                SELECT k.*, t.TenDangNhap
                FROM KhachHang k
                JOIN TaiKhoan t ON k.MaTK = t.MaTK
                WHERE t.MaTK = ?
            `;
            const [rows] = await pool.query(query, [userId]);
            
            // Nếu chưa có thông tin trong bảng KhachHang (trường hợp hy hữu), trả về null
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Lỗi lấy profile:', error);
            return null;
        }
    },

    // Hàm cập nhật thông tin (để dành dùng sau)
    async updateProfile(userId, data) {
        try {
            const { HoTen, SDT, DiaChi } = data;
            await pool.query(
                `UPDATE KhachHang SET HoTen = ?, SDT = ?, DiaChi = ? WHERE MaTK = ?`,
                [HoTen, SDT, DiaChi, userId]
            );
            return true;
        } catch (error) {
            console.error('❌ Lỗi update profile:', error);
            return false;
        }
    }
};

export default UserService;