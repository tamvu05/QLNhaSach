import pool from '../configs/db.js'
import CategoryModel from '../models/category.model.js'
import BookModel from '../models/book.model.js'
import { createHttpError } from '../utils/errorUtil.js'
import config from '../configs/app.config.js'
const {PAGE_LIMIT} = config

const CategoryService = {
    // Lấy tất cả thể loại (Dùng cho cả User và Admin)
    async getAll() {
        try {
            // Query trực tiếp bảng TheLoai
            const [rows] = await pool.query('SELECT * FROM TheLoai')
            return rows
        } catch (error) {
            console.error('❌ Lỗi lấy danh sách thể loại:', error)
            return []
        }
    },

    // Truyền page nếu cần phân trang, không truyền thì lấy tất cả
    async getWithParam(query) {
        const {page, sort, order} = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        const total = await CategoryModel.getTotal()
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaTL', 'TenTL', 'MoTa', 'ASC', 'asc', 'DESC', 'desc']

        const sortBy = validParam.includes(sort) ? sort : 'MaTL'
        const sortOrder = validParam.includes(order) ? order : 'DESC'
        

        const categories = await CategoryModel.getWithParam(limit, offset, sortBy, sortOrder)
        const totalItem = await CategoryModel.getTotal()

        return {
            categories,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã thể loại')

        const tl = await CategoryModel.getById(id)
        if (!tl) throw new Error('Thể loại không tồn tại')

        return tl
    },

    async create(payload) {
        const { TenTL, MoTa } = payload

        if (!TenTL || TenTL.trim() === '') {
            throw new Error('Tên thể loại là bắt buộc')
        }

        const exist = await CategoryModel.getByName(TenTL)
        if (exist) throw createHttpError('Trùng tên thể loại', 409)

        const insertId = await CategoryModel.create({ TenTL, MoTa })
        return await CategoryModel.getById(insertId)
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã thể loại')

        const exist = await CategoryModel.getById(id)
        if (!exist) throw new Error('Thể loại không tồn tại')

        const { TenTL, MoTa } = payload

        if (!TenTL || TenTL.trim() === '') {
            throw new Error('Tên thể loại là bắt buộc')
        }

        const existOther = await CategoryModel.getOtherByName(TenTL, exist.MaTL)
        if (existOther) throw createHttpError('Trùng tên thể loại', 409)

        const success = await CategoryModel.update(id, { TenTL, MoTa })
        if (!success) throw new Error('Cập nhật thất bại')

        return await CategoryModel.getById(id)
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã thể loại')

        const exist = await CategoryModel.getById(id)
        if (!exist) throw new Error('Thể loại không tồn tại')

        const bookCount = await BookModel.countByCategory(id)
        if (bookCount > 0)
            throw createHttpError('Không thể xóa thể loại vì đang có sách tham chiếu', 409)

        const success = await CategoryModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },
}

export default CategoryService
