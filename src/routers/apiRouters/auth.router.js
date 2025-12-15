import express from 'express'
import AuthController from '../../controllers/auth.controller.js'

const router = express.Router()

router.get('/logout', AuthController.logoutAdmin)
router.post('/login-admin', AuthController.loginAdmin)

export default router
