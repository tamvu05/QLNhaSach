import config from '../configs/app.config.js'
import { createHttpError } from '../utils/errorUtil.js'
import ImportReceiptModel from '../models/importReceipt.model.js'

const { PAGE_LIMIT } = config

const ImportReceiptService = {
    async getWithParam(query) {
        let { page, sort, order, keyword } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const total = await ImportReceiptModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaPN', 'NgayNhap', 'TenNCC', 'ASC', 'asc', 'DESC', 'desc']

        const sortBy = validParam.includes(sort) ? sort : 'MaPN'
        const sortOrder = validParam.includes(order) ? order : 'DESC'

        const importReceipts = await ImportReceiptModel.getWithParam(
            limit,
            offset,
            sortBy,
            sortOrder,
            keyword
        )

        return {
            importReceipts,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã phiếu nhập')

        const PN = await ImportReceiptModel.getById(id)
        if (!PN) throw new Error('Phiếu nhập không tồn tại')

        return PN
    },

     async getDetailById(id) {
        if (!id) throw new Error('Thiếu mã phiếu nhập')

        const PN = await ImportReceiptModel.getDetailById(id)
        if (!PN) throw new Error('Phiếu nhập không tồn tại')

        return PN
    },

    // async update(id, payload) {
    //     if (!id) throw new Error('Thiếu mã nhà cung cấp')

    //     const exist = await ImportReceiptModel.getById(id)
    //     if (!exist) throw new Error('Nhà cung cấp không tồn tại')

    //     const { TenNCC, DiaChi, SDT } = payload

    //     if (
    //         !TenNCC ||
    //         !DiaChi ||
    //         !SDT ||
    //         TenNCC === '' ||
    //         DiaChi === '' ||
    //         SDT === ''
    //     )
    //         throw createHttpError('Thông tin nhà cung cấp không hợp lệ', 401)

    //     const success = await ImportReceiptModel.update(id, {
    //         TenNCC,
    //         DiaChi,
    //         SDT,
    //     })

    //     if (!success) throw new Error('Cập nhật thất bại')

    //     return await ImportReceiptModel.getById(id)
    // },

    async create(payload) {
        const { MaNCC, MaNV, NgayNhap, ChiTietPN } = payload

        if (!MaNCC || !MaNV || !NgayNhap || !ChiTietPN || 
            MaNCC === '' || MaNV === '' || NgayNhap === '' || ChiTietPN.length === 0)
            throw createHttpError('Thông tin phiếu nhập không hợp lệ', 401)

        const insertId = await ImportReceiptModel.create(payload)

        return insertId
    },

    // async delete(id) {
    //     if (!id) throw new Error('Thiếu mã nhà cung cấp')

    //     const exist = await ImportReceiptModel.getById(id)
    //     if (!exist) throw new Error('Nhà cung cấp không tồn tại')

    //     /// kiểm tra nhà cung cấp có trong phiếu nhập

    //     const success = await ImportReceiptModel.delete(id)
    //     if (!success) throw new Error('Xóa thất bại')

    //     return true
    // },
}

export default ImportReceiptService
