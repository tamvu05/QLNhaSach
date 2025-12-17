import BaseTable from './base.table.js'

const DANG_GIAO = 'DA_GIAO_CHO_DON_VI_VAN_CHUYEN'

function formatToVietNamTime(dateInput) {
    const dateObject = new Date(dateInput)

    const options = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }
    return dateObject.toLocaleString('vi-VN', options)
}

class OrderModal {
    constructor(orderTableInstance) {
        this.orderTableInstance = orderTableInstance

        // Modal và Buttons
        this.modal = document.querySelector('#add-order-modal')
        this.btnSave = this.modal.querySelector('.btn-save')

        // Khu vực hiển thị thông tin
        this.labelName = this.modal.querySelector('#view-hoten')
        this.labelPhone = this.modal.querySelector('#view-sdt')
        this.labelAdresss = this.modal.querySelector('#view-diachi')
        this.labelNote = this.modal.querySelector('#view-noidung')
        this.selectStatus = this.modal.querySelector('#order-status-select')
        this.tableDetails = this.modal.querySelector('#view-receipt-items-body')
        this.totalPrice = this.modal.querySelector('#view-total-amount')
        this.labelDate = this.modal.querySelector('#view-ngaydat')

        this.currentOrderId = null
        this.bookItems = null

        this.TRANG_THAI = {
            CHO_XAC_NHAN: 'Chờ xác nhận',
            DANG_CHUAN_BI_HANG: 'Đang chuẩn bị hàng',
            DA_GIAO_CHO_DON_VI_VAN_CHUYEN: 'Đã chuyển cho đơn vị vận chuyển',
            DA_GIAO: 'Đã giao hàng',
            DA_HUY: 'Đã hủy',
        }

        this.initEventListeners()
    }

    initEventListeners() {
        if (this.btnSave) {
            this.btnSave.addEventListener(
                'click',
                this.updateOrderStatus.bind(this)
            )
        }

        // Đóng modal (reset trạng thái)
        if (this.modal) {
            this.modal.addEventListener(
                'hidden.bs.modal',
                this.resetModal.bind(this)
            )
        }
    }

    // Hàm format tiền tệ (Lấy từ tableOrder.ejs)
    formatPrice(price) {
        const numericPrice = Number(price)

        if (isNaN(numericPrice)) {
            return '0 ₫'
        }

        const formatter = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
        return formatter.format(numericPrice)
    }

    // Hàm cập nhật trạng thái đơn hàng
    async updateOrderStatus() {
        if (!this.currentOrderId) return

        try {
            const newStatus = this.selectStatus.value

            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const res = await fetch(
                `/api/sale/order/${this.currentOrderId}/status`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ TrangThai: newStatus }),
                }
            )

            const data = await res.json()

            if (!res.ok) {
                throw new Error(
                    data.message ||
                        `Lỗi HTTP ${res.status}: Cập nhật trạng thái thất bại`
                )
            }

            Swal.close()
            Swal.fire({
                title: 'Cập nhật trạng thái đơn hàng thành công!',
                icon: 'success',
                draggable: true,
            })

            this.modal.querySelector('.btn-close').click()
            this.orderTableInstance.updateView(null)
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error)

            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Cập nhật trạng thái đơn hàng thất bại!',
                text: error.message,
            })
        }
    }

    // Hàm nạp dữ liệu chi tiết và hiển thị modal
    async initValue(id) {
        this.currentOrderId = id

        try {
            const res1 = await fetch('/api/sale/order/' + id)
            const orderData = await res1.json()

            if (!res1.ok) {
                throw new Error(
                    orderData.message ||
                        `Lỗi HTTP ${res1.status}: Không tìm thấy đơn hàng`
                )
            }

            const res2 = await fetch('/api/sale/order/detail/' + id)
            const orderDetail = await res2.json()

            if (!res2.ok) {
                throw new Error(
                    orderDetail.message ||
                        `Lỗi HTTP ${res2.status}: Không tìm thấy đơn hàng`
                )
            }

            this.labelName.textContent = orderData.TenNguoiNhan
            this.labelPhone.textContent = orderData.SDT
            this.labelAdresss.textContent = orderData.DiaChiNhan
            this.labelNote.textContent = orderData.GhiChu || 'Không có ghi chú'
            this.labelDate.textContent = formatToVietNamTime(orderData.NgayDat)

            this.selectStatus.value = orderData.TrangThai

            let html = ''
            let totalAmount = 0

            orderDetail.forEach((detail) => {
                const price = detail.DonGia * detail.SoLuong
                totalAmount += price

                // Thêm 1 trường khuyến mãi
                html += `
                    <tr>
                        <td>${detail.TenSach}</td>
                        <td class="text-end">${detail.SoLuong}</td>
                        <td class="text-end">${this.formatPrice(
                            detail.DonGia
                        )}</td>
                        
                        <td class="text-end"></td>
                        <td class="text-end">${this.formatPrice(price)}</td>
                    </tr>
                `
            })

            this.tableDetails.innerHTML = html
            this.totalPrice.textContent = this.formatPrice(totalAmount)

            // Gắn chi tiết sách vào 1 biến
            this.bookItems = orderDetail
        } catch (error) {
            console.error('Lỗi khi hiển thị chi tiết đơn hàng:', error)
            Swal.fire({
                icon: 'error',
                title: 'Lỗi hiển thị chi tiết đơn hàng!',
                text: error.message,
            })
        }
    }

    showModal(id) {
        const modalInstance = bootstrap.Modal.getInstance(this.modal)
        if (modalInstance) {
            modalInstance.show()
        } else {
            const newInstance = new bootstrap.Modal(this.modal)
            newInstance.show()
        }

        this.initValue(id)
    }

    resetModal() {
        this.currentOrderId = null
        // Có thể thêm logic reset input/label nếu cần
    }
}

