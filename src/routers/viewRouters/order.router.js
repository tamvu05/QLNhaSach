import express from 'express';
import OrderController from '../../controllers/order.controller.js';

const router = express.Router();

// Middleware ép giao diện User
router.use((req, res, next) => {
    res.locals.layout = 'layouts/userLayout';
    next();
});

// Đường dẫn xem lịch sử
router.get('/history', OrderController.history);

// Đường dẫn xem chi tiết đơn hàng
router.get('/detail/:id', OrderController.detail);

export default router;