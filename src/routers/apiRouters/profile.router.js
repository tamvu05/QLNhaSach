import express from 'express'
import EmployeeController from '../../controllers/employee.controller.js'
import { createUploadMiddleware } from '../../middlewares/upload.js'

const router = express.Router()

// Simple session check for API
router.use((req, res, next) => {
    if (!req?.session?.account?.MaNV) {
        return res.status(401).json({ message: 'Chưa đăng nhập' })
    }
    next()
})

router.put('/', EmployeeController.updateProfile)
router.put('/password', EmployeeController.updatePassword)
router.put('/avatar', createUploadMiddleware('avatar'), EmployeeController.updateAvatar)

export default router
