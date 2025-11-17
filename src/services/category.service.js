import CategoryModel from '../models/category.model.js'

const CategoryService = {
    async getAll() {
        return await CategoryModel.getAll()
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã thể loại')

        const tl = await CategoryModel.getById(id)
        if (!tl) throw new Error('Thể loại không tồn tại')

        return tl
    },

    async create(payload) {
        const { TenTL, GhiChu } = payload

        // Validate nghiệp vụ
        if (!TenTL || TenTL.trim() === '') {
            throw new Error('Tên thể loại là bắt buộc')
        }

        const insertId = await CategoryModel.create({ TenTL, GhiChu })
        return await CategoryModel.getById(insertId)
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã thể loại')

        const exist = await CategoryModel.getById(id)
        if (!exist) throw new Error('Thể loại không tồn tại')

        const { TenTL, GhiChu } = payload

        if (!TenTL || TenTL.trim() === '') {
            throw new Error('Tên thể loại là bắt buộc')
        }

        const success = await CategoryModel.update(id, { TenTL, GhiChu })
        if (!success) throw new Error('Cập nhật thất bại')

        return await CategoryModel.getById(id)
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã thể loại')

        const exist = await CategoryModel.getById(id)
        if (!exist) throw new Error('Thể loại không tồn tại')

        const success = await CategoryModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },
}

export default CategoryService
