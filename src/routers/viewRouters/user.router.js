import express from 'express'
import BookController from '../../controllers/book.controller.js'
import CategoryController from '../../controllers/category.controller.js'

const router = express.Router()

// Middleware set layout riêng cho User
const setUserLayout = (req, res, next) => {
    // FIX: Đổi thành 'layout' để thư viện tự động nhận
    res.locals.layout = 'layouts/userLayout'
    next()
}

// Áp dụng middleware này cho tất cả các route bên dưới
router.use(setUserLayout)

router.get('/', BookController.home);

router.get('/book', BookController.userGetAll)
router.get('/book/:id', BookController.userGetById);
router.get('/category', CategoryController.userGetAll)

export default router