import AuthorModel from '../models/author.model.js'

const AuthorService = {
    async getAll() {
        return await AuthorModel.getAll()
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã tác giả')

        const tg = await AuthorModel.getById(id)
        if (!tg) throw new Error('Tác giả không tồn tại')

        return tg
    },

    async create(payload) {
        const { TenTG, GhiChu } = payload

        // Validate nghiệp vụ
        if (!TenTG || TenTG.trim() === '') {
            throw new Error('Tên tác giả là bắt buộc')
        }

        const insertId = await AuthorModel.create({ TenTG, GhiChu })

        return await AuthorModel.getById(insertId)
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã tác giả')

        const exist = await AuthorModel.getById(id)
        if (!exist) throw new Error('Tác giả không tồn tại')

        const { TenTG, GhiChu } = payload

        if (!TenTG || TenTG.trim() === '') {
            throw new Error('Tên tác giả là bắt buộc')
        }

        const success = await AuthorModel.update(id, { TenTG, GhiChu })
        if (!success) throw new Error('Cập nhật thất bại')

        return await AuthorModel.getById(id)
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã tác giả')

        const exist = await AuthorModel.getById(id)
        if (!exist) throw new Error('Tác giả không tồn tại')

        const success = await AuthorModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },
}

export default AuthorService
