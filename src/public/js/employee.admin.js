import showToast from './toast.js'

function formatDate(dateInput) {
    if (!dateInput) return ''
    const dateObject = new Date(dateInput)

    const year = dateObject.getFullYear()
    const month = String(dateObject.getMonth() + 1).padStart(2, '0')
    const day = String(dateObject.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function isValidVietnamesePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        return false
    }

    const phoneRegex = /^(0|\+84)(9\d|8\d|7\d|5\d|3\d)\d{7}$/

    return phoneRegex.test(phoneNumber.trim())
}


class EmployeeFormModal {
    constructor(employeeTableInstance) {
        this.employeeTableInstance = employeeTableInstance

        // Modal, Form, và Header
        this.modal = document.querySelector('#employee-modal')
        // ID form từ modalEmployee.ejs
        this.formEmployee = this.modal.querySelector('#voucher-add-form')
        this.headerModal = this.modal.querySelector('#employee-modal-label')

        // Các Input của Nhân Viên (dựa trên modalEmployee.ejs)
        this.inputName = this.modal.querySelector('#name-input') // name="HoTen" 
        this.inputBirthday = this.modal.querySelector('#birthday-input') // name="NgaySinh" 
        this.inputDayOfWork = this.modal.querySelector('#day-of-work-input') // name="NgayVaoLam" 
        this.inputPhone = this.modal.querySelector('#phone-input') // name="SDT" 
        this.inputEmail = this.modal.querySelector('#email-input') // name="Email" 
        this.inputPassword = this.modal.querySelector('#password-input') // name="MatKhau" 

        this.type = 'add'
        this.updateId = null
        this.stateSelect = this.modal.querySelector('#state-select')
        this.contStateSelect = this.modal.querySelector('#cont-state-select')
        this.btnSave = this.modal.querySelector('.btn-save-voucher') // Nút Lưu
        
        this.btnSave.textContent = 'Thêm nhân viên mới' 
        
        this.initEventListeners()
    }

    initEventListeners() {
        if (this.formEmployee)
            this.formEmployee.addEventListener('submit', (e) => {
                e.preventDefault()
                const formData = new FormData(this.formEmployee)
                let payload = {}
                for (const [key, value] of formData.entries()) payload[key] = value.trim()

                // Logic: Nếu đang ở chế độ UPDATE và không đổi mật khẩu, không gửi trường MatKhau rỗng
                if (this.type === 'update' && !payload.MatKhau) {
                    delete payload.MatKhau
                }

                if (this.type === 'add') this.addNewEmployee(payload)
                else if (this.type === 'update') {
                    this.updateEmployee(this.updateId, payload)
                }
            })

        if (this.modal) this.modal.addEventListener('hidden.bs.modal', this.resetModal.bind(this))
    }

