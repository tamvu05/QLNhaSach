import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import config from '../configs/cloudinary.config.js'

const { api_secret, api_key, cloud_name } = config

cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret,
})

/**
 * Tải file lên Cloudinary và đảm bảo xóa file tạm trên server.
 * @param {string} filePath - Đường dẫn file tạm thời trên server (từ req.file.path).
 * @param {string} folderName - Tên thư mục Cloudinary để lưu trữ.
 * @returns {Promise<{url: string, publicId: string}>} - URL và Public ID của ảnh.
 */
const uploadImage = async (filePath, folderName = 'book_covers') => {
    let isTempFileDeleted = false

    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            folder: folderName,
            resource_type: 'auto',
        })

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            isTempFileDeleted = true
        }

        return {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        }
    } catch (error) {
        console.error('Lỗi tải lên Cloudinary:', error)

        if (!isTempFileDeleted && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        throw new Error('Tải ảnh lên dịch vụ lưu trữ thất bại.')
    }
}

/**
 * Xóa file ảnh khỏi Cloudinary bằng Public ID.
 * @param {string} publicId - Public ID (HinhAnhID) của ảnh cần xóa.
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công.
 */
const deleteImage = async (publicId) => {
    if (!publicId) {
        return true
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId)

        if (result.result === 'ok' || result.result === 'not found') {
            console.log(`Đã xóa ảnh Cloudinary ID: ${publicId}`)
            return true
        } else {
            console.error(`Lỗi xóa ảnh Cloudinary: ${JSON.stringify(result)}`)
            return false
        }
    } catch (error) {
        console.error('Lỗi kết nối hoặc API khi xóa ảnh:', error)
        throw new Error('Không thể xóa tài sản trên Cloudinary.')
    }
}

export { uploadImage, deleteImage }
