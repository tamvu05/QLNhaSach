import express from 'express'
import OrderController from '../../controllers/order.controller.js'

const router = express.Router()

router.get('/partials', OrderController.getPartials)
router.get('/detail/:id', OrderController.getDetailById)
router.get('/:id', OrderController.getById)
router.patch('/:id/status', OrderController.updateState)
router.delete('/:id', OrderController.delete)

export default router
