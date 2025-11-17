import express from 'express'
import authorRouter from './author.router.js'
import categoryRouter from './category.router.js'
import publisherRouter from './publisher.router.js'
import bookRouter from './book.router.js'


const router = express.Router()

router.use('/author', authorRouter)
router.use('/category', categoryRouter)
router.use('/publisher', publisherRouter)
router.use('/book', bookRouter)

export default router
