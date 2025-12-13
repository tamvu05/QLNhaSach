import pool from '../configs/db.js';
import CartService from './cart.service.js';

const CheckoutService = {
    // 1. Hàm phụ: Kiểm tra và tính tiền giảm giá (ĐÃ SỬA)
    // 👉 Thêm tham số customerId
    async calculateDiscount(voucherCode, totalCartAmount, customerId) {
        if (!voucherCode) return 0;

        try {
            // [MỚI] Bước 1: Check xem khách đã dùng mã này trong quá khứ chưa?
            const [history] = await pool.query(
                `SELECT 1 FROM LichSuDungVoucher WHERE MaKH = ? AND MaVC = ? LIMIT 1`,
                [customerId, voucherCode]
            );

            if (history.length > 0) {
                console.log(`🚫 Khách hàng ${customerId} đã từng dùng mã ${voucherCode}`);
                return 0; // Đã dùng rồi -> Không giảm nữa
            }

            // Bước 2: Lấy thông tin voucher
            const [rows] = await pool.query(
                `SELECT * FROM Voucher WHERE MaVC = ? AND TrangThai = 'HOAT_DONG' AND SoLuong > 0 AND NgayKT >= NOW()`, 
                [voucherCode]
            );

            if (rows.length === 0) return 0;
            const voucher = rows[0];

            // Kiểm tra điều kiện đơn tối thiểu
            if (totalCartAmount < voucher.DKTongTien) return 0;

            // Tính toán mức giảm
            let discount = 0;
            if (voucher.LoaiVC === 'PHAN_TRAM' || voucher.LoaiVC === 'PhanTram') {
                discount = (voucher.GiaTriGiam / 100) * totalCartAmount;
                if (voucher.SoTienGiamMax > 0 && discount > voucher.SoTienGiamMax) {
                    discount = voucher.SoTienGiamMax;
                }
            } else {
                discount = voucher.GiaTriGiam;
            }

            return discount;
        } catch (error) {
            console.error('Lỗi tính voucher:', error);
            return 0;
        }
    },

    // 2. HÀM ĐẶT HÀNG (ĐÃ SỬA)
    async placeOrder(customerId, orderInfo, voucherCode) {
        let connection;
        try {
            const { nguoiNhan, diaChi, sdt, ghiChu } = orderInfo;

            // Lấy lại giỏ hàng
            const cartData = await CartService.getCartDetails(customerId);
            if (cartData.items.length === 0) throw new Error('Giỏ hàng trống!');

            let finalTotal = cartData.grandTotal;
            
            // --- LOGIC VOUCHER MỚI ---
            // Gọi hàm tính toán (có truyền customerId để check lịch sử)
            const discountAmount = await CheckoutService.calculateDiscount(voucherCode, finalTotal, customerId);
            finalTotal = finalTotal - discountAmount;
            if (finalTotal < 0) finalTotal = 0;
            // -------------------------

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Lưu đơn hàng
            const [orderResult] = await connection.query(
                `INSERT INTO DonHang (MaKH, NgayDat, TongTien, TenNguoiNhan, DiaChiNhan, SDT, GhiChu, TrangThai, MaVC) 
                VALUES (?, NOW(), ?, ?, ?, ?, ?, 'CHO_XAC_NHAN', ?)`,
                [customerId, finalTotal, nguoiNhan, diaChi, sdt, ghiChu, voucherCode || null] 
            );
            const orderId = orderResult.insertId;

            // Lưu chi tiết đơn hàng
            for (const item of cartData.items) {
                await connection.query(
                    `INSERT INTO CTDonHang (MaDH, MaSach, SoLuong, DonGia) 
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.MaSach, item.SoLuong, item.DonGia]
                );
            }

            // [MỚI] Xử lý Voucher: Trừ tồn kho & Ghi lịch sử
            if (voucherCode && discountAmount > 0) {
                // 1. Trừ số lượng Voucher
                await connection.query(
                    'UPDATE Voucher SET SLDaDung = SLDaDung + 1 WHERE MaVC = ?', 
                    [voucherCode]
                );

                // 2. Ghi vào bảng LichSuDungVoucher để chặn dùng lại lần sau
                await connection.query(
                    `INSERT INTO LichSuDungVoucher (MaKH, MaVC, MaDH) VALUES (?, ?, ?)`,
                    [customerId, voucherCode, orderId]
                );
            }

            // Xóa giỏ hàng
            await connection.query('DELETE FROM GioHang WHERE MaKH = ?', [customerId]);

            await connection.commit();
            return orderId;

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('❌ Lỗi đặt hàng:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
};

export default CheckoutService;