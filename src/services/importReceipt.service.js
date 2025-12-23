import config from '../configs/app.config.js'
import { createHttpError } from '../utils/errorUtil.js'
import ImportReceiptModel from '../models/importReceipt.model.js'
import EmployeeModel from '../models/employee.model.js'

const { PAGE_LIMIT } = config

const ImportReceiptService = {
    async getWithParam(query, account = {}) {
        let { page, sort, order, keyword } = query
        const { VaiTro, MaNV } = account || {}

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const filterMaNV = Number(VaiTro) === 3 ? MaNV : null

        const total = await ImportReceiptModel.getTotal(keyword, filterMaNV)
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
            keyword,
            filterMaNV
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

    async create(payload) {
        let { MaNCC, MaNV, MaTK, NgayNhap, ChiTietPN } = payload

        if (!MaNV && MaTK) {
            MaNV = await EmployeeModel.getEmpIdByAccountId(MaTK)
        }

        if (!MaNV) throw createHttpError('Nhân viên chưa đăng nhập', 401)

        if (!MaNCC || !NgayNhap || !ChiTietPN ||
            MaNCC === '' || NgayNhap === '' || ChiTietPN.length === 0)
            throw createHttpError('Thông tin phiếu nhập không hợp lệ', 401)

        const insertId = await ImportReceiptModel.create({ ...payload, MaNV })

        return insertId
    },

    async cancel(id) {
        if (!id) throw createHttpError('Thiếu mã phiếu nhập', 400)

        const receipt = await ImportReceiptModel.getById(id)
        if (!receipt) throw createHttpError('Phiếu nhập không tồn tại', 404)

        const result = await ImportReceiptModel.cancel(id)

        return result
    },
}

export default ImportReceiptService
