import CartService from '../services/cart.service.js';
import CheckoutService from '../services/checkout.service.js';
import UserService from '../services/user.service.js';

const CheckoutController = {
    // GET /checkout
    async index(req, res) {
        try {
            if (!req.session.user) return res.redirect('/login');

            const customerId = req.session.user.customerId;
            const userId = req.session.user.id;
            
            const voucherCode = req.query.voucher || null;
            
            // 1. Xử lý danh sách ID sách được chọn (Lọc rác, ép số)
            const selectedStr = req.query.selected || ''; 
            const selectedIds = selectedStr
                .split(',')
                .map(id => parseInt(id))
                .filter(id => !isNaN(id) && id > 0); // Chỉ lấy ID hợp lệ

            // 2. Lấy dữ liệu giỏ hàng
            const data = await CartService.getCartDetails(customerId);
            if (!data || !data.items || data.items.length === 0) return res.redirect('/cart');

            // 3. Lọc sách theo danh sách đã chọn
            let checkoutItems = data.items;
            if (selectedIds.length > 0) {
                // Ép kiểu String/Number về cùng 1 loại để so sánh
                checkoutItems = data.items.filter(item => selectedIds.includes(Number(item.MaSach)));
            }

            // Nếu lọc xong mà rỗng (do hack URL) -> Về giỏ hàng
            if (checkoutItems.length === 0) return res.redirect('/cart');

            // 4. 🔥 TÍNH TỔNG TIỀN "BẤT TỬ" (Khắc phục triệt để lỗi NaN)
            const grandTotal = checkoutItems.reduce((sum, item) => {
                // Ép kiểu về số, nếu lỗi hoặc null thì tính là 0
                const price = Number(item.DonGia) || 0;
                const qty = Number(item.SoLuong) || 0;
                
                // Chỉ cộng khi cả 2 là số dương
                if (price > 0 && qty > 0) {
                    return sum + (price * qty);
                }
                return sum;
            }, 0);

            // Kiểm tra lần cuối, nếu grandTotal vẫn NaN thì gán bằng 0
            const safeGrandTotal = isNaN(grandTotal) ? 0 : grandTotal;

            const customerInfo = await UserService.getProfile(userId);
            
            // Tính giảm giá
            let discountAmount = await CheckoutService.calculateDiscount(voucherCode, safeGrandTotal, customerId);
            // Fix lỗi nếu discount ra NaN
            if (isNaN(discountAmount)) discountAmount = 0;

            let finalTotal = safeGrandTotal - discountAmount;
            if (finalTotal < 0) finalTotal = 0;

            // Debug xem server tính ra bao nhiêu (Xem trong Terminal)
            console.log(`💰 Checkout Log: Tổng=${safeGrandTotal}, Giảm=${discountAmount}, Cuối=${finalTotal}`);

            res.render('user/checkout', {
                title: 'Thanh toán',
                path: '/checkout',
                cartItems: checkoutItems, 
                
                grandTotal: safeGrandTotal,    
                discountAmount: discountAmount,
                finalTotal: finalTotal,        
                voucherCode: voucherCode,       
                
                selectedItems: selectedStr, 

                user: customerInfo || { HoTen: '', SDT: '', DiaChi: '' } 
            });
        } catch (error) {
            console.error('Lỗi trang Checkout:', error);
            res.redirect('/cart'); // Có lỗi thì đẩy về giỏ hàng cho an toàn
        }
    },

    // POST /checkout/order
    async order(req, res) {
        if (!req.session.user) return res.redirect('/login');

        try {
            const customerId = req.session.user.customerId;
            const { voucherCode, selectedItems, ...orderInfo } = req.body; 

            // Chuyển chuỗi "1,2,3" thành mảng [1, 2, 3] an toàn
            const selectedIds = selectedItems 
                ? selectedItems.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) 
                : [];

            const orderId = await CheckoutService.placeOrder(customerId, orderInfo, voucherCode, selectedIds);

            res.locals.totalQuantity = 0;
            res.render('user/order-success', {
                title: 'Đặt hàng thành công',
                path: '/checkout',
                orderId: orderId
            });

        } catch (error) {
            console.error('Lỗi Controller Order:', error);
            res.status(500).send('Lỗi đặt hàng. Vui lòng thử lại.');
        }
    }
};

export default CheckoutController;