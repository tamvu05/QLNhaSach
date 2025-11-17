import express from 'express'
import BookController from '../../controllers/book.controller.js'
import CategoryController from '../../controllers/category.controller.js'

const router = express.Router()

router.get('/book', BookController.getAll)
router.get('/category', CategoryController.getAll)

router.get('/', (req, res, next) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
    })
})

export default router
