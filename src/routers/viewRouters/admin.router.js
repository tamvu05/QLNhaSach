import express from 'express'
import CategoryController from '../../controllers/category.controller.js'
import AuthorController from '../../controllers/author.controller.js'
import PublisherController from '../../controllers/publisher.controller.js'
import BookController from '../../controllers/book.controller.js'
import SupplierController from '../../controllers/supplier.controller.js'
import ImportReceiptController from '../../controllers/importReceipt.controller.js'
import ExportReceiptController from '../../controllers/exportReceipt.controller.js'
import OrderController from '../../controllers/order.controller.js'
import InvoiceController from '../../controllers/invoice.controller.js'
import VoucherController from '../../controllers/voucher.controller.js'
import EmployeeController from '../../controllers/employee.controller.js'
import { checkLoginAdmin } from '../../middlewares/auth.middleware.js'
import { isAdmin } from '../../middlewares/auth.middleware.js'

const router = express.Router()

// router.use('/', checkLoginAdmin)

router.get('/category', CategoryController.getViewManager)
router.get('/author', AuthorController.getViewManager)
router.get('/publisher', PublisherController.getViewManager)
router.get('/book', BookController.getViewManager)
router.get('/supplier', SupplierController.getViewManager)
router.get('/import-receipt', ImportReceiptController.getViewManager)
router.get('/export-receipt', ExportReceiptController.getViewManager)
router.get('/sale/order', OrderController.getViewManager)
router.get('/sale/invoice', InvoiceController.getViewManager)
router.get('/discount', isAdmin, (req, res) => res.json('comming soon'))
router.get('/voucher', isAdmin, VoucherController.getViewManager)
router.get('/employee', isAdmin, EmployeeController.getViewManager)
router.get('/profile', (req, res, next) => {
    res.json(req.session.account)
})

router.get('/', (req, res, next) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
    })
})

export default router
