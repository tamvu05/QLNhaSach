import OrderService from '../services/order.service.js'
import { orderConfig } from '../configs/adminView.config.js'

const OrderController = {
    // GET /order/history
    async history(req, res) {
        if (!req.session.user) return res.redirect('/login')

        const customerId = req.session.user.customerId

        // Gọi Service lấy danh sách
        const orders = await OrderService.getMyOrders(customerId)

        res.render('user/order-history', {
            title: 'Lịch sử đơn hàng',
            path: '/order',
            orders: orders,
        })
    },

    // GET /order/detail/:id
    async detail(req, res) {
        if (!req.session.user) return res.redirect('/login')

        const orderId = req.params.id

        // Gọi Service lấy dữ liệu trọn gói
        const data = await OrderService.getOrderDetail(orderId)

        if (!data) return res.redirect('/order/history') // Không tìm thấy thì về lịch sử

        res.render('user/order-detail', {
            title: 'Chi tiết đơn hàng #' + orderId,
            path: '/order',
            order: data.order, // Thông tin chung (Ngày, Người nhận...)
            items: data.items, // Danh sách sách
        })
    },

    // GET /admin/sale/order
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await OrderService.getWithParam(query)
            res.render('admin/saleOrder', {
                orders: data.orders,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.orders.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: orderConfig.scripts,
                entityName: orderConfig.entityName,
                tablePartial: orderConfig.tablePartial,
                modalAddSelector: orderConfig.modalAddSelector,
                modalAddPartial: orderConfig.modalAddPartial,
                // modalUpdatePartial: orderConfig.modalUpdatePartial,
                hrefBase: orderConfig.hrefBase,
                apiBase: orderConfig.apiBase,
                modalAddId: orderConfig.modalAddId,
                modalUpdateId: orderConfig.modalUpdateId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/sale/order
    async getPartials(req, res, next) {
        const renderPartial = (view, data) => {
            return new Promise((resolve, reject) => {
                req.app.render(view, data, (err, html) => {
                    if (err) {
                        console.error(`Lỗi render EJS cho view ${view}:`, err)
                        return reject(err)
                    }
                    resolve(html)
                })
            })
        }

        try {
            const query = req.query
            const data = await OrderService.getWithParam(query)
            const table = await renderPartial(
                'admin/partials/order/tableOrder',
                {
                    orders: data.orders,
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    totalItem: data.totalItem,
                    totalItemPerPage: data.orders.length,
                    PAGE_LIMIT: data.PAGE_LIMIT,
                }
            )

            const pagination = await renderPartial(
                'admin/partials/pagination',
                {
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    hrefBase: orderConfig.hrefBase,
                    apiBase: orderConfig.apiBase,
                }
            )

            return res.json({
                table,
                pagination,
                totalPage: data.totalPage,
            })
        } catch (error) {
            next(error)
        }
    },

    // GET /api/sale/order/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await OrderService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // GET /api/sale/order/detail/:id
    async getDetailById(req, res, next) {
        try {
            const { id } = req.params
            const data = await OrderService.getDetailById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // PATCH /api/sale/order/:id
    async updateState(req, res, next) {
        try {
            const { id } = req.params
            const { TrangThai } = req.body
            const data = await OrderService.updateState(id, TrangThai)
            res.json(data)
        } catch (error) {
            next(error)
        }
    },

    // DELETE /api/sale/order/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const data = await OrderService.delete(id)
            res.json(data)
        } catch (error) {
            next(error)
        }
    },
}

export default OrderController
