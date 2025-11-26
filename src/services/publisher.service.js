import PublisherModel from '../models/publisher.model.js'
import BookModel from '../models/book.model.js'
import config from '../configs/app.config.js'
import { createHttpError } from '../utils/errorUtil.js'

const {PAGE_LIMIT} = config

const PublisherService = {
    async getAll() {
        return await PublisherModel.getAll()
    },

    async getWithParam(query) {
        let {page, sort, order, keyword} = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if(!keyword) keyword = ''

        const total = await PublisherModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaNXB', 'TenNXB', 'MoTa', 'ASC', 'asc', 'DESC', 'desc']

        const sortBy = validParam.includes(sort) ? sort : 'MaNXB'
        const sortOrder = validParam.includes(order) ? order : 'DESC'

        const publishers = await PublisherModel.getWithParam(limit, offset, sortBy, sortOrder, keyword)

        return {
            publishers,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw new Error('Thiếu mã nhà xuất bản')

        const nxb = await PublisherModel.getById(id)
        if (!nxb) throw new Error('Nhà xuất bản không tồn tại')

        return nxb
    },

    async create(payload) {
        const { TenNXB, MoTa } = payload

        if (!TenNXB || TenNXB.trim() === '') throw new Error('Tên nhà xuất bản là bắt buộc')

        const exist = await PublisherModel.getByName(TenNXB)
        if(exist) throw createHttpError('Trùng tên nhà xuất bản', 409)

        const insertId = await PublisherModel.create({
            TenNXB,
            MoTa
        })

        return await PublisherModel.getById(insertId)
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã nhà xuất bản')

        const exist = await PublisherModel.getById(id)
        if (!exist) throw new Error('Nhà xuất bản không tồn tại')

        const { TenNXB, MoTa } = payload

        if (!TenNXB || TenNXB.trim() === '') throw new Error('Tên nhà xuất bản là bắt buộc')

        const existOther = await PublisherModel.getOtherByName(TenNXB, id)
        if(existOther) throw createHttpError('Trùng tên nhà xuất bản', 409)

        const success = await PublisherModel.update(id, {
            TenNXB,
            MoTa
        })

        if (!success) throw new Error('Cập nhật thất bại')

        return await PublisherModel.getById(id)
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã nhà xuất bản')

        const exist = await PublisherModel.getById(id)
        if (!exist) throw new Error('Nhà xuất bản không tồn tại')

        const countBook = await BookModel.countByPublisher(id)
        if(countBook > 0) throw createHttpError('Không thể xóa nhà xuất bản vì đang có sách tham chiếu', 409)

        const success = await PublisherModel.delete(id)
        if (!success) throw new Error('Xóa thất bại')

        return true
    },

    
}

export default PublisherService
