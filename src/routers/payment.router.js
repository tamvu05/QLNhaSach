import express from 'express';
import { createPaymentMoMo, momoReturn } from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/momo/checkout', createPaymentMoMo);

router.get('/momo/return', momoReturn);

export default router;