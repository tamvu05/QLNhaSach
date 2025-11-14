import express from 'express'
import viewRouter from './viewRouters/index.js'
import apiRouter from './apiRouters/index.js'

const router = express.Router()

router.use('/api', apiRouter)
router.use('/', viewRouter)

export default router
