import CartService from '../services/cart.service.js';
import CheckoutService from '../services/checkout.service.js';
import UserService from '../services/user.service.js';

const CheckoutController = {
    // GET /checkout
    async index(req, res) {
        if (!req.session.user) return res.redirect('/login');

        const customerId = req.session.user.customerId;
        const userId = req.session.user.id;
        
        // 1. Lấy mã Voucher từ URL (do trang Cart gửi sang)
        const voucherCode = req.query.voucher || null;

        const data = await CartService.getCartDetails(customerId);
        if (data.items.length === 0) return res.redirect('/cart');

        const customerInfo = await UserService.getProfile(userId);

        // 2. Tính toán giảm giá (Gọi Service vừa viết)
        const discountAmount = await CheckoutService.calculateDiscount(voucherCode, data.grandTotal, customerId);
        const finalTotal = data.grandTotal - discountAmount;

        res.render('user/checkout', {
            title: 'Thanh toán',
            path: '/checkout',
            cartItems: data.items,
            
            grandTotal: data.grandTotal,    // Tổng gốc
            discountAmount: discountAmount, // Tiền giảm
            finalTotal: finalTotal,         // Tổng phải trả
            voucherCode: voucherCode,       // Gửi lại mã để EJS nhét vào form ẩn
            
            user: customerInfo || { HoTen: '', SDT: '', DiaChi: '' } 
        });
    },

    // POST /checkout/order
    async order(req, res) {
        if (!req.session.user) return res.redirect('/login');

        try {
            const customerId = req.session.user.customerId;
            // Lấy thêm voucherCode từ form ẩn gửi lên
            const { voucherCode, ...orderInfo } = req.body; 

            // Gọi Service tạo đơn hàng kèm voucher
            const orderId = await CheckoutService.placeOrder(customerId, orderInfo, voucherCode);

            res.locals.totalQuantity = 0;
            res.render('user/order-success', {
                title: 'Đặt hàng thành công',
                path: '/checkout',
                orderId: orderId
            });

        } catch (error) {
            console.error('Lỗi Controller Order:', error);
            res.status(500).send('Lỗi đặt hàng. Vui lòng thử lại.');
        }
    }
};

export default CheckoutController;