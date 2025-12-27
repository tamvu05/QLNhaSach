import express from 'express'
import authorRouter from './author.router.js'
import categoryRouter from './category.router.js'
import publisherRouter from './publisher.router.js'
import bookRouter from './book.router.js'
import supplierRouter from './supplier.router.js'
import importReceiptRouter from './importReceipt.router.js'
import exportReceiptRouter from './exportReceipt.router.js'
import orderRouter from './order.router.js'
import invoiceRouter from './invoice.router.js'
import voucherRouter from './voucher.router.js'
import employeeRouter from './employee.router.js'
import authRouter from './auth.router.js'
import profileRouter from './profile.router.js'
import chatRouter from './chat.router.js'

const router = express.Router()

router.use('/author', authorRouter)
router.use('/category', categoryRouter)
router.use('/publisher', publisherRouter)
router.use('/book', bookRouter)
router.use('/supplier', supplierRouter)
router.use('/import-receipt', importReceiptRouter)
router.use('/export-receipt', exportReceiptRouter)
router.use('/sale/order', orderRouter)
router.use('/sale/invoice', invoiceRouter)
router.use('/voucher', voucherRouter)
router.use('/employee', employeeRouter)
router.use('/auth', authRouter)
router.use('/profile', profileRouter)
router.use('/chat', chatRouter)

export default router
