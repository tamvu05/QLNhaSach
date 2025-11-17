import express from 'express'
import BookController from '../../controllers/book.controller.js'
import CategoryController from '../../controllers/category.controller.js'

const setUserLayout = (req, res, next) => {
    res.locals.userLayout = 'layouts/userLayout'
    next()
}

const router = express.Router()

router.use(setUserLayout)

router.get('/book', BookController.userGetAll);
router.get('/category', CategoryController.userGetAll)

export default router