import express from 'express';
import CheckoutController from '../../controllers/checkout.controller.js';
import MomoController from '../../controllers/momo.controller.js';

const router = express.Router();

// Middleware ép layout User
router.use((req, res, next) => {
    res.locals.layout = 'layouts/userLayout';
    next();
});

// Trang điền thông tin
router.get('/', CheckoutController.index);

// Xử lý nút "Đặt hàng" (COD)
router.post('/order', CheckoutController.order);

// Xử lý thanh toán MoMo
router.post('/momo', MomoController.createPayment);
router.get('/momo/callback', MomoController.callback);
router.post('/momo/ipn', MomoController.ipn);

export default router;