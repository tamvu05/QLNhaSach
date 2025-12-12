import CartService from '../services/cart.service.js';

const CartController = {
    // API: Thêm vào giỏ
    async add(req, res) {
        // Kiểm tra đăng nhập
        if (!req.session.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để mua hàng' });
        }

        const customerId = req.session.user.customerId;
        const { bookId } = req.body; // Lấy ID sách từ nút bấm gửi lên

        // 2. Gọi Service thêm vào DB
        const success = await CartService.addToCart(customerId, bookId);

        if (success) {
            // 3. Lấy lại tổng số lượng mới để cập nhật icon
            const totalQuantity = await CartService.getCartCount(customerId);
            return res.json({ success: true, totalQuantity });
        } else {
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
        }
    },

    // GET /cart (Xem giỏ hàng)
    async index(req, res) {
        if (!req.session.user) return res.redirect('/login');

        const customerId = req.session.user.customerId;
        const data = await CartService.getCartDetails(customerId);
        const currentTotalQty = data.items.reduce((sum, item) => sum + item.SoLuong, 0);

        // Lấy danh sách Voucher phù hợp với tổng tiền hiện tại
        const vouchers = await CartService.getEligibleVouchers(data.grandTotal, customerId);

        res.render('user/cart', {
            title: 'Giỏ hàng của bạn',
            path: '/cart',
            cartItems: data.items,
            grandTotal: data.grandTotal,
            totalQuantity: currentTotalQty,
            vouchers: vouchers
        });
    },

    // PATCH /cart/update (GỌI SERVICE)
    async updateItem(req, res) {
        if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });

        const customerId = req.session.user.customerId;
        const { bookId, quantity } = req.body;

        // Gọi Service cập nhật
        await CartService.updateItem(customerId, bookId, quantity);
        
        // Lấy lại thông tin mới để trả về cho Frontend cập nhật giá tiền
        const data = await CartService.getCartDetails(customerId);
        const totalQty = data.items.reduce((sum, item) => sum + item.SoLuong, 0);

        // Trả về cả grandTotal và totalQty
        res.json({ success: true, grandTotal: data.grandTotal, totalQty });
    },

    // DELETE /cart/remove (GỌI SERVICE)
    async removeItem(req, res) {
        if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });

        const customerId = req.session.user.customerId;
        const { bookId } = req.body;

        // Gọi Service xóa
        await CartService.removeItem(customerId, bookId);
        
        // Lấy lại thông tin để cập nhật giao diện
        const data = await CartService.getCartDetails(customerId);
        const totalQty = data.items.reduce((sum, item) => sum + item.SoLuong, 0);

        res.json({ success: true, grandTotal: data.grandTotal, totalQty });
    }
};

export default CartController;