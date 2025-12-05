import pool from '../configs/db.js'
import config from '../configs/app.config.js'
import OrderModel from '../models/order.model.js'

const { PAGE_LIMIT } = config

const OrderService = {
    // Lấy danh sách đơn hàng của 1 khách
    async getMyOrders(customerId) {
        try {
            // Sắp xếp ngày giảm dần (Đơn mới nhất lên đầu)
            const query = `
                SELECT * FROM DonHang 
                WHERE MaKH = ? 
                ORDER BY NgayDat DESC
            `
            const [orders] = await pool.query(query, [customerId])
            return orders
        } catch (error) {
            console.error(error)
            return []
        }
    },

    // Lấy chi tiết 1 đơn hàng (Gồm các sách bên trong) - Để dùng cho trang chi tiết đơn sau này
    async getOrderDetail(orderId) {
        try {
            // 1. Lấy thông tin chung của đơn hàng
            const [orders] = await pool.query(
                'SELECT * FROM DonHang WHERE MaDH = ?',
                [orderId]
            )
            const order = orders[0]

            if (!order) return null

            // 2. Lấy danh sách sách trong đơn đó (JOIN với bảng Sach để lấy Tên và Ảnh)
            const queryItems = `
                SELECT ct.*, s.TenSach, s.HinhAnh
                FROM CTDonHang ct
                JOIN Sach s ON ct.MaSach = s.MaSach
                WHERE ct.MaDH = ?
            `
            const [items] = await pool.query(queryItems, [orderId])

            return { order, items }
        } catch (error) {
            console.error(error)
            return null
        }
    },

    async getWithParam(query) {
        let { page, sort, order, keyword, status } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 20) limit = 10

        if (!keyword) keyword = ''

        const total = await OrderModel.getTotal(keyword)
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
        ]

        const sortBy = validParam.includes(sort) ? sort : 'MaDH'
        const sortOrder = validParam.includes(order) ? order : 'DESC'
        status = validStatus.includes(status) ? status : ''

        const orders = await OrderModel.getWithParam(
            limit,
            offset,
            sortBy,
            sortOrder,
            keyword,
            status
        )

        return {
            orders,
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

        const order = await OrderModel.getById(id)
        if (!order) throw new Error('Đơn hàng không tồn tại')

        return order
    },

    async getDetailById(id) {
        if (!id) throw new Error('Thiếu mã đơn hàng')

        const order = await OrderModel.getDetailById(id)
        if (!order) throw new Error('Đơn hàng không tồn tại')

        return order
    },

    async updateState(id, TrangThai) {
        if (!id) throw new Error('Thiếu mã đơn hàng')
        const isValid = [
            'CHO_XAC_NHAN',
            'DANG_CHUAN_BI_HANG',
            'DA_GIAO_CHO_DON_VI_VAN_CHUYEN',
            'DA_GIAO',
            'DA_HUY',
            'DA_HOAN_TRA',
        ]
        TrangThai = isValid.includes(TrangThai) ? TrangThai : 'CHO_XAC_NHAN'

        if (TrangThai === 'DA_GIAO') {
            const vnTime = new Date().toLocaleString('sv-SE', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })

            const updateInvoiceDate = await OrderModel.updateInvoiceDate(id, vnTime)
            if (!updateInvoiceDate) throw new Error('Cập nhật trạng thái đơn hàng thất bại')
        }

        const result = await OrderModel.updateState(id, TrangThai)

        if (!result) throw new Error('Cập nhật trạng thái đơn hàng thất bại')
        return result
    },

    async delete(id) {
        try {
            const result = await OrderModel.delete(id)
            return result
        } catch (error) {
            throw error
        }
    },
}

export default OrderService
