import showToast from './toast.js'

// --- Class 1: SupplierFormModal (Quản lý Modal Thêm/Sửa) ---
class SupplierFormModal {
    constructor(supplierTableInstance) {
        this.supplierTableInstance = supplierTableInstance
        this.modal = document.querySelector('#add-supplier-modal') // ID modal
        this.inputName = document.querySelector('#entity-name-input') // Tên NCC
        this.inputAddress = document.querySelector('#entity-addresss-input') // Địa chỉ
        this.inputPhone = document.querySelector('#entity-phone-input') // SĐT
        this.btnSave = document.querySelector(
            '#add-supplier-modal .btn-save-entity'
        )
        this.headerModal = document.querySelector('#add-supplier-modal-label')

        this.type = 'add'
        this.updateId = null

        this.initEventListener()
    }

    initEventListener() {
        // Thêm/Chỉnh sửa nhà cung cấp
        if (this.btnSave) {
            this.btnSave.addEventListener('click', () => {
                if (this.type === 'add') this.addNewSupplier()
                else this.updateSupplier(this.updateId)
            })
        }

        // Đóng modal
        if (this.modal) {
            this.modal.addEventListener(
                'hidden.bs.modal',
                this.hideModalAdd.bind(this)
            )
        }
    }

    // Hiển thị modal và nạp dữ liệu khi chỉnh sửa
    async initValueForUpdate(id) {
        this.type = 'update'
        this.headerModal.textContent = 'Chỉnh sửa thông tin nhà cung cấp'
        this.updateId = id

        try {
            const res = await fetch('/api/supplier/' + id)
            const supplier = await res.json()

            if (!res.ok) {
                const errorMessage =
                    supplier.message ||
                    supplier.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            // Gán giá trị vào form
            this.inputName.value = supplier.TenNCC
            this.inputAddress.value = supplier.DiaChi
            this.inputPhone.value = supplier.SDT
        } catch (error) {
            console.error('Lỗi khi nạp dữ liệu nhà cung cấp:', error)
            showToast(error.message, 'danger')
        }
    }

    // Xóa giá trị cũ khi đóng modal
    removeInitValueForUpdate() {
        this.type = 'add'
        this.headerModal.textContent = 'Thêm nhà cung cấp'
        this.updateId = null
    }

    // Logic thêm nhà cung cấp mới
    async addNewSupplier() {
        try {
            if (!this.validateForm()) return

            const payload = {
                TenNCC: this.inputName.value.trim(),
                DiaChi: this.inputAddress.value.trim(),
                SDT: this.inputPhone.value.trim(),
            }

            const res = await fetch('/api/supplier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            showToast('Đã thêm nhà cung cấp', 'success')
            this.modal.querySelector('.btn-close').click()

            // Cập nhật lại trang 1
            this.supplierTableInstance.updateView(1)
        } catch (error) {
            console.error('Lỗi khi thêm nhà cung cấp:', error)
            showToast(error.message, 'danger')
        }
    }

    // Logic cập nhật nhà cung cấp
    async updateSupplier(id) {
        try {
            if (!this.validateForm()) return

            const payload = {
                TenNCC: this.inputName.value.trim(),
                DiaChi: this.inputAddress.value.trim(),
                SDT: this.inputPhone.value.trim(),
            }

            const res = await fetch('/api/supplier/' + id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            showToast('Đã cập nhật nhà cung cấp', 'success')
            this.modal.querySelector('.btn-close').click()

            // Cập nhật lại trang hiện tại sau khi sửa
            const urlParams = new URLSearchParams(window.location.search)
            const page = urlParams.get('page')

            this.supplierTableInstance.updateView(page)
        } catch (error) {
            console.error('Lỗi khi cập nhật nhà cung cấp:', error)
            showToast(error.message, 'danger')
        }
    }

    // Validation Form
    validateForm() {
        const requiredFields = [
            { element: this.inputName, classInvalid: 'empty-name' },
            { element: this.inputAddress, classInvalid: 'empty-address' },
            { element: this.inputPhone, classInvalid: 'empty-phone' },
        ]

        let hasError = false

        for (const field of requiredFields) {
            const errorElement = this.modal.querySelector(
                `.${field.classInvalid}`
            )

            if (!field.element || !field.element.value.trim()) {
                errorElement.classList.remove('d-none')

                field.element?.focus()
                hasError = true
                break 
            } else {
                errorElement.classList.add('d-none')
            }
        }

        if (!hasError) {
            const phoneValue = this.inputPhone.value.trim()
            const phoneRegex = /^(0|\+84)(9\d|8\d|7\d|5\d|3\d)\d{7}$/
            const invalidPhoneElement =
                this.modal.querySelector('.invalid-phone')

            if (!phoneRegex.test(phoneValue)) {
                invalidPhoneElement.classList.remove('d-none')
                this.inputPhone.focus() 
                hasError = true
            } else {
                invalidPhoneElement.classList.add('d-none')
            }
        }

        return !hasError
    }

    // Reset form khi đóng modal
    hideModalAdd() {
        this.removeInitValueForUpdate()

        const fieldsToReset = [
            this.inputName,
            this.inputAddress,
            this.inputPhone,
        ]

        fieldsToReset.forEach((field) => {
            field.value = ''
        })

        this.modal.querySelectorAll('.value-error').forEach((errorEl) => {
            errorEl.classList.add('d-none')
        })
    }

    showModal(id) {
        const modalInstance = bootstrap.Modal.getInstance(this.modal)
        if (modalInstance) {
            modalInstance.show()
        } else {
            const newInstance = new bootstrap.Modal(this.modal)
            newInstance.show()
        }

        if (id) {
            this.initValueForUpdate(id)
        } else {
            // Đặt lại tiêu đề khi mở modal thêm mới
            this.removeInitValueForUpdate()
        }
    }
}

// --- Class 2: SupplierTable (Quản lý Bảng, Phân trang, Sự kiện) ---
class SupplierTable {
    constructor() {
        this.config = {
            apiBaseUrl: '/api/supplier',
            entityName: 'nhà cung cấp',
        }
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
        this.sortableHeaders =
            this.tableWrapper.querySelectorAll('tr .sortable')
        this.supplierFormModalInstance = null

        // Mặc dù không cần Export cho Supplier, giữ lại cấu trúc nếu cần
        this.btnExport = document.querySelector(
            '.manager-container .export-button'
        )

        this.loadInitialState()
        this.initEventListener()
    }

    loadInitialState() {
        const urlParams = new URLSearchParams(window.location.search)

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        // Điền keyword vào ô tìm kiếm
        if (this.searchInput && keyword) {
            this.searchInput.value = keyword
        }

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, sort, order, keyword, false, true)
    }

    initEventListener() {
        if (this.tableWrapper)
            this.tableWrapper.addEventListener('click', (event) => {
                const btnDelete = event.target.closest('.btn-delete-entity')
                const btnUpdate = event.target.closest('.btn-show-modal-update')
                const sortableHeader = event.target.closest('tr .sortable')

                // Xóa
                if (btnDelete) this.deleteEntity(btnDelete)
                // Chỉnh sửa
                else if (btnUpdate) {
                    const id = btnUpdate.closest('tr').dataset.id
                    this.supplierFormModalInstance.showModal(id)
                }
                // Sắp xếp
                else if (sortableHeader) this.sortData(sortableHeader)
            })

        // Phân trang (Sử dụng Event Delegation trên container)
        if (this.paginationWrapper) {
            this.paginationWrapper.addEventListener('click', (e) => {
                e.preventDefault()
                this.handlePageChange(e.target)
            })
        }

        // back/forward trình duyệt
        window.addEventListener('popstate', this.handlePopState.bind(this))

        // search
        if (this.btnSearch) {
            this.btnSearch.addEventListener(
                'click',
                this.handleSearch.bind(this)
            )
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') this.btnSearch.click()
            })

            this.searchInput.addEventListener('input', () => {
                const func = () => {
                    this.handleSearch()
                }
                const delay = 1000
                const handleDebounced = this.debounced(func, delay)
                handleDebounced()
            })
        }

        // Export (Nếu có)
        if (this.btnExport) {
            this.btnExport.addEventListener(
                'click',
                this.exportExcel.bind(this)
            )
        }
    }

