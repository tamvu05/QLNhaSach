import express from 'express'
import viewRouter from './viewRouters/index.js'
import apiRouter from './apiRouters/index.js'

const router = express.Router()

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)

router.use('/api', asyncHandler(apiRouter))
router.use('/', asyncHandler(viewRouter))

// handling error
router.use((err, req, res, next) => {
    console.error(err.stack) // Log lỗi chi tiết (khuyến nghị)

    let statusCode = 500 // Mặc định là lỗi Server
    let clientMessage = 'Lỗi server không xác định!'

    // Kiểm tra các lỗi logic/nghiệp vụ cụ thể (Client Error 4xx)
    if (
        err.message.includes('tham chiếu') ||
        err.message.includes('không tồn tại') ||
        err.message.includes('bắt buộc')
    ) {
        statusCode = 409 // 409 Conflict hoặc 400 Bad Request
        clientMessage = err.message
    }

    // Gửi phản hồi lỗi với mã trạng thái phù hợp
    return res.status(statusCode).json({
        message: clientMessage,
        // Chỉ trả về lỗi chi tiết ở môi trường dev
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
})

export default router
