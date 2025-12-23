import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import morgan from 'morgan'
import compression from 'compression'
import session from 'express-session'
import { RedisStore } from 'connect-redis'
import { createClient } from 'redis'
import router from './routers/index.js'
import path from 'path'
import expressEjsLayouts from 'express-ejs-layouts'
import helmet from 'helmet' // Import Helmet

// Import Service Giỏ hàng
import CartService from './services/cart.service.js'

const app = express()
const __dirname = import.meta.dirname

// 1. Middleware cơ bản
app.use(express.json()) 
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(morgan('dev'))
app.use(compression())

// 2. Cấu hình Helmet (Tắt CSP để không chặn ảnh/script)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}))

// 3. Cấu hình Redis Session Store
const redisClient = createClient({ url: process.env.REDIS_URL })
redisClient.on('error', (err) => console.error('Redis Client Error', err))
await redisClient.connect()
console.log('Connected to Redis successfully')

const redisStore = new RedisStore({ client: redisClient, prefix: 'sess:' })

app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'secret-key-cua-du-an-nay',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // đặt true nếu dùng HTTPS
        maxAge: 24 * 60 * 60 * 1000,
    },
}))

// 4. Middleware toàn cục: Check User & Đếm Giỏ hàng
app.use(async (req, res, next) => {
    // Gán user cho View
    res.locals.user = req.session.user || null; 

    // Mặc định giỏ hàng là 0
    res.locals.totalQuantity = 0;

    console.log("🔍 Kiểm tra Session User:", req.session.user);

    // Nếu đã đăng nhập -> Gọi DB đếm số lượng
    if (req.session.user && req.session.user.customerId) {
        try {
            // console.log('👤 User ID:', req.session.user.id); // (Debug)
            const count = await CartService.getCartCount(req.session.user.customerId);
            res.locals.totalQuantity = count;
        } catch (err) {
            console.error('Lỗi đếm giỏ hàng:', err);
        }
    }

    next();
});

// 5. Cấu hình View Engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(expressEjsLayouts)
app.set('layout', 'layouts/adminLayout') 

// 6. Router
app.use(router)

export default app