    // --- CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) ---
    async initValueForUpdate(id) {
        this.type = 'update'
        this.updateId = id
        this.headerModal.textContent = 'Chỉnh sửa thông tin nhân viên' 
        this.btnSave.textContent = 'Lưu thay đổi'
        this.inputEmail.disabled = true // Không cho phép đổi Email đăng nhập
        this.inputPassword.placeholder = 'Để trống nếu không muốn đổi mật khẩu'
        this.contStateSelect.classList.remove('d-none')
        this.inputPassword.removeAttribute('required')

        try {
            // Fetch API cho Nhân Viên (Giả định endpoint là /api/employee/:id)
            const res = await fetch(`/api/employee/${id}`)
            const employee = await res.json()

            if (!res.ok) {
                throw new Error(employee.message || `Lỗi HTTP ${res.status}: Không tìm thấy nhân viên.`)
            }

            this.inputName.value = employee.TenNV // Tên nhân viên 
            this.inputPhone.value = employee.SDT // SĐT 
            this.inputEmail.value = employee.Email // Email 
            this.inputBirthday.value = formatDate(employee.NgaySinh) // Ngày sinh 
            this.inputDayOfWork.value = formatDate(employee.NgayVaoLam) // Ngày vào làm 
            this.inputPassword.value = '' // Luôn để trống Mật khẩu khi sửa
            this.stateSelect.value = employee.TrangThai
        } catch (error) {
            console.error('Lỗi khi nạp dữ liệu nhân viên:', error)
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
        this.headerModal.textContent = 'Thêm nhân viên mới' 
        this.btnSave.textContent = 'Thêm nhân viên mới' 
        this.inputEmail.disabled = false
        this.inputPassword.placeholder = ''
        this.stateSelect.value = ''
        this.contStateSelect.classList.add('d-none')
        this.inputPassword.setAttribute('required', true)
    }

    async addNewEmployee(payload) {
        try {
            const ok = this.validateForm(payload)
            if (!ok) return

            Swal.fire({
                title: 'Đang thêm nhân viên...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            })

            const res = await fetch('/api/employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || `Lỗi HTTP ${res.status}: Thêm nhân viên thất bại.`)
            }

            Swal.close()
            Swal.fire({
                title: 'Thêm nhân viên thành công!',
                icon: 'success',
                draggable: true,
            })

            this.modal.querySelector('.btn-close').click()
            this.employeeTableInstance.updateView(1)
        } catch (error) {
            console.error('Lỗi khi thêm nhân viên:', error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Thêm nhân viên thất bại!',
                text: error.message,
            })
        }
    }

    async updateEmployee(id, payload) {
        try {
            const ok = this.validateForm(payload)
            if (!ok) return

            Swal.fire({
                title: 'Đang cập nhật...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            })

            const res = await fetch(`/api/employee/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || `Lỗi HTTP ${res.status}: Cập nhật nhân viên thất bại.`)
            }

            Swal.close()
            Swal.fire({
                title: 'Chỉnh sửa nhân viên thành công!',
                icon: 'success',
                draggable: true,
            })

            this.modal.querySelector('.btn-close').click()
            this.employeeTableInstance.updateView()
        } catch (error) {
            console.error('Lỗi khi cập nhật nhân viên:', error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Chỉnh sửa nhân viên thất bại!',
                text: error.message,
            })
        }
    }

    validateForm(payload) {
        const birthday = new Date(payload.NgaySinh)
        const dayOfWork = new Date(payload.NgayVaoLam)
        const now = new Date()

        if (birthday.getTime() >= now.getTime()) {
            Swal.fire({
                icon: 'info',
                title: 'Dữ liệu không hợp lệ!',
                text: 'Ngày sinh không thể lớn hơn hoặc bằng ngày hiện tại!',
            })
            return false
        }

        if(!isValidVietnamesePhoneNumber(payload.SDT)) {
            Swal.fire({
                icon: 'info',
                title: 'Dữ liệu không hợp lệ!',
                text: 'Số điện thoại không hợp lệ!',
            })
            return false
        }

        return true
    }

    resetModal() {
        this.removeInitValueForUpdate()
        this.formEmployee.reset() // Dùng hàm reset mặc định của form để reset tất cả input
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

// --- Class 2: EmployeeTable (Quản lý Bảng, Phân trang, Sự kiện) ---
class EmployeeTable {
    constructor() {
        this.config = {
            apiBaseUrl: '/api/employee',
            entityName: 'nhân viên',
        }
        this.tableWrapper = document.querySelector('#table-view-manager')
        this.paginationWrapper = document.querySelector('#pagination-view-manager')
        this.btnSearch = document.querySelector('.manager-container .btn-search')
        this.searchInput = document.querySelector('.manager-container .search-value')
        this.statusFilter = document.querySelector('#status-filter') 

        this.employeeFormModalInstance = null

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
        const keyword = urlParams.get('keyword')
        const status = urlParams.get('status')

        const currentPage = page ? Number(page) : 1

        // Bảng Employee không có sort/order theo tableEmployee.ejs
        this.updateView(currentPage, null, null, keyword, status, false, true) 
    }

    initEventListeners() {
        if (this.tableWrapper)
            this.tableWrapper.addEventListener('click', (event) => {
                const btnDelete = event.target.closest('.btn-delete-entity') 
                const btnUpdate = event.target.closest('.btn-show-modal-update') 
                // const sortableHeader = event.target.closest('tr i.sortable') // Không có sorting

                if (btnUpdate) {
                    const id = btnUpdate.closest('tr').dataset.id // data-id="<%= employee.MaNV %>" 
                    this.employeeFormModalInstance.showModal(id)
                } else if (btnDelete) {
                    const id = btnDelete.closest('tr').dataset.id
                    this.deleteEntity(id)
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

    setEmployeeFormModalInstance(instance) {
        this.employeeFormModalInstance = instance
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
                throw new Error(data.message || `Lỗi HTTP ${res.status}: Xóa ${this.config.entityName} thất bại.`)
            }

            Swal.close()
            Swal.fire({
                title: `Xóa ${this.config.entityName} thành công!`,
                icon: 'success',
                draggable: true,
            })

            this.updateView(null)
        } catch (error) {
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: `Xóa ${this.config.entityName} thất bại!`,
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
    const employeeTable = new EmployeeTable()
    const employeeFormModal = new EmployeeFormModal(employeeTable)
    employeeTable.setEmployeeFormModalInstance(employeeFormModal)
})