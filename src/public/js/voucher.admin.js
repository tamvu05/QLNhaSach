import showToast from './toast.js'

// Hàm chuyển đổi thời gian sang giờ Việt Nam (UTC+7)
function getCurrentVietNamTime() {
    const vnTime = new Date().toLocaleString('sv-SE', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
    return vnTime
}

// Hàm format thời gian để hiển thị cho người dùng
function formatDateTime(dateInput) {
    if (!dateInput) return ''
    const dateObject = new Date(dateInput)

    // Chuyển sang định dạng YYYY-MM-DDTHH:mm (cần cho input datetime-local)
    const year = dateObject.getFullYear()
    const month = String(dateObject.getMonth() + 1).padStart(2, '0')
    const day = String(dateObject.getDate()).padStart(2, '0')
    const hours = String(dateObject.getHours()).padStart(2, '0')
    const minutes = String(dateObject.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

// --- Class 1: VoucherFormModal (Quản lý Modal Thêm/Sửa) ---
class VoucherFormModal {
    constructor(voucherTableInstance) {
        this.voucherTableInstance = voucherTableInstance

        this.modal = document.querySelector('#voucher-modal')
        this.formAddVoucher = this.modal.querySelector('#voucher-add-form')
        this.headerModal = this.modal.querySelector('#voucher-modal-label')

        this.inputCode = this.modal.querySelector('#voucher-code-input')
        this.selectType = this.modal.querySelector('#voucher-type-select')
        this.inputValue = this.modal.querySelector('#voucher-value-input')
        this.inputCount = this.modal.querySelector('#voucher-count-input')
        this.inputMinTotal = this.modal.querySelector('#voucher-min-total-input')
        this.inputMaxReduce = this.modal.querySelector('#voucher-max-reduce')
        this.inputStartDate = this.modal.querySelector('#voucher-start-date')
        this.inputEndDate = this.modal.querySelector('#voucher-end-date')

        this.type = 'add'
        this.updateId = null
        this.btnSave = this.modal.querySelector('.btn-save-voucher')
        this.contCountUsed = this.modal.querySelector('#voucher-count-used')
        this.contStatus = this.modal.querySelector('#status')

        this.initEventListeners()
    }

    initEventListeners() {
        if (this.formAddVoucher)
            this.formAddVoucher.addEventListener('submit', (e) => {
                e.preventDefault()
                const formData = new FormData(this.formAddVoucher)
                let payload = {}
                for (const [key, value] of formData.entries()) payload[key] = value.trim()

                if (this.type === 'add') this.addNewVoucher(payload)
                else if (this.type === 'update') {
                    this.updateVoucher(this.updateId, payload)
                }
            })

        if (this.modal) this.modal.addEventListener('hidden.bs.modal', this.resetModal.bind(this))
    }

    // --- CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) ---
    async initValueForUpdate(id) {
        this.type = 'update'
        this.updateId = id
        this.headerModal.textContent = 'Chỉnh sửa mã giảm giá'
        this.btnSave.textContent = 'Lưu thay đổi'
        this.inputCode.disabled = true
        this.selectType.disabled = true
        this.inputValue.disabled = true
        this.inputMaxReduce.disabled = true
        this.inputMinTotal.disabled = true
        this.inputStartDate.disabled = true
        this.contCountUsed.classList.remove('d-none')
        this.contStatus.classList.remove('d-none')

        try {
            const res = await fetch(`/api/voucher/${id}`)
            const voucher = await res.json()

            if (!res.ok) {
                throw new Error(voucher.message || `Lỗi HTTP ${res.status}: Không tìm thấy voucher.`)
            }

            this.inputCode.value = voucher.MaVC
            this.inputValue.value = voucher.GiaTriGiam
            this.inputCount.value = voucher.SoLuong
            this.inputMinTotal.value = voucher.DKTongTien
            this.selectType.value = voucher.LoaiVC
            this.inputMaxReduce.value = voucher.SoTienGiamMax
            this.contCountUsed.querySelector('input').value = voucher.SLDaDung
            this.contStatus.querySelector('select').value = voucher.TrangThai
            this.inputStartDate.value = formatDateTime(voucher.NgayBD)
            this.inputEndDate.value = formatDateTime(voucher.NgayKT)
        } catch (error) {
            console.error('Lỗi khi nạp dữ liệu voucher:', error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Tải dữ liệu thất bại!',
                text: error.message,
            })
        }
    }

    removeInitValueForUpdate() {
        this.type = 'add'
        this.updateId = null
        this.headerModal.textContent = 'Tạo mã giảm giá'
        this.btnSave.textContent = 'Tạo mã giảm giá'
        this.inputCode.disabled = false
        this.selectType.disabled = false
        this.inputValue.disabled = false
        this.inputMaxReduce.disabled = false
        this.inputMinTotal.disabled = false
        this.inputStartDate.disabled = false
        this.contCountUsed.classList.add('d-none')
        this.contStatus.classList.add('d-none')
    }

    async addNewVoucher(payload) {
        try {
            const ok = await this.validateForm()
            if (!ok) return

            Swal.fire({
                title: 'Đang tạo mã...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            })

            const res = await fetch('/api/voucher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || `Lỗi HTTP ${res.status}: Thêm voucher thất bại.`)
            }

            Swal.close()
            Swal.fire({
                title: 'Tạo mã giảm giá thành công!',
                icon: 'success',
                draggable: true,
            })

            this.modal.querySelector('.btn-close').click()
            this.voucherTableInstance.updateView(1)
        } catch (error) {
            console.error('Lỗi khi thêm voucher:', error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Tạo mã giảm giá thất bại!',
                text: error.message,
            })
        }
    }

    async updateVoucher(id, payload) {
        try {
            const ok = await this.validateForm()
            if (!ok) return

            Swal.fire({
                title: 'Đang tạo mã...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            })

            const res = await fetch(`/api/voucher/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || `Lỗi HTTP ${res.status}: Cập nhật voucher thất bại.`)
            }

            Swal.close()
            Swal.fire({
                title: 'Chỉnh sửa mã giảm giá thành công!',
                icon: 'success',
                draggable: true,
            })

            this.modal.querySelector('.btn-close').click()
            this.voucherTableInstance.updateView()
        } catch (error) {
            console.error('Lỗi khi cập nhật voucher:', error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Chỉnh sửa mã giảm giá thất bại!',
                text: error.message,
            })
        }
    }

    async validateForm() {
        const startDate = new Date(this.inputStartDate.value.trim())
        const endDate = new Date(this.inputEndDate.value.trim())
        const now = new Date()

        const regex = /^[a-zA-Z0-9]+$/
        if (this.inputCode && !regex.test(this.inputCode.value.trim())) {
            await Swal.fire({
                icon: 'info',
                title: 'Dữ liệu không hợp lệ!',
                text: 'Mã giảm giá không được có kí tự đặc biệt!',
            })
            return false
        }

        if (startDate.getTime() >= endDate.getTime()) {
            await Swal.fire({
                icon: 'info',
                title: 'Dữ liệu không hợp lệ!',
                text: 'Ngày kết thúc phải sau ngày bắt đầu!',
            })
            return false
        }

        if (endDate.getTime() < now.getTime()) {
            await Swal.fire({
                icon: 'info',
                title: 'Dữ liệu không hợp lệ!',
                text: 'Ngày kết thúc đang ở trong quá khứ!',
            })
            return false
        }

        if (this.selectType.value === 'PHAN_TRAM') {
            const value = Number(this.inputValue.value.trim())
            if (value > 100 || value < 0) {
                await Swal.fire({
                    icon: 'info',
                    title: 'Dữ liệu không hợp lệ!',
                    text: 'Phần trăm giảm giá nằm ngoài phạm vi 0 đến 100!',
                })
                return false
            }
        }

        return true
    }

    resetModal() {
        this.removeInitValueForUpdate()
        this.inputCode.value = ''
        this.inputValue.value = ''
        this.inputCount.value = ''
        this.inputMinTotal.value = ''
        this.inputMaxReduce.value = ''
        this.selectType.value = ''
        this.inputStartDate.value = ''
        this.inputEndDate.value = ''
    }

    showModal(id = null) {
        const modalInstance = bootstrap.Modal.getInstance(this.modal) || new bootstrap.Modal(this.modal)

        if (id) {
            this.initValueForUpdate(id)
        } else {
            this.removeInitValueForUpdate()
        }

        modalInstance.show()
    }
}

// --- Class 2: VoucherTable (Quản lý Bảng, Phân trang, Sự kiện) ---
class VoucherTable {
    constructor() {
        this.config = {
            apiBaseUrl: '/api/voucher',
            entityName: 'mã giảm giá',
        }
        this.tableWrapper = document.querySelector('#table-view-manager')
        this.paginationWrapper = document.querySelector('#pagination-view-manager')
        this.btnSearch = document.querySelector('.manager-container .btn-search')
        this.searchInput = document.querySelector('.manager-container .search-value')
        this.sortableHeaders = this.tableWrapper?.querySelectorAll('tr .sortable')
        this.statusFilter = document.querySelector('#order-status-filter')

        this.voucherFormModalInstance = null

        this.loadInitialState()
        this.initEventListeners()
    }

    loadInitialState() {
        const urlParams = new URLSearchParams(window.location.search)

        if (this.searchInput) {
            const keyword = urlParams.get('keyword')
            if (keyword) this.searchInput.value = keyword
        }

        if (this.statusFilter) {
            const status = urlParams.get('status')
            if (status) this.statusFilter.value = status
        }

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')
        const status = urlParams.get('status')

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, sort, order, keyword, status, false, true)
    }

    initEventListeners() {
        if (this.tableWrapper)
            this.tableWrapper.addEventListener('click', (event) => {
                const btnDelete = event.target.closest('.btn-delete-entity')
                const btnUpdate = event.target.closest('.btn-show-modal-update')
                const sortableHeader = event.target.closest('tr i.sortable')

                if (btnUpdate) {
                    const id = btnUpdate.closest('tr').dataset.id
                    this.voucherFormModalInstance.showModal(id)
                } else if (btnDelete) {
                    const id = btnDelete.closest('tr').dataset.id
                    this.deleteEntity(id)
                } else if (sortableHeader) {
                    this.sortData(sortableHeader)
                }
            })

        if (this.paginationWrapper) {
            this.paginationWrapper.addEventListener('click', (e) => {
                e.preventDefault()
                this.handlePageChange(e.target)
            })
        }

        window.addEventListener('popstate', this.handlePopState.bind(this))

        if (this.btnSearch) {
            this.btnSearch.addEventListener('click', this.handleSearchAndSort.bind(this))
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') this.btnSearch.click()
            })
            this.searchInput.addEventListener('input', () => {
                const func = () => {
                    this.handleSearchAndSort()
                }
                const delay = 1000
                const handleDebounced = this.debounced(func, delay)
                handleDebounced()
            })
        }

        if (this.statusFilter) {
            this.statusFilter.addEventListener('change', this.handleSearchAndSort.bind(this))
        }
    }

    setVoucherFormModalInstance(instance) {
        this.voucherFormModalInstance = instance
    }

    async deleteEntity(id) {
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

            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const res = await fetch(`${this.config.apiBaseUrl}/${id}`, {
                method: 'DELETE',
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || `Lỗi HTTP ${res.status}: Xóa voucher thất bại.`)
            }

            Swal.close()
            Swal.fire({
                title: 'Xóa mã giảm giá thành công!',
                icon: 'success',
                draggable: true,
            })

            this.updateView(null)
        } catch (error) {
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Xóa mã giảm giá thất bại!',
                text: error.message,
            })
        }
    }

    async updateView(page = 1, sort, order, keyword, status, shouldPushState = true, shouldReplaceState = false) {
        try {
            if (isNaN(page) || Number(page) < 1) page = 1

            let query = `page=${page}`
            if (sort) query += `&sort=${sort}`
            if (order) query += `&order=${order}`
            if (keyword) query += `&keyword=${keyword}`
            if (status) query += `&status=${status}`

            const res = await fetch(`${this.config.apiBaseUrl}/partials?${query}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || `Lỗi không xác định: ${res.status}`)
            }

            if (this.tableWrapper) this.tableWrapper.innerHTML = data.table
            if (this.paginationWrapper) this.paginationWrapper.innerHTML = data.pagination

            // Cập nhật lại URL trình duyệt
            if (shouldPushState || shouldReplaceState) {
                const currentUrl = new URL(window.location.href)
                currentUrl.search = ''
                currentUrl.searchParams.set('page', page)
                if (sort) currentUrl.searchParams.set('sort', sort)
                if (order) currentUrl.searchParams.set('order', order)
                if (keyword) currentUrl.searchParams.set('keyword', keyword)
                if (status) currentUrl.searchParams.set('status', status) // Thêm status vào URL

                const urlString = currentUrl.toString()
                if (shouldReplaceState) {
                    history.replaceState(null, '', urlString)
                } else {
                    history.pushState(null, '', urlString)
                }
            }
        } catch (error) {
            showToast(error.message, 'danger')
        }
    }

    handleSearchAndSort() {
        const keyword = this.searchInput ? this.searchInput.value.trim() : null
        const status = this.statusFilter ? this.statusFilter.value : null

        const sortableHeader = this.tableWrapper?.querySelector('tr i.sortable[data-order]')
        let sort = null,
            order = null
        if (sortableHeader) {
            sort = sortableHeader.dataset.sort
            order = sortableHeader.dataset.order
        }
        // Luôn quay về trang 1 khi tìm kiếm hoặc lọc
        this.updateView(1, sort, order, keyword, status)
    }

    handlePageChange(targetElement) {
        const pageLink = targetElement.closest('.page-link')
        if (!pageLink) return

        let targetPage = pageLink.dataset.page
        if (!targetPage) return

        const urlParams = new URLSearchParams(window.location.search)
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        this.updateView(Number(targetPage), sort, order, keyword)
    }

    handlePopState() {
        const urlParams = new URLSearchParams(window.location.search)

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, sort, order, keyword, false)
    }

    sortData(currentHeader) {
        if (!this.sortableHeaders) return

        this.sortableHeaders.forEach((h) => {
            if (h !== currentHeader) {
                h.removeAttribute('data-order')
            }
        })

        let currentOrder = currentHeader.getAttribute('data-order')
        let newOrder = currentOrder === 'asc' ? 'desc' : currentOrder === 'desc' ? 'asc' : 'desc'

        currentHeader.setAttribute('data-order', newOrder)

        const currentPage = this.tableWrapper.querySelector('#data-attribute').dataset.currentPage
        const sort = currentHeader.dataset.sort

        const inputSearch = document.querySelector('.manager-container .search-value')
        let keyword = inputSearch ? inputSearch.value.trim() : null

        this.updateView(currentPage, sort, newOrder, keyword)
    }

    updateSortIcon(sortKey, sortOrder) {
        const sortableHeaders = this.tableWrapper?.querySelectorAll('tr i.sortable')
        if (!sortableHeaders) return

        sortableHeaders.forEach((h) => {
            if (h.dataset.sort === sortKey) {
                h.setAttribute('data-order', sortOrder)
                return
            }
        })
    }

    debounced(func, delay) {
        let timerID
        return function () {
            clearTimeout(timerID)
            timerID = setTimeout(() => {
                func.apply(this, arguments)
            }, delay)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const voucherTable = new VoucherTable()
    const voucherFormModal = new VoucherFormModal(voucherTable)
    voucherTable.setVoucherFormModalInstance(voucherFormModal)
})
