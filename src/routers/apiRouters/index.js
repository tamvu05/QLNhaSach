import express from 'express'
import authorRouter from './author.router.js'
import categoryRouter from './category.router.js'
import publisherRouter from './publisher.router.js'
import bookRouter from './book.router.js'
import supplierRouter from './supplier.router.js'


const router = express.Router()

router.use('/author', authorRouter)
router.use('/category', categoryRouter)
router.use('/publisher', publisherRouter)
router.use('/book', bookRouter)
router.use('/supplier', supplierRouter)

export default router
