import OrderService from '../services/order.service.js';

const OrderController = {
    // GET /order/history
    async history(req, res) {
        if (!req.session.user) return res.redirect('/login');

        const customerId = req.session.user.customerId;
        
        // Gọi Service lấy danh sách
        const orders = await OrderService.getMyOrders(customerId);

        res.render('user/order-history', {
            title: 'Lịch sử đơn hàng',
            path: '/order',
            orders: orders
        });
    },

    // GET /order/detail/:id
    async detail(req, res) {
        if (!req.session.user) return res.redirect('/login');

        const orderId = req.params.id;
        
        // Gọi Service lấy dữ liệu trọn gói
        const data = await OrderService.getOrderDetail(orderId);

        if (!data) return res.redirect('/order/history'); // Không tìm thấy thì về lịch sử

        res.render('user/order-detail', {
            title: 'Chi tiết đơn hàng #' + orderId,
            path: '/order',
            order: data.order,  // Thông tin chung (Ngày, Người nhận...)
            items: data.items   // Danh sách sách
        });
    }
};

export default OrderController;