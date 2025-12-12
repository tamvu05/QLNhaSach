import pool from '../configs/db.js';

const CartService = {
    // 1. Thêm vào giỏ
    async addToCart(customerId, bookId) {
        try {
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

    // 2. Đếm tổng số sách
    async getCartCount(customerId) {
        try {
            const [rows] = await pool.query(
                'SELECT SUM(SoLuong) as total FROM GioHang WHERE MaKH = ?', 
                [customerId]
            );
            return parseInt(rows[0].total) || 0; 
        } catch (error) {
            console.error('❌ Lỗi hàm getCartCount:', error);
            return 0;
        }
    },

    // 3. Lấy chi tiết giỏ hàng
    async getCartDetails(customerId) {
        try {
            const query = `
                SELECT 
                    gh.MaSach, gh.SoLuong, 
                    s.TenSach, s.DonGia, s.HinhAnh,
                    (gh.SoLuong * s.DonGia) AS ThanhTien
                FROM GioHang gh
                JOIN Sach s ON gh.MaSach = s.MaSach
                WHERE gh.MaKH = ?
            `;
            const [items] = await pool.query(query, [customerId]);
            const grandTotal = items.reduce((sum, item) => sum + Number(item.ThanhTien), 0);
            return { items, grandTotal };
        } catch (error) {
            console.error('❌ Lỗi lấy chi tiết giỏ:', error);
            return { items: [], grandTotal: 0 };
        }
    },

    // 4. Cập nhật số lượng sách
    async updateItem(customerId, bookId, quantity) {
        try {
            await pool.query(
                'UPDATE GioHang SET SoLuong = ? WHERE MaKH = ? AND MaSach = ?',
                [quantity, customerId, bookId]
            );
            return true;
        } catch (error) {
            console.error('❌ Lỗi update giỏ hàng:', error);
            return false;
        }
    },

    // 5. Xóa sách khỏi giỏ
    async removeItem(customerId, bookId) {
        try {
            await pool.query(
                'DELETE FROM GioHang WHERE MaKH = ? AND MaSach = ?',
                [customerId, bookId]
            );
            return true;
        } catch (error) {
            console.error('❌ Lỗi xóa sách khỏi giỏ:', error);
            return false;
        }
    },

    // 6. Lấy danh sách Voucher hợp lệ (ĐÃ SỬA)
    // 👉 Thêm tham số customerId để check lịch sử
    async getEligibleVouchers(currentTotal, customerId) {
        try {
            const query = `
                SELECT * FROM Voucher v
                WHERE TrangThai = 'HOAT_DONG' 
                AND SoLuong > 0 
                AND NgayBD <= NOW()
                AND NgayKT >= NOW()
                AND DKTongTien <= ?
                -- Điều kiện mới: Chưa tồn tại trong bảng Lịch Sử
                AND NOT EXISTS (
                    SELECT 1 FROM LichSuDungVoucher ls 
                    WHERE ls.MaVC = v.MaVC 
                    AND ls.MaKH = ?
                )
                ORDER BY GiaTriGiam DESC
            `;
            const [vouchers] = await pool.query(query, [currentTotal, customerId]);
            return vouchers;
        } catch (error) {
            console.error('❌ Lỗi lấy voucher:', error);
            return [];
        }
    }
};

export default CartService;