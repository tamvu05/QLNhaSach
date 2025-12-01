import SupplierModel from '../models/supplier.model.js'
import config from '../configs/app.config.js'
import { createHttpError } from '../utils/errorUtil.js'

const { PAGE_LIMIT } = config

const SupplierService = {
    async getAll() {
        return await SupplierModel.getAll()
    },

    async getWithParam(query) {
        let { page, sort, order, keyword } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const total = await SupplierModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaNCC', 'TenNCC', 'ASC', 'asc', 'DESC', 'desc']

        const sortBy = validParam.includes(sort) ? sort : 'MaNCC'
        const sortOrder = validParam.includes(order) ? order : 'DESC'

        const suppliers = await SupplierModel.getWithParam(
            limit,
            offset,
            sortBy,
            sortOrder,
            keyword
        )

        return {
            suppliers,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã nhà cung cấp')

        const ncc = await SupplierModel.getById(id)
        if (!ncc) throw new Error('Nhà cung cấp không tồn tại')

        return ncc
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã nhà cung cấp')

        const exist = await SupplierModel.getById(id)
        if (!exist) throw new Error('Nhà cung cấp không tồn tại')

        const { TenNCC, DiaChi, SDT } = payload

        if (
            !TenNCC ||
            !DiaChi ||
            !SDT ||
            TenNCC === '' ||
            DiaChi === '' ||
            SDT === ''
        )
            throw createHttpError('Thông tin nhà cung cấp không hợp lệ', 401)

        const success = await SupplierModel.update(id, {
            TenNCC,
            DiaChi,
            SDT,
        })

        if (!success) throw new Error('Cập nhật thất bại')

        return await SupplierModel.getById(id)
    },

    async create(payload) {
        const { TenNCC, DiaChi, SDT } = payload

        if (
            !TenNCC ||
            !DiaChi ||
            !SDT ||
            TenNCC === '' ||
            DiaChi === '' ||
            SDT === ''
        )
            throw createHttpError('Thông tin nhà cung cấp không hợp lệ', 401)

        const insertId = await SupplierModel.create(payload)

        return insertId
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã nhà cung cấp')

        const exist = await SupplierModel.getById(id)
        if (!exist) throw new Error('Nhà cung cấp không tồn tại')

        /// kiểm tra nhà cung cấp có trong phiếu nhập

        const success = await SupplierModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },
}

export default SupplierService
