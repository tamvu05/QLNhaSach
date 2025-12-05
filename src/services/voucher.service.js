import config from '../configs/app.config.js'
import VoucherModel from '../models/voucher.model.js'
import { createHttpError } from '../utils/errorUtil.js'

const { PAGE_LIMIT } = config

const VoucherService = {
    async getWithParam(query) {
        let { page, sort, order, keyword, status } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const total = await VoucherModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaVC', 'NgayBD', 'NgayKT', 'ASC', 'asc', 'DESC', 'desc']
        const validStatus = ['HOAT_DONG', 'VO_HIEU']

        const sortBy = validParam.includes(sort) ? sort : 'MaVC'
        const sortOrder = validParam.includes(order) ? order : 'DESC'
        status = validStatus.includes(status) ? status : ''

        const vouchers = await VoucherModel.getWithParam(limit, offset, sortBy, sortOrder, keyword, status)

        return {
            vouchers,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw createHttpError('Thiếu id voucher!', 401)

        const voucher = await VoucherModel.getById(id)
        if (!voucher) throw createHttpError('Voucher không tồn tại!', 401)

        return voucher
    },

    async create(payload) {
        for (const key in payload) {
            if (!payload[key] || payload[key] === '') throw createHttpError('Thông tin mã giảm giá không hợp lệ!', 401)
        }

        const voucher = await VoucherModel.getById(payload.MaVC)
        if (voucher) throw createHttpError('Trùng mã giảm giá!', 409)

        const insertId = await VoucherModel.create(payload)

        return insertId
    },

    async update(id, payload) {
        const voucher = await VoucherModel.getById(id)
        if (!voucher) throw createHttpError('Mã giảm giá không tồn tại!', 401)

        for (const key in payload) {
            if (!payload[key] || payload[key] === '') throw createHttpError('Thông tin mã giảm giá không hợp lệ!', 401)
        }

        const endDate = new Date(payload.NgayKT)

        if (endDate < voucher.NgayBD) throw createHttpError('Ngày kết thúc phải sau ngày bắt đầu!', 409)
        if (payload.SoLuong < voucher.SLDaDung) throw createHttpError('Số lượng điều chỉnh phải lớn hơn số lượng đã dùng!', 409)

        const result = await VoucherModel.update(id, payload)
        if (!result) throw createHttpError('Lỗi khi cập nhật voucher!', 401)

        return result
    },

    async delete(id) {
        try {
            const voucher = await VoucherModel.getById(id)
            if (!voucher) throw createHttpError('Mã giảm giá không tồn tại!', 401)

            if (voucher.SLDaDung > 0) throw createHttpError('Mã giảm giá đã được sử dụng!', 401)

            const result = await VoucherModel.delete(id)
            if (!result) throw createHttpError('Lỗi khi xóa voucher!', 401)

            return result
        } catch (error) {
            throw error
        }
    },
}

export default VoucherService
