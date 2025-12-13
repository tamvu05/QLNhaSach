import config from '../configs/app.config.js'
import EmployeeModel from '../models/employee.model.js'
import { createHttpError } from '../utils/errorUtil.js'
import bcrypt from 'bcrypt'

const { PAGE_LIMIT } = config

const EmployeeService = {
    async getWithParam(query) {
        let { page, sort, order, keyword, status } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const total = await EmployeeModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaNV', 'NgayVaoLam', 'ASC', 'asc', 'DESC', 'desc']
        const validStatus = ['ACTIVE', 'LOCKED']

        const sortBy = validParam.includes(sort) ? sort : 'MaNV'
        const sortOrder = validParam.includes(order) ? order : 'DESC'
        status = validStatus.includes(status) ? status : ''

        const employees = await EmployeeModel.getWithParam(limit, offset, sortBy, sortOrder, keyword, status)

        return {
            employees,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async getById(id) {
        if (!id) throw createHttpError('Thiếu mã nhân viên!', 401)

        const employee = await EmployeeModel.getById(id)
        if (!employee) throw createHttpError('Nhân viên không tồn tại!', 401)

        return employee
    },

    async create(payload) {
        try {
            for (const key in payload) {
                if (!payload[key] || payload[key] === '') throw createHttpError('Thông tin nhân viên không hợp lệ!', 401)
            }

            const existEmail = await EmployeeModel.existEmail(payload.Email)
            if (existEmail) throw createHttpError('Trùng email đăng nhập!', 409)

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(payload.MatKhau, salt)

            payload.MatKhauHash = hashedPassword

            const insertId = await EmployeeModel.create(payload)

            return insertId
        } catch (error) {
            throw error
        }
    },

    async update(id, payload) {
        try {
            const employee = await EmployeeModel.getById(id)
            if (!employee) throw createHttpError('Nhân viên không tồn tại!', 401)

            for (const key in payload) {
                if (!payload[key] || payload[key] === '') throw createHttpError('Thông tin nhân viên không hợp lệ!', 401)
            }

            if (payload.MatKhau) {
                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash(payload.MatKhau, salt)

                payload.MatKhauHash = hashedPassword
            }

            const result = await EmployeeModel.update(id, payload)
            if (!result) throw createHttpError('Lỗi khi cập nhật employee!', 401)

            return result
        } catch (error) {
            throw error
        }
    },

    // async delete(id) {
    //     try {
    //         const employee = await EmployeeModel.getById(id)
    //         if (!employee) throw createHttpError('Mã giảm giá không tồn tại!', 401)

    //         if (employee.SLDaDung > 0) throw createHttpError('Mã giảm giá đã được sử dụng!', 401)

    //         const result = await EmployeeModel.delete(id)
    //         if (!result) throw createHttpError('Lỗi khi xóa employee!', 401)

    //         return result
    //     } catch (error) {
    //         throw error
    //     }
    // },
}

export default EmployeeService
