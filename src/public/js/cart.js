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
});