class OrderTable extends BaseTable {
    constructor() {
        super({
            apiBaseUrl: '/api/sale/order',
            entityName: 'đơn đặt hàng',
        })
        this.tableWrapper = document.querySelector('#table-view-manager')
        this.paginationWrapper = document.querySelector(
            '#pagination-view-manager'
        )
        this.btnSearch = document.querySelector(
            '.manager-container .btn-search'
        )
        this.searchInput = document.querySelector(
            '.manager-container .search-value'
        )
        this.statusFilter = document.querySelector('#order-status-filter') 
        this.sortableHeaders =
            this.tableWrapper?.querySelectorAll('tr .sortable')

        this.orderModalInstance = null

        // Collect filter values for status
        this.collectFilters = () => ({
            status: this.statusFilter?.value || null,
        })

        // Apply filters from URL
        this.applyFiltersFromUrl = (urlParams) => {
            if (this.statusFilter) {
                const status = urlParams.get('status')
                if (status) this.statusFilter.value = status
            }
        }

        this.loadInitialState()
        this.initEventListeners()
    }

    loadInitialState() {
        const urlParams = new URLSearchParams(window.location.search)

        if (this.searchInput) {
            const keyword = urlParams.get('keyword')
            if (keyword) this.searchInput.value = keyword
        }

        this.applyFiltersFromUrl(urlParams)

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, sort, order, keyword, false, true)
    }

    initEventListeners() {
        if (this.tableWrapper)
            this.tableWrapper.addEventListener('click', (event) => {
                const btnDelete = event.target.closest('.btn-delete-entity')
                const btnDetails = event.target.closest('.btn-show-details')
                const sortableHeader = event.target.closest('tr i.sortable')

                if (btnDelete) {
                    this.deleteEntity(btnDelete)
                } else if (btnDetails) {
                    const id = btnDetails.closest('tr').dataset.id
                    this.orderModalInstance.showModal(id)
                } else if (sortableHeader) {
                    this.sortData(sortableHeader)
                }
            })

        if (this.statusFilter) {
            this.statusFilter.addEventListener(
                'change',
                this.handleSearch.bind(this)
            )
        }

        if (this.paginationWrapper) {
            this.paginationWrapper.addEventListener('click', (e) => {
                e.preventDefault()
                this.handlePageChange(e.target)
            })
        }

        window.addEventListener('popstate', this.handlePopState.bind(this))

        if (this.btnSearch) {
            this.btnSearch.addEventListener('click', this.handleSearch.bind(this))
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') this.btnSearch.click()
            })
            this.searchInput.addEventListener(
                'input',
                this.debounced(() => this.handleSearch(), 1000)
            )
        }
    }

    async deleteEntity(btnDelete) {
        try {
            const result = await Swal.fire({
                title: 'Bạn có chắc muốn tiếp tục xóa?',
                text: 'Bạn sẽ không hoàn tác được sau khi xóa!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Xác nhận',
                cancelButtonText: 'Hủy bỏ',
            })

            if (!result.isConfirmed) return

            const status = btnDelete.closest('tr').dataset.status
            if (status === DANG_GIAO) {
                Swal.fire({
                    icon: 'info',
                    title: 'Không thể xóa đơn hàng!',
                    text: 'Đơn hàng đang được vận chuyển!',
                })
                return
            }

            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const id = btnDelete.closest('tr').dataset.id
            const res = await fetch('/api/sale/order/' + id, {
                method: 'DELETE',
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(
                    data.message ||
                        `Lỗi HTTP ${res.status}: Cập nhật trạng thái thất bại`
                )
            }

            Swal.close()
            Swal.fire({
                title: 'Xóa đơn đặt hàng thành công!',
                icon: 'success',
                draggable: true,
            })

            const page = this.getCurrentPage()
            this.updateView(page)
        } catch (error) {
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Xóa đơn đặt hàng thất bại!',
                text: error.message,
            })
        }
    }

    setOrderModalInstance(instance) {
        this.orderModalInstance = instance
    }

    // updateView, handlePageChange, handlePopState, handleSearch,
    // sortData, updateSortIcon, debounced
    // đều dùng từ BaseTable

    getCurrentPage() {
        const urlParams = new URLSearchParams(window.location.search)
        const page = urlParams.get('page')
        return page
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const orderTable = new OrderTable()
    const orderModal = new OrderModal(orderTable)
    orderTable.setOrderModalInstance(orderModal)
})
