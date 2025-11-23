import CartService from '../services/cart.service.js';

const CartController = {
    // API: Thêm vào giỏ
    async add(req, res) {
        // 1. Kiểm tra đăng nhập
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
    }
};

export default CartController;