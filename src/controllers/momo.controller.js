import MomoService from '../services/momo.service.js';
import CheckoutService from '../services/checkout.service.js';
import pool from '../configs/db.js';

const MomoController = {
    createPayment: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const customerId = req.session.user.customerId;
            const orderInfo = req.body;

            const orderId = await CheckoutService.placeOrder(customerId, orderInfo);

            const [rows] = await pool.query('SELECT TongTien FROM DonHang WHERE MaDH = ?', [orderId]);
            const totalAmount = rows[0].TongTien;

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

    callback: async (req, res) => {
        try {
            console.log('Momo Callback:', req.query);
            const { resultCode, orderId } = req.query;

            if (resultCode == '0') {
                console.log('Payment successful for Order ID:', orderId);

                await pool.query('UPDATE DonHang SET DaThanhToan = 1 WHERE MaDH = ?', [orderId]);
                console.log('Updated DaThanhToan = 1');

                return res.redirect('/?payment=success');
            } else {
                return res.redirect('/checkout?payment=failed');
            }
        } catch (error) {
            console.error('Momo Callback Error:', error);
            res.status(500).send('Lỗi xử lý kết quả thanh toán: ' + error.message);
        }
    },

    ipn: async (req, res) => {
        try {
            console.log('Momo IPN:', req.body);
            const { resultCode, orderId } = req.body;

            const isValid = MomoService.verifySignature(req.body);
            if (!isValid) {
                console.log('Invalid IPN signature');
                return res.status(200).json({ message: 'Invalid signature' });
            }

            if (resultCode == '0') {
                await pool.query('UPDATE DonHang SET DaThanhToan = 1 WHERE MaDH = ?', [orderId]);
            }

            return res.status(204).json({});
        } catch (error) {
            console.error('Momo IPN Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export default MomoController;
