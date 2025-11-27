import express from 'express';
import { createPaymentMoMo, momoReturn } from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/create_payment_url_momo', createPaymentMoMo);

router.get('/payment/momo_return', momoReturn);

export default router;