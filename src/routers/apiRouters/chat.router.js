import express from 'express';
import ChatController from '../../controllers/chat.controller.js';

const router = express.Router();

// Định nghĩa route: POST /chat
router.post('/', ChatController.chat);

export default router;