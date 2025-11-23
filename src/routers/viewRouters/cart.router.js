import express from 'express';
import CartController from '../../controllers/cart.controller.js';

const router = express.Router();

// Định nghĩa đường dẫn: POST /cart/add
router.post('/add', CartController.add);

export default router;