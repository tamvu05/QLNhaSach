import config from '../configs/app.config.js'
import { createHttpError } from '../utils/errorUtil.js'
import ExportReceiptModel from '../models/exportReceipt.model.js'

const { PAGE_LIMIT } = config

const ExportReceiptService = {
    async getWithParam(query) {
        let { page, sort, order, keyword } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const total = await ExportReceiptModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = [
            'MaPX',
            'NgayXuat',
            'TenNV',
            'ASC',
            'asc',
            'DESC',
            'desc',
        ]

        const sortBy = validParam.includes(sort) ? sort : 'MaPX'
        const sortOrder = validParam.includes(order) ? order : 'DESC'

        const exportReceipts = await ExportReceiptModel.getWithParam(
            limit,
            offset,
            sortBy,
            sortOrder,
            keyword
        )

        return {
            exportReceipts,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã phiếu xuất')

        const PX = await ExportReceiptModel.getById(id)
        if (!PX) throw new Error('Phiếu xuất không tồn tại')

        return PX
    },

    async getDetailById(id) {
        if (!id) throw new Error('Thiếu mã phiếu xuất')

        const PX = await ExportReceiptModel.getDetailById(id)
        if (!PX) throw new Error('Phiếu xuất không tồn tại')

        return PX
    },

    async create(payload) {
        try {
            const { MaNV, NgayXuat, ChiTietPX } = payload

            if (
                !MaNV ||
                !NgayXuat ||
                !ChiTietPX ||
                MaNV === '' ||
                NgayXuat === '' ||
                ChiTietPX.length === 0
            )
                throw createHttpError('Thông tin phiếu xuất không hợp lệ', 401)

            const insertId = await ExportReceiptModel.create(payload)

            return insertId
        } catch (error) {
            throw error
        }
    },
}

export default ExportReceiptService
