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
            console.log("🔍 Đang đếm giỏ hàng cho MaKH:", customerId); // Log 1: Xem ID truyền vào là gì

            const [rows] = await pool.query(
                'SELECT SUM(SoLuong) as total FROM GioHang WHERE MaKH = ?', 
                [customerId]
            );
            
            console.log("📦 Kết quả DB trả về:", rows); // Log 2: Xem DB trả về cái gì

            // Chuyển đổi sang số nguyên cho chắc chắn
            const total = parseInt(rows[0].total) || 0; 
            
            console.log("🔢 Tổng số lượng tính được:", total); // Log 3: Kết quả cuối cùng
            
            return total;
        } catch (error) {
            console.error('❌ Lỗi hàm getCartCount:', error); // Log 4: Nếu lỗi thì in đỏ lòm ra
            return 0;
        }
    },

    // 3. Lấy chi tiết giỏ hàng (Để hiển thị trang Cart)
    async getCartDetails(customerId) {
        try {
            // JOIN GioHang với Sach để lấy tên, giá, ảnh
            const query = `
                SELECT 
                    gh.MaSach, 
                    gh.SoLuong, 
                    s.TenSach, 
                    s.DonGia, 
                    s.HinhAnh,
                    (gh.SoLuong * s.DonGia) AS ThanhTien
                FROM GioHang gh
                JOIN Sach s ON gh.MaSach = s.MaSach
                WHERE gh.MaKH = ?
            `;
            const [items] = await pool.query(query, [customerId]);

            // Tính tổng tiền cả giỏ hàng
            const grandTotal = items.reduce((sum, item) => sum + Number(item.ThanhTien), 0);

            return { items, grandTotal };
        } catch (error) {
            console.error('❌ Lỗi lấy chi tiết giỏ:', error);
            return { items: [], grandTotal: 0 };
        }
    },

    // 4. Cập nhật số lượng sách ---
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

    // 5. Xóa sách khỏi giỏ ---
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
    }
};

export default CartService;