import express from 'express'
import AuthController from '../../controllers/auth.controller.js'

const router = express.Router()

router.get('/admin', AuthController.loginAdminPage)

export default router