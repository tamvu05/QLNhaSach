// src/public/js/cart.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. CẤU HÌNH TOAST (Thông báo nhỏ ở góc)
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end', // Hiện ở góc trên phải
        showConfirmButton: false,
        timer: 3000, // Tự tắt sau 3 giây
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    // Tìm tất cả nút "Thêm vào giỏ"
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    const cartBadge = document.querySelector('.bi-cart-fill')?.nextElementSibling;

    // --- XỬ LÝ THÊM VÀO GIỎ ---
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            
            // Hiệu ứng loading cho nút
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
            btn.disabled = true;

            const bookId = btn.getAttribute('data-id');

            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookId })
                });

                const result = await response.json();

                if (response.ok) {
                    // Cập nhật số lượng trên Header
                    if (cartBadge) {
                        cartBadge.innerText = result.totalQuantity;
                        cartBadge.classList.add('animate-bounce');
                        setTimeout(() => cartBadge.classList.remove('animate-bounce'), 1000);
                    }

                    // ✅ THAY ALERT BẰNG TOAST THÀNH CÔNG
                    Toast.fire({
                        icon: 'success',
                        title: 'Đã thêm vào giỏ hàng!'
                    });

                } else {
                    // Nếu chưa đăng nhập: Hiện Popup hỏi đăng nhập
                    if (response.status === 401) {
                        Swal.fire({
                            title: 'Bạn chưa đăng nhập',
                            text: "Vui lòng đăng nhập để tiếp tục mua sắm!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#0d6efd',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Đăng nhập ngay',
                            cancelButtonText: 'Để sau'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = '/login';
                            }
                        });
                    } else {
                        // Lỗi khác: Hiện Toast lỗi
                        Toast.fire({
                            icon: 'error',
                            title: result.message || 'Có lỗi xảy ra'
                        });
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.fire({
                    icon: 'error',
                    title: 'Lỗi kết nối server!'
                });
            } finally {
                // Trả lại trạng thái cũ cho nút
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        });
    });

    // --- XỬ LÝ TĂNG/GIẢM SỐ LƯỢNG ---
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
                // 1. Cập nhật số lượng hiển thị
                input.value = newQty;
                
                // 2. Tính lại Thành tiền của dòng đó
                // (Giả sử row có attribute data-price chứa giá gốc)
                const price = parseFloat(row.getAttribute('data-price')) || 0;
                const newTotal = price * newQty;
                
                // Cập nhật text hiển thị thành tiền
                const totalDisplay = row.querySelector('.cart-total-display');
                if(totalDisplay) {
                    totalDisplay.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newTotal);
                }

                // Cập nhật data cho checkbox (để tính tổng tiền khi chọn)
                const checkbox = row.querySelector('.item-checkbox');
                if (checkbox) {
                    checkbox.setAttribute('data-total', newTotal);
                }

                // Gọi hàm tính lại Tổng cộng (Hàm này nằm bên file cart.ejs)
                if (typeof window.updateCartSelection === 'function') {
                    window.updateCartSelection();
                }

                // Cập nhật icon giỏ hàng trên header
                if (result.totalQty !== undefined && cartBadge) {
                    cartBadge.innerText = result.totalQty;
                }
            }
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Không thể cập nhật số lượng' });
        }
    };

    document.querySelectorAll('.btn-increase').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn, 1));
    });

    document.querySelectorAll('.btn-decrease').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn, -1));
    });

    // --- XỬ LÝ XÓA SẢN PHẨM ---
    document.querySelectorAll('.btn-remove-cart').forEach(btn => {
        btn.addEventListener('click', async function() {
            // ✅ Thay confirm mặc định bằng Swal Popup đẹp hơn
            const confirmResult = await Swal.fire({
                title: 'Xóa sách này?',
                text: "Bạn có chắc muốn xóa sản phẩm khỏi giỏ hàng?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Xóa luôn',
                cancelButtonText: 'Giữ lại'
            });

            if (!confirmResult.isConfirmed) return;

            const row = this.closest('tr');
            const bookId = row.getAttribute('data-book-id');

            try {
                const response = await fetch('/cart/remove', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookId })
                });

                const result = await response.json();
                if (result.success) {
                    row.remove(); // Xóa dòng HTML
                    
                    // Gọi hàm tính lại Tổng cộng
                    if (typeof window.updateCartSelection === 'function') {
                        window.updateCartSelection();
                    }

                    if (cartBadge) cartBadge.innerText = result.totalQty;
                    
                    // Hiện thông báo đã xóa
                    Toast.fire({ icon: 'success', title: 'Đã xóa sản phẩm!' });

                    // Nếu xóa hết thì reload để hiện giao diện giỏ trống
                    if (result.totalQty === 0) location.reload();
                } else {
                    Toast.fire({ icon: 'error', title: 'Không thể xóa sản phẩm' });
                }
            } catch (error) {
                console.error(error);
                Toast.fire({ icon: 'error', title: 'Lỗi kết nối server!' });
            }
        });
    });

    // XỬ LÝ NÚT "MUA NGAY" 
    const buyNowButtons = document.querySelectorAll('.btn-buy-now');

    buyNowButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Hiệu ứng Loading
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Đang xử lý...';
            btn.classList.add('disabled');

            const bookId = btn.getAttribute('data-id');

            try {
                // 1. Gọi API thêm vào giỏ hàng trước
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookId })
                });

                if (response.ok) {
                    // 2. Nếu thành công -> Chuyển hướng ngay sang trang Thanh toán
                    // Kèm theo tham số selected để chỉ thanh toán cuốn này
                    window.location.href = `/checkout?selected=${bookId}`;
                } else {
                    // Xử lý lỗi (ví dụ chưa đăng nhập)
                    if (response.status === 401) {
                        Swal.fire({
                            title: 'Bạn chưa đăng nhập',
                            text: "Vui lòng đăng nhập để mua hàng!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#0d6efd',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Đăng nhập ngay',
                            cancelButtonText: 'Để sau'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = '/login';
                            }
                        });
                        // Trả lại nút bình thường
                        btn.innerHTML = originalContent;
                        btn.classList.remove('disabled');
                    } else {
                        const result = await response.json();
                        Swal.fire('Lỗi!', result.message || 'Không thể mua hàng lúc này', 'error');
                        btn.innerHTML = originalContent;
                        btn.classList.remove('disabled');
                    }
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Lỗi!', 'Không thể kết nối đến server', 'error');
                btn.innerHTML = originalContent;
                btn.classList.remove('disabled');
            }
        });
    });
});