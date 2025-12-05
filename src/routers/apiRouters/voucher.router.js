import express from 'express'
import VoucherController from '../../controllers/voucher.controller.js'

const router = express.Router()

router.get('/partials', VoucherController.getPartials)
router.get('/:id', VoucherController.getById)
router.post('/', VoucherController.create)
router.put('/:id', VoucherController.update)
router.delete('/:id', VoucherController.delete)

export default router
