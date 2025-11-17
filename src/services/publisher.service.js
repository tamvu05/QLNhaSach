import PublisherModel from '../models/publisher.model.js'

const PublisherService = {
    async getAll() {
        return await PublisherModel.getAll()
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã nhà xuất bản')

        const nxb = await PublisherModel.getById(id)
        if (!nxb) throw new Error('Nhà xuất bản không tồn tại')

        return nxb
    },

    async create(payload) {
        const { TenNXB, DiaChi, Email, SDT } = payload

        // Validate nghiệp vụ
        if (!TenNXB || TenNXB.trim() === '') throw new Error('Tên nhà xuất bản là bắt buộc')

        const insertId = await PublisherModel.create({
            TenNXB,
            DiaChi,
            Email,
            SDT,
        })

        return await PublisherModel.getById(insertId)
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã nhà xuất bản')

        const exist = await PublisherModel.getById(id)
        if (!exist) throw new Error('Nhà xuất bản không tồn tại')

        const { TenNXB, DiaChi, Email, SDT } = payload

        if (!TenNXB || TenNXB.trim() === '') throw new Error('Tên nhà xuất bản là bắt buộc')

        const success = await PublisherModel.update(id, {
            TenNXB,
            DiaChi,
            Email,
            SDT,
        })

        if (!success) throw new Error('Cập nhật thất bại')

        return await PublisherModel.getById(id)
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã nhà xuất bản')

        const exist = await PublisherModel.getById(id)
        if (!exist) throw new Error('Nhà xuất bản không tồn tại')

        const success = await PublisherModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },
}

export default PublisherService
