import pool from '../configs/db.js';

const CartService = {
    // 1. Thêm vào giỏ (Hoặc tăng số lượng nếu đã có)
    async addToCart(customerId, bookId) {
        try {
            // Logic: Thử Insert, nếu trùng khóa chính (MaKH + MaSach) thì tự động tăng SoLuong lên 1
            const query = `
                INSERT INTO GioHang (MaKH, MaSach, SoLuong) 
                VALUES (?, ?, 1) 
                ON DUPLICATE KEY UPDATE SoLuong = SoLuong + 1
            `;
            await pool.query(query, [customerId, bookId]);
            return true;
        } catch (error) {
            console.error('❌ Lỗi thêm giỏ hàng:', error);
            return false;
        }
    },

    // 2. Đếm tổng số sách trong giỏ (Để hiện lên Header)
    async getCartCount(customerId) {
        try {
            const [rows] = await pool.query(
                'SELECT SUM(SoLuong) as total FROM GioHang WHERE MaKH = ?', 
                [customerId]
            );
            return rows[0].total || 0; // Nếu null (giỏ rỗng) thì trả về 0
        } catch (error) {
            return 0;
        }
    }
};

export default CartService;