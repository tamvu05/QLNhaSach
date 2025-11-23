import express from 'express';
import CartController from '../../controllers/cart.controller.js';

const router = express.Router();

// Middleware ép layout User (như đã làm)
router.use((req, res, next) => {
    res.locals.layout = 'layouts/userLayout';
    next();
});

router.get('/', CartController.index);
router.post('/add', CartController.add);
router.patch('/update', CartController.updateItem); 
router.delete('/remove', CartController.removeItem); 

export default router;