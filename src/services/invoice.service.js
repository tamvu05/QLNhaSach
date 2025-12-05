import config from '../configs/app.config.js'
import InvoiceModel from '../models/invoice.model.js'

const { PAGE_LIMIT } = config

const InvoiceService = {
    async getWithParam(query) {
        let { page, sort, order, keyword, status } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const total = await InvoiceModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaDH', 'NgayDat', 'ASC', 'asc', 'DESC', 'desc']
        const validStatus = [
            'CHO_XAC_NHAN',
            'DANG_CHUAN_BI_HANG',
            'DA_GIAO_CHO_DON_VI_VAN_CHUYEN',
            'DA_GIAO',
            'DA_HUY',
            'DA_HOAN_TRA',
            'DA_BAN_TRUC_TIEP'
        ]

        const sortBy = validParam.includes(sort) ? sort : 'MaDH'
        const sortOrder = validParam.includes(order) ? order : 'DESC'
        status = validStatus.includes(status) ? status : ''

        const invoices = await InvoiceModel.getWithParam(
            limit,
            offset,
            sortBy,
            sortOrder,
            keyword,
            status
        )

        return {
            invoices,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã đơn hàng')

        const invoice = await InvoiceModel.getById(id)
        if (!invoice) throw new Error('Đơn hàng không tồn tại')

        return invoice
    },

    async getDetailById(id) {
        if (!id) throw new Error('Thiếu mã đơn hàng')

        const detail = await InvoiceModel.getDetailById(id)
        if (!detail) throw new Error('Đơn hàng không tồn tại')

        return detail
    },

    async create(payload) {
        try {
            const { MaNV, NgayTao,  ChiTietHD} = payload

            if (
                !MaNV ||
                !NgayTao ||
                !ChiTietHD ||
                MaNV === '' ||
                NgayTao === '' ||
                ChiTietHD.length === 0
            )
                throw createHttpError('Thông tin hóa đơn không hợp lệ', 401)

            if(!payload.SDT) payload.SDT = ''

            const insertId = await InvoiceModel.create(payload)

            return insertId
        } catch (error) {
            throw error
        }
    },
}

export default InvoiceService
