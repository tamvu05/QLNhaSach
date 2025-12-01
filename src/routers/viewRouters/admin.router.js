import express from 'express'
import CategoryController from '../../controllers/category.controller.js'
import AuthorController from '../../controllers/author.controller.js'
import PublisherController from '../../controllers/publisher.controller.js'
import BookController from '../../controllers/book.controller.js'

const router = express.Router()

router.get('/category', CategoryController.getViewManager)
router.get('/author', AuthorController.getViewManager)
router.get('/publisher', PublisherController.getViewManager)
router.get('/book', BookController.getViewManager)


router.get('/', (req, res, next) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
    })
})

export default router
