import BookModel from '../models/book.model.js'

const BookService = {
    async getAll() {
        return await BookModel.getAll()
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã sách')

        const data = await BookModel.getById(id)
        if (!data) throw new Error('Không tìm thấy sách')

        return data
    },

    async create(payload) {
        const { TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon } = payload

        // Validate nghiệp vụ
        if (!TenSach) throw new Error('Tên sách bắt buộc')
        if (!MaTG) throw new Error('Thiếu mã tác giả')
        if (!MaNXB) throw new Error('Thiếu mã nhà xuất bản')
        if (!MaTL) throw new Error('Thiếu mã thể loại')
        if (!DonGia) throw new Error('Thiếu đơn giá')

        const insertId = await BookModel.create({
            TenSach,
            MaTG,
            MaNXB,
            MaTL,
            DonGia,
            SoLuongTon: SoLuongTon ?? 1,
        })

        return this.getById(insertId)
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã sách')

        const exist = await BookModel.getById(id)
        if (!exist) throw new Error('Sách không tồn tại')

        const { TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon } = payload

        // Validate nghiệp vụ
        if (!TenSach) throw new Error('Tên sách bắt buộc')
        if (!MaTG) throw new Error('Thiếu mã tác giả')
        if (!MaNXB) throw new Error('Thiếu mã nhà xuất bản')
        if (!MaTL) throw new Error('Thiếu mã thể loại')
        if (!DonGia) throw new Error('Thiếu đơn giá')
        if (SoLuongTon === undefined || SoLuongTon === null) throw new Error('Thiếu số lượng tồn')

        const success = await BookModel.update(id, { TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon })
        if (!success) throw new Error('Cập nhật thất bại')

        return await BookModel.getById(id)
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã sách')

        const exist = await BookModel.getById(id)
        if (!exist) throw new Error('Sách không tồn tại')

        const success = await BookModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },

    async updateStock(id, amount) {
        if (!id) throw new Error('Thiếu mã sách')
        if (typeof amount !== 'number') throw new Error('Số lượng phải là số')

        const exist = await BookModel.getById(id)
        if (!exist) throw new Error('Sách không tồn tại')

        const success = await BookModel.updateStock(id, amount)
        if (!success) throw new Error('Không cập nhật được tồn kho')

        return await BookModel.getById(id)
    },
}

export default BookService
