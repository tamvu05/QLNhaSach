import MomoService from '../services/momo.service.js';
import CheckoutService from '../services/checkout.service.js';
import pool from '../configs/db.js';

const MomoController = {
    // 1. TẠO GIAO DỊCH
    createPayment: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const customerId = req.session.user.customerId;
            
            // Lưu ý: Cậu cần đảm bảo req.body có đủ voucherCode, selectedIds nếu hàm placeOrder yêu cầu
            const { voucherCode, selectedIds, ...orderInfo } = req.body; 

            // Gọi hàm đặt hàng
            const orderId = await CheckoutService.placeOrder(customerId, orderInfo, voucherCode, selectedIds, 'MOMO');

            // Lấy tổng tiền chính xác từ DB sau khi đã lưu
            const [rows] = await pool.query('SELECT TongTien FROM DonHang WHERE MaDH = ?', [orderId]);
            const totalAmount = rows[0].TongTien;

            // Gọi MoMo Service
            // Lưu ý: Service sẽ tự động nối thêm "_timestamp" vào orderId để tránh trùng
            const result = await MomoService.createPaymentRequest(
                orderId.toString(),
                Math.round(Number(totalAmount)),
                `Thanh toan don hang #${orderId}`
            );

            if (result && result.payUrl) {
                return res.redirect(result.payUrl);
            } else {
                console.error('MoMo Creation Failed:', result);
                return res.status(500).send('Lỗi tạo giao dịch MoMo: ' + (result.message || 'Unknown error'));
            }

        } catch (error) {
            console.error('Momo Payment Error:', error);
            res.status(500).send('Lỗi thanh toán MoMo');
        }
    },

    // 2. XỬ LÝ KẾT QUẢ TRẢ VỀ TỪ MOMO (REDIRECT)
    callback: async (req, res) => {
        try {
            console.log('Momo Callback:', req.query);
            const { resultCode, orderId } = req.query; 

            // Tách chuỗi để lấy ID thật
            const realOrderId = String(orderId).split('_')[0]; 

            if (resultCode == '0') {
                // --- TRƯỜNG HỢP THÀNH CÔNG ---
                console.log('Payment successful for Order ID:', realOrderId);
                await pool.query('UPDATE DonHang SET TrangThai = ?, DaThanhToan = 1 WHERE MaDH = ?', ['CHO_XAC_NHAN', realOrderId]); // Hoặc DA_THANH_TOAN tùy cậu
                return res.redirect('/?payment=success');
            } else {
                // --- TRƯỜNG HỢP THẤT BẠI / KHÁCH HỦY ---
                console.log('Payment failed/cancelled for Order ID:', realOrderId);

                // 🔥 THÊM ĐOẠN NÀY: Cập nhật trạng thái thành ĐÃ HỦY ngay
                await pool.query('UPDATE DonHang SET TrangThai = ? WHERE MaDH = ?', ['DA_HUY', realOrderId]);

                return res.redirect('/checkout?payment=failed');
            }
        } catch (error) {
            console.error('Momo Callback Error:', error);
            res.status(500).send('Lỗi xử lý kết quả thanh toán: ' + error.message);
        }
    },

    // 3. XỬ LÝ IPN (MOMO GỌI NGẦM ĐỂ UPDATE TRẠNG THÁI)
    ipn: async (req, res) => {
        try {
            console.log('Momo IPN:', req.body);
            const { resultCode, orderId } = req.body; // orderId lúc này dạng "13_173529..."

            // Verify chữ ký để đảm bảo request là từ MoMo thật
            const isValid = MomoService.verifySignature(req.body);
            if (!isValid) {
                console.log('Invalid IPN signature');
                return res.status(200).json({ message: 'Invalid signature' });
            }

            // 🔥 [FIX QUAN TRỌNG]: Tách chuỗi để lấy ID thật
            const realOrderId = String(orderId).split('_')[0];

            if (resultCode == '0') {
                // Update trạng thái thanh toán
                await pool.query(
                    'UPDATE DonHang SET TrangThai = ?, DaThanhToan = 1 WHERE MaDH = ?', 
                    ['CHO_XAC_NHAN', realOrderId] 
                );
            } else {
                 console.log(`IPN: Payment failed for Order ${realOrderId}`);
            }

            // Phản hồi cho MoMo biết đã nhận tin
            return res.status(204).json({});
        } catch (error) {
            console.error('Momo IPN Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export default MomoController;