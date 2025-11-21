import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import router from './routers/index.js'
import dotenv from 'dotenv'
import path from 'path'
import expressEjsLayouts from 'express-ejs-layouts'

dotenv.config()
const app = express()
const __dirname = import.meta.dirname

// init middlewares
app.use(express.json()) // For parsing application/json
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(morgan('dev'))
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                'style-src': [
                    "'self'",
                    'https://cdn.jsdelivr.net',
                    'https://ka-f.fontawesome.com',
                    // Bổ sung: Google Fonts CSS
                    'https://fonts.googleapis.com', 
                    "'unsafe-inline'",
                ],
                'script-src': [
                    "'self'",
                    'https://cdn.jsdelivr.net',
                    'https://kit.fontawesome.com',
                ],
                'connect-src': [
                    "'self'",
                    'https://cdn.jsdelivr.net',
                    'https://ka-f.fontawesome.com',
                ],
                'font-src': [
                    "'self'", 
                    'https://ka-f.fontawesome.com',
                    // Bổ sung: Google Fonts files
                    'https://fonts.gstatic.com',
                    // Bổ sung: Bootstrap Icons files
                    'https://cdn.jsdelivr.net', 
                ],
            },
        },
    })
);
app.use(compression())

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(expressEjsLayouts)
app.set('layout', 'layouts/adminLayout') // Đặt layout mặc định là adminLayout

// init db

// init routers
app.use(router)

export default app
