import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import router from './routers/index.js'
import dotenv from 'dotenv'

dotenv.config()
const app = express()

// init middlewares
app.use(morgan('dev'))
app.use(helmet())
app.use(compression())

// init db

// init routers
app.use(router)

// handling error

// Test connect db

export default app
