import pool from '../configs/db.js';
import CartService from './cart.service.js';

const CheckoutService = {
    // 1. Hàm phụ: Kiểm tra và tính tiền giảm giá
    async calculateDiscount(voucherCode, totalCartAmount, customerId) {
        if (!voucherCode) return 0;

        try {
            // Bước 1: Check xem khách đã dùng mã này chưa
            const [history] = await pool.query(
                `SELECT 1 FROM LichSuDungVoucher WHERE MaKH = ? AND MaVC = ? LIMIT 1`,
                [customerId, voucherCode]
            );

            if (history.length > 0) {
                console.log(`🚫 Khách hàng ${customerId} đã từng dùng mã ${voucherCode}`);
                return 0;
            }

            // Bước 2: Lấy thông tin voucher
            const [rows] = await pool.query(
                `SELECT * FROM Voucher WHERE MaVC = ? AND TrangThai = 'HOAT_DONG' AND SoLuong > 0 AND NgayKT >= NOW()`, 
                [voucherCode]
            );

            if (rows.length === 0) return 0;
            const voucher = rows[0];

            // Ép kiểu dữ liệu về số để so sánh và tính toán
            const dieuKienTongTien = Number(voucher.DKTongTien) || 0;
            const giaTriGiam = Number(voucher.GiaTriGiam) || 0;
            const soTienGiamMax = Number(voucher.SoTienGiamMax) || 0;
            const cartAmount = Number(totalCartAmount) || 0;

            // Kiểm tra điều kiện đơn tối thiểu
            if (cartAmount < dieuKienTongTien) return 0;

            // Tính toán mức giảm
            let discount = 0;
            if (voucher.LoaiVC === 'PHAN_TRAM' || voucher.LoaiVC === 'PhanTram') {
                discount = (giaTriGiam / 100) * cartAmount;
                if (soTienGiamMax > 0 && discount > soTienGiamMax) {
                    discount = soTienGiamMax;
                }
            } else {
                discount = giaTriGiam;
            }

            return discount;
        } catch (error) {
            console.error('Lỗi tính voucher:', error);
            return 0;
        }
    },

    // 2. HÀM ĐẶT HÀNG
    async placeOrder(customerId, orderInfo, voucherCode, selectedIds, paymentMethod = 'COD') {
        let connection;
        try {
            const { nguoiNhan, diaChi, sdt, ghiChu } = orderInfo;

            // Nếu là MoMo thì set trạng thái là 'CHO_THANH_TOAN' (Pending)
            // Nếu là COD thì set là 'CHO_XAC_NHAN'
            let initialStatus = 'CHO_XAC_NHAN';
            if (paymentMethod === 'MOMO') {
                initialStatus = 'CHO_THANH_TOAN'; 
            }

            // Lấy toàn bộ giỏ hàng
            const cartData = await CartService.getCartDetails(customerId);
            if (!cartData || cartData.items.length === 0) throw new Error('Giỏ hàng trống!');

            // LỌC: Chỉ lấy những item user đã chọn mua
            let itemsToBuy = cartData.items;
            if (selectedIds && selectedIds.length > 0) {
                // Ép kiểu về String để so sánh cho chắc chắn
                const selectedIdsString = selectedIds.map(id => String(id));
                itemsToBuy = cartData.items.filter(item => selectedIdsString.includes(String(item.MaSach)));
            }

            if (itemsToBuy.length === 0) throw new Error('Không có sản phẩm nào được chọn để thanh toán!');

            // Dùng Number(item.ThanhTien) để tránh trường hợp nó là string hoặc undefined
            let finalTotal = itemsToBuy.reduce((sum, item) => sum + (Number(item.ThanhTien) || 0), 0);
            
            const discountAmount = await CheckoutService.calculateDiscount(voucherCode, finalTotal, customerId);
            
            // 🔥 [FIX QUAN TRỌNG]: Đảm bảo phép trừ ra số
            finalTotal = Number(finalTotal) - Number(discountAmount);
            if (finalTotal < 0) finalTotal = 0;

            // Log kiểm tra lần cuối trước khi insert (Xóa dòng này khi chạy ổn)
            console.log("DEBUG ORDER:", { finalTotal, discountAmount, voucherCode });

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Lưu Đơn hàng
            const [orderResult] = await connection.query(
                `INSERT INTO DonHang (MaKH, NgayDat, TongTien, TenNguoiNhan, DiaChiNhan, SDT, GhiChu, TrangThai, MaVC) 
                VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?)`, // Chỗ này thay string cứng bằng biến ?
                [customerId, finalTotal, nguoiNhan, diaChi, sdt, ghiChu, initialStatus, voucherCode || null] 
            );
            const orderId = orderResult.insertId;

            // Lưu CTDonHang và Trừ kho
            for (const item of itemsToBuy) {
                await connection.query(
                    `INSERT INTO CTDonHang (MaDH, MaSach, SoLuong, DonGia) VALUES (?, ?, ?, ?)`,
                    [orderId, item.MaSach, item.SoLuong, item.DonGia]
                );

                await connection.query(
                    'UPDATE Sach SET SoLuongTon = SoLuongTon - ? WHERE MaSach = ?',
                    [item.SoLuong, item.MaSach]
                );
            }

            // Xử lý Voucher (Trừ số lượng voucher)
            if (voucherCode && discountAmount > 0) {
                await connection.query('UPDATE Voucher SET SLDaDung = SLDaDung + 1 WHERE MaVC = ?', [voucherCode]);
                await connection.query(`INSERT INTO LichSuDungVoucher (MaKH, MaVC, MaDH) VALUES (?, ?, ?)`, [customerId, voucherCode, orderId]);
            }

            // XÓA GIỎ HÀNG
            if (selectedIds && selectedIds.length > 0) {
                await connection.query(
                    `DELETE FROM GioHang WHERE MaKH = ? AND MaSach IN (?)`, 
                    [customerId, selectedIds]
                );
            } else {
                await connection.query('DELETE FROM GioHang WHERE MaKH = ?', [customerId]);
            }

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