import AuthorModel from '../models/author.model.js'
import config from '../configs/app.config.js'
const {PAGE_LIMIT} = config

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
        const { TenTG, MoTa } = payload

        // Validate nghiệp vụ
        if (!TenTG || TenTG.trim() === '') {
            throw new Error('Tên tác giả là bắt buộc')
        }

        const insertId = await AuthorModel.create({ TenTG, MoTa })

        return await AuthorModel.getById(insertId)
    },

    async update(id, payload) {
        if (!id) throw new Error('Thiếu mã tác giả')

        const exist = await AuthorModel.getById(id)
        if (!exist) throw new Error('Tác giả không tồn tại')

        const { TenTG, MoTa } = payload

        if (!TenTG || TenTG.trim() === '') {
            throw new Error('Tên tác giả là bắt buộc')
        }

        const success = await AuthorModel.update(id, { TenTG, MoTa })
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

    async getWithParam(query) {
        const {page, sort, order} = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        const total = await AuthorModel.getTotal()
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaTG', 'TenTG', 'MoTa', 'ASC', 'asc', 'DESC', 'desc']

        const sortBy = validParam.includes(sort) ? sort : 'MaTG'
        const sortOrder = validParam.includes(order) ? order : 'DESC'
        
        const authors = await AuthorModel.getWithParam(limit, offset, sortBy, sortOrder)
        // const totalItem = await AuthorModel.getTotal()

        return {
            authors,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },
}

export default AuthorService
