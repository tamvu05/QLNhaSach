import MomoService from '../services/momo.service.js';
import CheckoutService from '../services/checkout.service.js';
import pool from '../configs/db.js';

const MomoController = {
    // Initiate payment
    createPayment: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const customerId = req.session.user.customerId;
            const orderInfo = req.body; // { diaChi, sdt, ghiChu ... }

            // 1. Create order with default status (CHO_XAC_NHAN)
            // We might want to update status to 'CHO_THANH_TOAN' later if needed, 
            // but for now let's assume we create it first.
            const orderId = await CheckoutService.placeOrder(customerId, orderInfo);

            // 2. Create MoMo payment request
            // Fetch order amount
            const [rows] = await pool.query('SELECT TongTien FROM DonHang WHERE MaDH = ?', [orderId]);
            const totalAmount = rows[0].TongTien;

            const result = await MomoService.createPaymentRequest(
                orderId.toString(),
                Math.round(Number(totalAmount)),
                `Thanh toan don hang #${orderId}`
            );

            if (result && result.payUrl) {
                // Redirect to MoMo
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

    // Handle Redirect Callback
    callback: async (req, res) => {
        try {
            console.log('Momo Callback:', req.query);
            const { resultCode, orderId } = req.query;

            if (resultCode == '0') {
                // Payment successful
                console.log('Payment successful for Order ID:', orderId);

                // Update DaThanhToan = 1
                await pool.query('UPDATE DonHang SET DaThanhToan = 1 WHERE MaDH = ?', [orderId]);
                console.log('Updated DaThanhToan = 1');

                // Redirect to Home (Menu chính)
                return res.redirect('/?payment=success');
            } else {
                // Payment failed
                return res.redirect('/checkout?payment=failed');
            }
        } catch (error) {
            console.error('Momo Callback Error:', error);
            res.status(500).send('Lỗi xử lý kết quả thanh toán: ' + error.message);
        }
    },

    // Handle IPN (Instant Payment Notification)
    ipn: async (req, res) => {
        try {
            console.log('Momo IPN:', req.body);
            const { resultCode, orderId } = req.body;

            // Verify signature
            const isValid = MomoService.verifySignature(req.body);
            if (!isValid) {
                console.log('Invalid IPN signature');
                return res.status(200).json({ message: 'Invalid signature' });
            }

            if (resultCode == '0') {
                // Payment successful
                // Also update DaThanhToan = 1 here
                await pool.query('UPDATE DonHang SET DaThanhToan = 1 WHERE MaDH = ?', [orderId]);
            }

            return res.status(204).json({}); // No content
        } catch (error) {
            console.error('Momo IPN Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export default MomoController;
