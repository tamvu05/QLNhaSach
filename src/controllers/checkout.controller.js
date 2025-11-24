import CartService from '../services/cart.service.js';
import CheckoutService from '../services/checkout.service.js';

const CheckoutController = {
    // GET /checkout (Hiện trang điền thông tin)
    async index(req, res) {
        if (!req.session.user) return res.redirect('/login');

        const customerId = req.session.user.customerId;
        
        // Lấy lại giỏ hàng để hiển thị bên cạnh form
        const data = await CartService.getCartDetails(customerId);

        if (data.items.length === 0) {
            return res.redirect('/cart'); // Giỏ trống thì đá về trang giỏ hàng
        }

        res.render('user/checkout', {
            title: 'Thanh toán',
            path: '/checkout',
            cartItems: data.items,
            grandTotal: data.grandTotal,
            user: req.session.user // Truyền thông tin user để điền sẵn vào form
        });
    },

    // POST /checkout/order (Xử lý đặt hàng)
    async order(req, res) {
        if (!req.session.user) return res.redirect('/login');

        try {
            const customerId = req.session.user.customerId;
            const orderInfo = req.body; // { diaChi, sdt, ghiChu ... }

            // Gọi Service tạo đơn
            const orderId = await CheckoutService.placeOrder(customerId, orderInfo);

            // Đặt hàng xong -> Reset số lượng trên Header về 0
            res.locals.totalQuantity = 0;

            // Chuyển sang trang thông báo thành công
            res.render('user/order-success', {
                title: 'Đặt hàng thành công',
                path: '/checkout',
                orderId: orderId
            });

        } catch (error) {
            console.error(error);
            res.status(500).send('Lỗi đặt hàng. Vui lòng thử lại.');
        }
    }
};

export default CheckoutController;