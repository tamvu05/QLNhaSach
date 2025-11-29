import express from 'express'

// 1. Import trực tiếp các Router giao diện (Thay vì qua file trung gian)
import adminRouter from './viewRouters/admin.router.js'
import userRouter from './viewRouters/user.router.js'
import cartRouter from './viewRouters/cart.router.js'
import checkoutRouter from './viewRouters/checkout.router.js'
import orderRouter from './viewRouters/order.router.js';

// 2. Import Router API (Giữ nguyên cái này vì thư mục apiRouters vẫn còn)
import apiRouter from './apiRouters/index.js'

const router = express.Router()

// 3. Định nghĩa các luồng đi (Routes)

// -> Đường dẫn cho Admin
router.use('/admin', adminRouter)

// -> Đường dẫn cho Giỏ hàng
router.use('/cart', cartRouter)

// -> Đường dẫn cho API (Trả về JSON)
router.use('/api', apiRouter)

// -> Đường dẫn cho thanh toán
router.use('/checkout', checkoutRouter)
// -> Đường dẫn cho đơn hàng
router.use('/order', orderRouter);

// -> Đường dẫn cho Khách hàng (Trang chủ, Sách...) - Để cuối cùng
router.use('/', userRouter)

// 4. Xử lý lỗi tập trung (Error Handling)
router.use((err, req, res, next) => {
    console.error('Lỗi hệ thống:', err); // In lỗi ra Terminal để cậu sửa

    const status = err.status || 500;
    const message = err.message || 'Lỗi hệ thống không xác định';

    // Nếu lỗi xảy ra trong khi gọi API -> Trả về JSON
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/cart')) {
        return res.status(status).json({
            success: false,
            status: status,
            message: message
        });
    }

    // Nếu lỗi xảy ra ở giao diện Web -> Trả về trang báo lỗi đẹp (hoặc text tạm)
    res.status(status).send(`
        <div style="text-align: center; padding: 50px;">
            <h1>⚠️ Đã có lỗi xảy ra!</h1>
            <p>${message}</p>
            <a href="/">Quay về trang chủ</a>
        </div>
    `);
});

export default router