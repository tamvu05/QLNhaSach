import express from 'express'
import ImportReceiptController from '../../controllers/importReceipt.controller.js'

const router = express.Router()

router.get('/partials', ImportReceiptController.getPartials)
router.get('/detail/:id', ImportReceiptController.getDetailById)
router.get('/:id', ImportReceiptController.getById)
router.post('/', ImportReceiptController.create)
router.put('/cancel/:id', ImportReceiptController.cancel)

export default router
