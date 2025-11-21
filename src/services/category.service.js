import CategoryModel from '../models/category.model.js'
import BookModel from '../models/book.model.js'

const CategoryService = {
    async getAll(page, limit) {
        let currentPage = Number(page)
        limit = Number(limit)

        if (isNaN(limit) || limit < 4 || limit > 20) limit = 10

        const total = await CategoryModel.getTotal()
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const categories = await CategoryModel.getAll(limit, offset)
        return {
            categories,
            currentPage,
            limit,
            totalPage,
            total,
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

        // Validate nghiệp vụ
        if (!TenTL || TenTL.trim() === '') {
            throw new Error('Tên thể loại là bắt buộc')
        }

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
            throw new Error('Không thể xóa thể loại vì đang có sách tham chiếu')

        const success = await CategoryModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },

    async checkUnique(TenTL) {
        if (!TenTL) throw new Error('Thiếu tên thể loại')

        const exist = await CategoryModel.getByName(TenTL)
        if (exist) return false
        return true
    },
}

export default CategoryService
