import pool from '../configs/db.js';
import CartService from './cart.service.js';

const CheckoutService = {
    // HÀM XỬ LÝ ĐẶT HÀNG
    async placeOrder(customerId, orderInfo) {
        let connection;
        try {
            const { diaChi, sdt, ghiChu } = orderInfo;

            // 1. Lấy thông tin giỏ hàng hiện tại
            const cartData = await CartService.getCartDetails(customerId);
            if (cartData.items.length === 0) throw new Error('Giỏ hàng trống!');

            // 2. Bắt đầu Giao dịch (Transaction)
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 3. Tạo Đơn hàng (PhieuXuat)
            const [orderResult] = await connection.query(
                `INSERT INTO PhieuXuat (MaKH, NgayXuat, TongTien, DiaChiNhan, SDT, MucDich, TrangThai) 
                 VALUES (?, NOW(), ?, ?, ?, ?, 'CHO_XAC_NHAN')`,
                [customerId, cartData.grandTotal, diaChi, sdt, ghiChu || 'Mua online']
            );
            const orderId = orderResult.insertId; // Lấy mã đơn hàng vừa tạo

            // 4. Chép từng cuốn sách từ Giỏ hàng sang Chi tiết đơn hàng (CTPhieuXuat)
            for (const item of cartData.items) {
                await connection.query(
                    `INSERT INTO CTPhieuXuat (MaPX, MaSach, SoLuong, DonGiaXuat) 
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.MaSach, item.SoLuong, item.DonGia]
                );
                
                // (Tùy chọn: Trừ tồn kho sách tại đây nếu muốn)
            }

            // 5. Xóa sạch Giỏ hàng của khách
            await connection.query('DELETE FROM GioHang WHERE MaKH = ?', [customerId]);

            // 6. Chốt đơn (Commit)
            await connection.commit();
            
            return orderId; // Trả về mã đơn hàng để báo thành công

        } catch (error) {
            // Nếu lỗi thì hoàn tác tất cả
            if (connection) await connection.rollback();
            console.error('❌ Lỗi đặt hàng:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
};

export default CheckoutService;