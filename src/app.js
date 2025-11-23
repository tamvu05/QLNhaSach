import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import morgan from 'morgan'
import compression from 'compression'
import session from 'express-session'
import router from './routers/index.js'
import path from 'path'
import expressEjsLayouts from 'express-ejs-layouts'
import CartService from './services/cart.service.js'

const app = express()
const __dirname = import.meta.dirname

// init middlewares
app.use(express.json()) // For parsing application/json
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(morgan('dev'))
app.use(compression())

// CẤU HÌNH SESSION (Thêm đoạn này) 
app.use(session({
    secret: 'secret-key-cua-du-an-nay', // Chuỗi bí mật (đặt gì cũng được)
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Localhost dùng http nên để false. Khi nào lên https thì sửa thành true
        maxAge: 24 * 60 * 60 * 1000 // Session sống trong 24 giờ
    }
}));

// TRUYỀN USER XUỐNG VIEW (Thêm đoạn này) 
// Giúp tất cả file .ejs đều dùng được biến 'user' mà không cần truyền thủ công ở từng Controller
app.use(async(req, res, next) => {
    res.locals.user = req.session.user || null; 

    // --- ĐOẠN MỚI: Lấy số lượng giỏ hàng thật từ DB ---
    if (req.session.user && req.session.user.customerId) {
        const count = await CartService.getCartCount(req.session.user.customerId);
        res.locals.totalQuantity = count;
    } else {
        res.locals.totalQuantity = 0;
    }

    next();
});
// --------------------------------------------

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(expressEjsLayouts)
app.set('layout', 'layouts/adminLayout') // Đặt layout mặc định là adminLayout

// init routers
app.use(router)

export default app