    setSupplierFormModalInstance(instance) {
        this.supplierFormModalInstance = instance
    }

    // Logic xử lý khi click vào nút phân trang
    handlePageChange(targetElement) {
        const pageLink = targetElement.closest('.page-link')
        if (!pageLink) return

        let targetPage = pageLink.dataset.page
        if (!targetPage) return // Bỏ qua nếu không có data-page

        // Lấy các tham số hiện tại từ URL để giữ lại trạng thái tìm kiếm/sắp xếp
        const urlParams = new URLSearchParams(window.location.search)
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        this.updateView(Number(targetPage), sort, order, keyword)
    }

    async updateView(
        page = 1,
        sort,
        order,
        keyword,
        shouldPushState = true,
        shouldReplaceState = false
    ) {
        try {
            if (isNaN(page) || Number(page) < 1) page = 1

            let query = `page=${page}`
            if (sort) query += `&sort=${sort}`
            if (order) query += `&order=${order}`
            if (keyword) query += `&keyword=${keyword}`

            const res = await fetch(
                `${this.config.apiBaseUrl}/partials?${query}`
            )
            const data = await res.json()

            if (!res.ok) {
                throw new Error(
                    data.message || `Lỗi không xác định: ${res.status}`
                )
            }

            if (this.tableWrapper) this.tableWrapper.innerHTML = data.table
            if (this.paginationWrapper)
                this.paginationWrapper.innerHTML = data.pagination

            this.updateSortIcon(sort, order)

            // Cập nhật lại URL trình duyệt
            if (shouldPushState || shouldReplaceState) {
                const currentUrl = new URL(window.location.href)
                currentUrl.search = ''
                currentUrl.searchParams.set('page', page)
                if (sort) currentUrl.searchParams.set('sort', sort)
                if (order) currentUrl.searchParams.set('order', order)
                if (keyword) currentUrl.searchParams.set('keyword', keyword)

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

    async deleteEntity(btnDelete) {
        const rowElement = btnDelete.closest('tr')
        const entityId = rowElement.dataset.id

        if (!entityId) return

        try {
            const res = await fetch(`${this.config.apiBaseUrl}/${entityId}`, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (!res.ok)
                throw new Error(
                    data.message ||
                        data.error ||
                        `Lỗi HTTP ${res.status}: Thao tác xóa thất bại.`
                )

            const dataAttributeElement =
                this.tableWrapper.querySelector('#data-attribute')
            let targetPage = dataAttributeElement.dataset.currentPage

            // Kiểm tra nếu xóa item cuối cùng của trang, quay lại trang trước
            if (dataAttributeElement.dataset.totalItemPerPage < 2)
                targetPage -= 1

            this.updateView(targetPage)
            showToast(`Đã xóa ${this.config.entityName}`, 'success')
        } catch (error) {
            showToast(error.message, 'danger')
        }
    }

    sortData(currentHeader) {
        // ... (Logic sắp xếp tương tự BookTable)
        this.sortableHeaders.forEach((h) => {
            if (h !== currentHeader) {
                h.removeAttribute('data-order')
            }
        })

        let currentOrder = currentHeader.getAttribute('data-order')
        let newOrder =
            currentOrder === 'asc'
                ? 'desc'
                : currentOrder === 'desc'
                ? 'asc'
                : 'desc'

        currentHeader.setAttribute('data-order', newOrder)

        const currentPage =
            this.tableWrapper.querySelector('#data-attribute').dataset
                .currentPage
        const sort = currentHeader.dataset.sort

        const inputSearch = document.querySelector(
            '.manager-container .search-value'
        )
        let keyword = inputSearch ? inputSearch.value.trim() : null

        this.updateView(currentPage, sort, newOrder, keyword)
    }

    updateSortIcon(sortKey, sortOrder) {
        // ... (Logic cập nhật icon sắp xếp tương tự BookTable)
        const sortableHeaders =
            this.tableWrapper.querySelectorAll('tr i.sortable')
        sortableHeaders.forEach((h) => {
            if (h.dataset.sort === sortKey) {
                h.setAttribute('data-order', sortOrder)
                return
            }
        })
    }

    handlePopState() {
        // ... (Logic xử lý back/forward tương tự BookTable)
        const urlParams = new URLSearchParams(window.location.search)

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, sort, order, keyword, false)
    }

    handleSearch() {
        // ... (Logic tìm kiếm tương tự BookTable)
        const keyword = document
            .querySelector('.manager-container .search-value')
            .value.trim()

        const sortableHeader = this.tableWrapper.querySelector(
            'tr i.sortable[data-order]'
        )

        let sort = null,
            order = null
        if (sortableHeader) {
            sort = sortableHeader.dataset.sort
            order = sortableHeader.dataset.order
        }
        this.updateView(1, sort, order, keyword)
    }

    debounced(func, delay) {
        // ... (Logic debounced tương tự BookTable)
        let timerID
        return function () {
            clearTimeout(timerID)
            timerID = setTimeout(() => {
                func.apply(this, arguments)
            }, delay)
        }
    }

    async exportExcel() {
        // ... (Logic export Excel tương tự BookTable, cần thay đổi endpoint)
        try {
            const res = await fetch(`${this.config.apiBaseUrl}/export`)
            if (!res.ok)
                throw new Error(`Lỗi HTTP ${res.status}: Không thể tải file.`)

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url

            const disposition = res.headers.get('content-disposition')
            let filename = 'DanhMucNhaCungCap.xlsx'
            if (disposition && disposition.indexOf('filename=') !== -1) {
                filename = disposition.split('filename=')[1].replace(/"/g, '')
            }
            a.download = filename

            document.body.appendChild(a)
            a.click()

            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            showToast(error, 'danger')
        }
    }
}

// --- Khởi tạo ---
document.addEventListener('DOMContentLoaded', () => {
    const supplierTable = new SupplierTable()
    const supplierFormModal = new SupplierFormModal(supplierTable)
    supplierTable.setSupplierFormModalInstance(supplierFormModal)
})
