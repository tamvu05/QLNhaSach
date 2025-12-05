import express from 'express'
import InvoiceController from '../../controllers/invoice.controller.js'

const router = express.Router()

router.get('/partials', InvoiceController.getPartials)
router.get('/detail/:id', InvoiceController.getDetailById)
router.get('/:id', InvoiceController.getById)
router.post('/', InvoiceController.create)

export default router
