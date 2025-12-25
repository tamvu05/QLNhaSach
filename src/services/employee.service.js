import config from '../configs/app.config.js'
import EmployeeModel from '../models/employee.model.js'
import { createHttpError } from '../utils/errorUtil.js'
import { uploadImage, deleteImage } from '../utils/cloudinary.js'
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

    async delete(id) {
        try {
            const employee = await EmployeeModel.getById(id)
            if (!employee) throw createHttpError('Nhân viên không tồn tại!', 404)

            const hasTransactions = await EmployeeModel.hasTransactions(id)
            if (hasTransactions) {
                throw createHttpError('Nhân viên đã phát sinh giao dịch, không thể xóa!', 409)
            }

            const result = await EmployeeModel.delete(id)
            if (!result) throw createHttpError('Lỗi khi xóa nhân viên!', 500)

            return result
        } catch (error) {
            throw error
        }
    },

    async updateProfile(MaNV, payload, isManager = false) {
        const allowed = ['HoTen', 'SDT', 'NgaySinh']
        if (isManager) allowed.push('Email')

        const data = {}
        for (const key of allowed) {
            if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
                data[key] = payload[key]
            }
        }

        if (!data.HoTen || !data.SDT || !data.NgaySinh) {
            throw createHttpError('Vui lòng nhập đầy đủ Họ tên, SĐT, Ngày sinh', 400)
        }

        // Basic phone check
        const phoneRegex = /^(0|\+84)(9\d|8\d|7\d|5\d|3\d)\d{7}$/
        if (!phoneRegex.test(String(data.SDT).trim())) {
            throw createHttpError('Số điện thoại không hợp lệ', 400)
        }

        // Date validity
        const dob = new Date(data.NgaySinh)
        if (isNaN(dob.getTime())) {
            throw createHttpError('Ngày sinh không hợp lệ', 400)
        }

        const result = await EmployeeModel.updateProfile(MaNV, data, isManager)
        if (!result) throw createHttpError('Cập nhật hồ sơ thất bại', 500)

        return result
    },

    async changePassword(MaNV, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw createHttpError('Thiếu mật khẩu hiện tại hoặc mật khẩu mới', 400)
        }

        const account = await EmployeeModel.getAccountByEmployeeId(MaNV)
        if (!account) throw createHttpError('Tài khoản không tồn tại', 404)

        const match = await bcrypt.compare(String(currentPassword), account.MatKhauHash)
        if (!match) throw createHttpError('Mật khẩu hiện tại không đúng', 401)

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(String(newPassword), salt)

        const ok = await EmployeeModel.updatePassword(account.MaTK, hash)
        if (!ok) throw createHttpError('Đổi mật khẩu thất bại', 500)

        return true
    },

    async updateAvatar(MaNV, file) {
        if (!MaNV) throw createHttpError('Thiếu mã nhân viên', 400)
        if (!file || !file.path) throw createHttpError('Chưa có file ảnh tải lên', 400)

        const employee = await EmployeeModel.getById(MaNV)
        if (!employee) throw createHttpError('Nhân viên không tồn tại', 404)

        let uploaded = null
        try {
            uploaded = await uploadImage(file.path, 'employee_avatars')
        } catch (err) {
            throw createHttpError(err?.message || 'Tải ảnh thất bại', 500)
        }

        try {
            const ok = await EmployeeModel.updateAvatar(MaNV, {
                HinhAnh: uploaded.url,
                HinhAnhID: uploaded.publicId,
            })

            if (!ok) throw new Error('Cập nhật ảnh đại diện thất bại')

            if (employee.HinhAnhID) {
                await deleteImage(employee.HinhAnhID)
            }

            return { HinhAnh: uploaded.url, HinhAnhID: uploaded.publicId }
        } catch (err) {
            if (uploaded?.publicId) {
                await deleteImage(uploaded.publicId)
            }
            throw createHttpError(err?.message || 'Cập nhật ảnh đại diện thất bại', 500)
        }
    },
}

export default EmployeeService
