import express from 'express'
import BookController from '../../controllers/book.controller.js'
import CategoryController from '../../controllers/category.controller.js'
import AuthController from '../../controllers/auth.controller.js' 
import UserController from '../../controllers/user.controller.js';

const router = express.Router()

// Middleware set layout riêng cho User
const setUserLayout = (req, res, next) => {
    // FIX: Đổi thành 'layout' để thư viện tự động nhận
    res.locals.layout = 'layouts/userLayout'
    next()
}

// Áp dụng middleware này cho tất cả các route bên dưới
router.use(setUserLayout)

// --- TRANG CHỦ ---
router.get('/', BookController.home);

// --- TRANG SÁCH & THỂ LOẠI ---
router.get('/book', BookController.userGetAll)
router.get('/book/:id', BookController.userGetById);
router.get('/category', CategoryController.userGetAll)

// --- 2. BỔ SUNG CÁC ROUTE XÁC THỰC (AUTH) ---
// Hiện form
router.get('/login', AuthController.loginPage);
router.get('/register', AuthController.registerPage);
router.get('/logout', AuthController.logout);

// Xử lý dữ liệu gửi lên (POST)
router.post('/login', AuthController.handleLogin);       
router.post('/register', AuthController.handleRegister); 

// --- ROUTE TÀI KHOẢN ---
router.get('/profile', UserController.getProfile);
router.post('/profile/update', UserController.updateProfile); 

export default router