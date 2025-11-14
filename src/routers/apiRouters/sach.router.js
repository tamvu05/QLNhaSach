import express from 'express'
import SachController from '../../controllers/sach.controller.js'
const router = express.Router()

router.post('/', SachController.create);

router.put('/:id', SachController.update);

router.delete('/:id', SachController.delete);

router.patch('/:id/stock', SachController.updateStock);

export default router