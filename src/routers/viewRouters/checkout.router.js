import express from 'express';
import CheckoutController from '../../controllers/checkout.controller.js';

const router = express.Router();

// Middleware ép layout User
router.use((req, res, next) => {
    res.locals.layout = 'layouts/userLayout';
    next();
});

// Trang điền thông tin
router.get('/', CheckoutController.index);

// Xử lý nút "Đặt hàng"
router.post('/order', CheckoutController.order);

export default router;