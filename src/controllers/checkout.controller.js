import CartService from '../services/cart.service.js';
import CheckoutService from '../services/checkout.service.js';
import UserService from '../services/user.service.js'; // 1. Import thêm UserService

const CheckoutController = {
    // GET /checkout (Hiện trang điền thông tin)
    async index(req, res) {
        // Kiểm tra đăng nhập
        if (!req.session.user) return res.redirect('/login');

        const customerId = req.session.user.customerId;
        const userId = req.session.user.id; // Lấy MaTK (ID tài khoản)
        
        // 1. Lấy giỏ hàng để hiển thị bên cạnh form
        const data = await CartService.getCartDetails(customerId);

        if (data.items.length === 0) {
            return res.redirect('/cart'); // Giỏ trống thì đá về trang giỏ hàng
        }

        // 2. Lấy thông tin chi tiết Khách Hàng từ Database
        // (Mục đích: Lấy SĐT, Địa chỉ mới nhất từ bảng KhachHang để điền sẵn vào form)
        const customerInfo = await UserService.getProfile(userId);

        res.render('user/checkout', {
            title: 'Thanh toán',
            path: '/checkout',
            cartItems: data.items,
            grandTotal: data.grandTotal,
            
            // Truyền thông tin khách hàng xuống View
            // Nếu customerInfo null (lỗi data) thì fallback về object rỗng để không crash web
            user: customerInfo || { HoTen: '', SDT: '', DiaChi: '' } 
        });
    },

    // POST /checkout/order (Xử lý đặt hàng)
    async order(req, res) {
        if (!req.session.user) return res.redirect('/login');

        try {
            const customerId = req.session.user.customerId;
            const orderInfo = req.body; // Dữ liệu từ form: { nguoiNhan, diaChi, sdt, ghiChu ... }

            // Gọi Service tạo đơn hàng
            const orderId = await CheckoutService.placeOrder(customerId, orderInfo);

            // Đặt hàng xong -> Reset số lượng trên Header về 0 (về mặt hiển thị)
            res.locals.totalQuantity = 0;

            // Chuyển sang trang thông báo thành công
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