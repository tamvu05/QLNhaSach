import express from 'express'
import sachRouter from './sach.router.js'
const router = express.Router()

router.use('/sach', sachRouter)

export default router
