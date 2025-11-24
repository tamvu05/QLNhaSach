import pool from '../configs/db.js';

const OrderService = {
    // Lấy danh sách đơn hàng của 1 khách
    async getMyOrders(customerId) {
        try {
            // Sắp xếp ngày giảm dần (Đơn mới nhất lên đầu)
            const query = `
                SELECT * FROM PhieuXuat 
                WHERE MaKH = ? 
                ORDER BY NgayXuat DESC
            `;
            const [orders] = await pool.query(query, [customerId]);
            return orders;
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    // Lấy chi tiết 1 đơn hàng (Gồm các sách bên trong) - Để dùng cho trang chi tiết đơn sau này
    async getOrderDetail(orderId) {
        try {
            // 1. Lấy thông tin chung của đơn hàng
            const [orders] = await pool.query('SELECT * FROM PhieuXuat WHERE MaPX = ?', [orderId]);
            const order = orders[0];
            
            if (!order) return null;

            // 2. Lấy danh sách sách trong đơn đó (JOIN với bảng Sach để lấy Tên và Ảnh)
            const queryItems = `
                SELECT ct.*, s.TenSach, s.HinhAnh
                FROM CTPhieuXuat ct
                JOIN Sach s ON ct.MaSach = s.MaSach
                WHERE ct.MaPX = ?
            `;
            const [items] = await pool.query(queryItems, [orderId]);

            return { order, items };
        } catch (error) {
            console.error(error);
            return null;
        }
    }
};

export default OrderService;