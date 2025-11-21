// Đặt hàm này trong file JavaScript ngoài của bạn (ví dụ: app.js)

/**
 * Hiển thị thông báo Toast.
 * @param {string} message - Nội dung thông báo.
 * @param {'success'|'danger'|'info'} type - Loại màu sắc/icon của Toast.
 */
const showToast = (message, type = 'success') => {
    const container = document.querySelector('.toast-container')
    if (!container) return

    // Định nghĩa màu sắc và tiêu đề
    const bgColor =
        type === 'danger'
            ? 'bg-danger'
            : type === 'success'
            ? 'bg-success'
            : 'bg-info'
    const title =
        type === 'danger'
            ? 'Thất bại'
            : type === 'success'
            ? 'Thành công'
            : 'Thông báo'

    // HTML Template cho Toast (Bootstrap 5)
    const toastHTML = `
        <div class="toast align-items-center text-white ${bgColor} border-0" 
             role="alert" 
             aria-live="assertive" 
             aria-atomic="true" 
             data-bs-delay="4000">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}:</strong> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `

    // Chèn Toast vào container
    container.insertAdjacentHTML('beforeend', toastHTML)

    // Lấy phần tử Toast vừa được thêm
    const newToastEl = container.lastElementChild

    // Khởi tạo đối tượng Toast Bootstrap và hiển thị
    const toast = new bootstrap.Toast(newToastEl)
    toast.show()

    // Dọn dẹp: Xóa Toast khỏi DOM sau khi nó ẩn hoàn toàn
    newToastEl.addEventListener('hidden.bs.toast', () => {
        newToastEl.remove()
    })
}

export default showToast
