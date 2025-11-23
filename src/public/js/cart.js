// src/public/js/cart.js

document.addEventListener('DOMContentLoaded', () => {
    // Tìm tất cả nút "Thêm vào giỏ"
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    const cartBadge = document.querySelector('.bi-cart-fill').nextElementSibling; // Tìm cái số màu đỏ cạnh icon giỏ hàng

    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault(); // Chặn việc load lại trang hoặc nhảy link
            
            // Hiệu ứng bấm nút (cho người dùng biết là đã bấm)
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
            btn.disabled = true;

            const bookId = btn.getAttribute('data-id');

            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ bookId })
                });

                const result = await response.json();

                if (response.ok) {
                    // 1. Cập nhật số lượng trên Header
                    if (cartBadge) {
                        cartBadge.innerText = result.totalQuantity;
                        // Hiệu ứng rung lắc badge cho vui mắt
                        cartBadge.classList.add('animate-bounce');
                        setTimeout(() => cartBadge.classList.remove('animate-bounce'), 1000);
                    }

                    // 2. Thông báo thành công (Dùng alert tạm, sau này dùng Toast đẹp hơn)
                    alert('✅ Đã thêm vào giỏ hàng!');
                } else {
                    // Nếu chưa đăng nhập thì chuyển sang trang login
                    if (response.status === 401) {
                        alert('Vui lòng đăng nhập để mua hàng!');
                        window.location.href = '/login';
                    } else {
                        alert('❌ Lỗi: ' + result.message);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Lỗi kết nối server!');
            } finally {
                // Trả lại trạng thái cũ cho nút
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        });
    });

    // 1. Nút Tăng/Giảm
    const updateQuantity = async (btn, change) => {
        const row = btn.closest('tr');
        const bookId = row.getAttribute('data-book-id');
        const input = row.querySelector('.cart-qty-input');
        let newQty = parseInt(input.value) + change;

        if (newQty < 1) return; 

        try {
            const response = await fetch('/cart/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, quantity: newQty })
            });

            const result = await response.json();

            if (result.success) {
                // 1. Cập nhật số lượng trong ô input
                input.value = newQty;
                
                // 2. Tính lại Thành tiền của dòng đó
                const price = parseInt(row.querySelector('.cart-price').getAttribute('data-price'));
                const newTotal = price * newQty;
                row.querySelector('.cart-total').innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newTotal);

                // 3. Cập nhật Tạm tính & Tổng cộng (Server trả về grandTotal chuẩn)
                const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.grandTotal);
                
                // Cập nhật số Tổng cộng (Màu đỏ)
                document.querySelector('.cart-grand-total').innerText = formattedTotal;
                
                // --- THÊM MỚI: Cập nhật số Tạm tính (Màu đen ở trên) ---
                // Tìm phần tử chứa số tạm tính (nó là thẻ span nằm cùng hàng với chữ "Tạm tính:")
                // Cách an toàn nhất là gán thêm class .cart-subtotal vào HTML ở bước sau
                const subTotalEl = document.querySelector('.cart-subtotal');
                if (subTotalEl) subTotalEl.innerText = formattedTotal;

                // --- THÊM MỚI: Cập nhật Icon Giỏ hàng trên Header ---
                // Server cần trả về thêm totalQty trong API update thì mới cập nhật được
                // Nếu server chưa trả về, ta có thể tự tính tạm bằng cách cộng trừ trên giao diện (nhưng cách đó ko chuẩn)
                // Tốt nhất là sửa Controller trả về luôn totalQty.
                if (result.totalQty !== undefined) {
                    const cartBadge = document.querySelector('.bi-cart-fill').nextElementSibling;
                    if (cartBadge) cartBadge.innerText = result.totalQty;
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    document.querySelectorAll('.btn-increase').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn, 1));
    });

    document.querySelectorAll('.btn-decrease').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn, -1));
    });

    // 2. Nút Xóa
    document.querySelectorAll('.btn-remove-cart').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('Bạn có chắc muốn xóa sách này?')) return;

            const row = this.closest('tr');
            const bookId = row.getAttribute('data-book-id');

            const response = await fetch('/cart/remove', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId })
            });

            const result = await response.json();
            if (result.success) {
                row.remove(); // Xóa dòng khỏi bảng HTML
                
                // Cập nhật lại tổng tiền và icon giỏ hàng
                document.querySelector('.cart-grand-total').innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.grandTotal);
                if (cartBadge) cartBadge.innerText = result.totalQty;

                // Nếu xóa hết thì reload để hiện giao diện giỏ trống
                if (result.totalQty === 0) location.reload();
            }
        });
    });
});