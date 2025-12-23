import BaseTable from './base.table.js'
import helpers from './helpers.js'

class ImportReceiptFormModal {
    constructor(importReceiptTableInstance) {
        this.importReceiptTableInstance = importReceiptTableInstance

        // Modal và Buttons
        this.modal = document.querySelector('#add-importReceipt-modal')
        this.btnSave = document.querySelector('.btn-save-receipt')
        this.btnAddItem = document.querySelector('.btn-add-item')

        // Các trường Form chính
        this.selectSupplier = document.querySelector('#supplier-select')
        this.selectEmployee = document.querySelector('#employee-select')
        this.inputDate = document.querySelector('#receipt-date-input')
        this.textareaNotes = document.querySelector('#receipt-notes-textarea')

        // Khu vực thêm chi tiết (Inputs)
        this.selectBookItem = document.querySelector('#book-select-item')
        this.inputQuantity = document.querySelector('#input-quantity')
        this.inputUnitPrice = document.querySelector('#input-unit-price')

        // Bảng chi tiết (Outputs)
        this.itemsBody = document.querySelector('#receipt-items-body')
        this.totalAmountDisplay = document.querySelector(
            '#receipt-total-amount'
        )

        // Danh sách các mặt hàng đã chọn (để quản lý trùng lặp và xóa)
        this.selectedItems = new Map() // Key: MaSach, Value: Object ChiTiet

        this.initCurrentVNTime()
        this.initEventListeners()
        this.initSelect2()
        this.renderTotalAmount()
    }

    initSelect2() {
        const select2Config = {
            placeholder: 'Chọn...',
            allowClear: true,
            width: '100%',
            dropdownParent: $(this.modal),
        }

        $('#supplier-select').select2(select2Config)

        $('#book-select-item').select2({
            ...select2Config,
            placeholder: 'Chọn sách',
        })
    }

    initEventListeners() {
        // Sự kiện Lưu Phiếu Nhập
        if (this.btnSave) {
            this.btnSave.addEventListener(
                'click',
                this.createReceipt.bind(this)
            )
        }

        // Sự kiện Thêm Chi tiết Sách
        if (this.btnAddItem) {
            this.btnAddItem.addEventListener(
                'click',
                this.addItemDetail.bind(this)
            )
        }

        // Sự kiện Xóa Chi tiết hoặc thay đổi SL/Đơn giá trong bảng
        if (this.itemsBody) {
            this.itemsBody.addEventListener(
                'click',
                this.handleItemAction.bind(this)
            )
            this.itemsBody.addEventListener(
                'input',
                this.handleItemInput.bind(this)
            )
        }

        // Đóng modal
        if (this.modal) {
            this.modal.addEventListener(
                'hidden.bs.modal',
                this.resetModal.bind(this)
            )
        }
    }

    initCurrentVNTime() {
        this.inputDate.setAttribute('value', helpers.getCurTime7())
    }

    // --- LOGIC THAO TÁC CHI TIẾT SÁCH ---

    handleItemAction(event) {
        const btnDelete = event.target.closest('.btn-remove-item')
        if (btnDelete) {
            const itemId = btnDelete.dataset.id
            this.removeItemDetail(itemId)
        }
    }

    handleItemInput(event) {
        const inputElement = event.target.closest('input[data-field]')
        if (!inputElement) return

        const itemId = inputElement.closest('tr').dataset.id
        const field = inputElement.dataset.field
        let value = Number(inputElement.value)

        if (itemId && this.selectedItems.has(itemId)) {
            const item = this.selectedItems.get(itemId)

            if (field === 'quantity') {
                value = Math.max(1, value) // SL tối thiểu là 1
                inputElement.value = value
                item.SoLuong = value
            } else if (field === 'price') {
                value = Math.max(0, value) // Đơn giá tối thiểu là 0
                inputElement.value = value
                item.DonGia = value
            }

            this.selectedItems.set(itemId, item)
            this.renderTotalAmount()
        }
    }

    addItemDetail() {
        const bookId = this.selectBookItem.value
        const bookName =
            this.selectBookItem.options[this.selectBookItem.selectedIndex]?.text
        let quantity = Number(this.inputQuantity.value)
        let unitPrice = Number(this.inputUnitPrice.value)

        if (!bookId || quantity <= 0 || unitPrice < 0) {
            this.modal
                .querySelector('.item-input-error')
                .classList.remove('d-none')
            return
        }
        this.modal.querySelector('.item-input-error').classList.add('d-none')

        if (this.selectedItems.has(bookId)) {
            Swal.fire({
                icon: 'warning',
                title: 'Sách đã tồn tại!',
                text: 'Sách này đã được thêm. Vui lòng chỉnh sửa số lượng trong bảng.',
            })
            return
        }

        const newItem = {
            MaSach: bookId,
            TenSach: bookName.split(' (ISBN:')[0].trim(),
            SoLuong: quantity,
            DonGia: unitPrice,
        }
        this.selectedItems.set(bookId, newItem)

        // Reset khu vực thêm chi tiết
        $(this.selectBookItem).val(null).trigger('change')
        this.inputQuantity.value = 1
        this.inputUnitPrice.value = 0

        this.renderItemsTable()
        this.renderTotalAmount()
    }

    removeItemDetail(itemId) {
        this.selectedItems.delete(itemId)
        this.renderItemsTable()
        this.renderTotalAmount()
    }

    renderItemsTable() {
        this.itemsBody.innerHTML = ''
        if (this.selectedItems.size === 0) {
            this.itemsBody.innerHTML =
                '<tr><td colspan="4" class="text-center text-muted">Chưa có mặt hàng nào được thêm.</td></tr>'
            this.modal.querySelector('.items-error').classList.remove('d-none')
            return
        }

        this.modal.querySelector('.items-error').classList.add('d-none')

        this.selectedItems.forEach((item) => {
            const row = document.createElement('tr')
            row.dataset.id = item.MaSach
            row.innerHTML = `
                <td>${item.TenSach}</td>
                <td><input type="number" class="form-control form-control-sm text-end" value="${item.SoLuong}" min="1" data-field="quantity" data-id="${item.MaSach}"></td>
                <td><input type="number" class="form-control form-control-sm text-end" value="${item.DonGia}" min="0" step="1000" data-field="price" data-id="${item.MaSach}"></td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-danger btn-remove-item" data-id="${item.MaSach}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `
            this.itemsBody.appendChild(row)
        })
    }

    renderTotalAmount() {
        let total = 0
        this.selectedItems.forEach((item) => {
            total += item.SoLuong * item.DonGia
        })

        const formatter = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        })
        this.totalAmountDisplay.textContent = formatter.format(total)
    }

    // --- LOGIC GỬI DỮ LIỆU VÀ VALIDATION FORM CHÍNH ---

    async createReceipt() {
        try {
            if (!this.validateForm()) return

            const ChiTietPN = Array.from(this.selectedItems.values()).map(
                (item) => ({
                    MaSach: item.MaSach,
                    SoLuong: item.SoLuong,
                    DonGia: item.DonGia,
                })
            )

            const payload = {
                MaNCC: this.selectSupplier.value,
                // MaNV: '1',
                NgayNhap: this.inputDate.value,
                NoiDung: this.textareaNotes.value.trim(),
                ChiTietPN: ChiTietPN,
            }

            const res = await fetch('/api/import-receipt', {
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

            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã tạo phiếu nhập hàng',
            })
            this.modal.querySelector('.btn-close').click()

            this.importReceiptTableInstance.updateView(1)
        } catch (error) {
            console.error('Lỗi khi tạo phiếu nhập:', error)
            Swal.fire({
                icon: 'error',
                title: 'Tạo phiếu nhập hàng thất bại!',
                text: error.message,
            })
        }
    }

    validateForm() {
        const requiredSelectors = [
            {
                element: this.selectSupplier,
                errorClass: 'empty-supplier',
                message: 'Vui lòng chọn nhà cung cấp!',
            },
            {
                element: this.inputDate,
                errorClass: 'empty-date',
                message: 'Vui lòng chọn ngày nhập!',
            },
        ]

        let hasError = false

        //Kiểm tra trường bắt buộc
        for (const field of requiredSelectors) {
            const errorElement = this.modal.querySelector(
                `.${field.errorClass}`
            )
            const value = field.element.value || $(field.element).val()

            if (!value || value === '' || value === null) {
                errorElement.classList.remove('d-none')
                hasError = true
            } else {
                errorElement.classList.add('d-none')
            }
        }

        //Kiểm tra Chi tiết Phiếu (Items)
        const itemsErrorEl = this.modal.querySelector('.items-error')
        if (this.selectedItems.size === 0) {
            itemsErrorEl.classList.remove('d-none')
            hasError = true
        } else {
            itemsErrorEl.classList.add('d-none')
        }

        // Kiểm tra tính hợp lệ của SL/Đơn giá trong bảng
        if (!hasError && this.selectedItems.size > 0) {
            const invalidAmountErrorEl = this.modal.querySelector(
                '.invalid-item-amount'
            )
            let isValid = true
            this.selectedItems.forEach((item) => {
                if (
                    item.SoLuong <= 0 ||
                    item.DonGia < 0 ||
                    isNaN(item.SoLuong) ||
                    isNaN(item.DonGia)
                ) {
                    isValid = false
                }
            })

            if (!isValid) {
                invalidAmountErrorEl.classList.remove('d-none')
                hasError = true
            } else {
                invalidAmountErrorEl.classList.add('d-none')
            }
        }

        return !hasError
    }

    resetModal() {
        // Reset form inputs
        this.inputDate.value = helpers.getCurTime7()
        this.textareaNotes.value = ''
        this.inputQuantity.value = 1
        this.inputUnitPrice.value = 0

        // Reset Select2 fields
        $(this.selectSupplier).val(null).trigger('change')
        $(this.selectEmployee).val(null).trigger('change')
        $(this.selectBookItem).val(null).trigger('change')

        // Reset items
        this.selectedItems.clear()
        this.renderItemsTable()
        this.renderTotalAmount()

        // Ẩn tất cả thông báo lỗi
        this.modal.querySelectorAll('.value-error').forEach((errorEl) => {
            errorEl.classList.add('d-none')
        })
    }
}

class ImportReceiptTable extends BaseTable {
    constructor() {
        super({
            apiBaseUrl: '/api/import-receipt',
            entityName: 'phiếu nhập hàng',
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
        // Dùng optional chaining cho tableWrapper nếu nó không tồn tại ngay
        this.sortableHeaders =
            this.tableWrapper?.querySelectorAll('tr .sortable')

        this.importDetailModalInstance = null

        // No filters
        this.collectFilters = () => ({})
        this.applyFiltersFromUrl = () => {}

        this.loadInitialState()
        this.initEventListener()
    }

    loadInitialState() {
        this.searchInput.setAttribute(
            'placeholder',
            'Tìm kiếm theo tên nhà cung cấp'
        )
        const urlParams = new URLSearchParams(window.location.search)

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        if (this.searchInput && keyword) {
            this.searchInput.value = keyword
        }

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, sort, order, keyword, false, true)
    }

    initEventListener() {
        if (this.tableWrapper)
            this.tableWrapper.addEventListener('click', (event) => {
                const btnDetails = event.target.closest('.btn-show-details')
                const btnCancel = event.target.closest('.btn-cancel-receipt')
                const sortableHeader = event.target.closest('tr i.sortable')

                // Xem Chi tiết
                if (btnDetails) {
                    const id = btnDetails.closest('tr').dataset.id
                    this.importDetailModalInstance.showModal(id)
                }
                // Hủy phiếu
                else if (btnCancel) {
                    this.cancelReceipt(btnCancel)
                }
                // Sắp xếp
                else if (sortableHeader) this.sortData(sortableHeader)
            })

        // Phân trang
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

            this.searchInput.addEventListener(
                'input',
                this.debounced(() => this.handleSearch(), 1000)
            )
        }
    }

    setImportDetailModalInstance(instance) {
        this.importDetailModalInstance = instance
    }

    async cancelReceipt(btnCancel) {
        const rowElement = btnCancel.closest('tr')
        const receiptId = rowElement.dataset.id

        if (!receiptId) return

        const confirmed = await this.confirm({
            title: 'Bạn có chắc muốn hủy phiếu nhập này?',
            text: 'Hành động này sẽ hoàn trả số lượng sách trong kho!',
        })

        if (!confirmed) return

        try {
            this.showLoading()

            const res = await fetch(`${this.config.apiBaseUrl}/cancel/${receiptId}`, {
                method: 'PUT',
            })

            const data = await res.json()

            if (!res.ok)
                throw new Error(
                    data.message ||
                        data.error ||
                        `Lỗi HTTP ${res.status}: Thao tác hủy phiếu thất bại.`
                )

            const dataAttributeElement =
                this.tableWrapper.querySelector('#data-attribute')
            let targetPage = dataAttributeElement.dataset.currentPage

            this.hideLoading()
            this.notifySuccess(`Đã hủy phiếu nhập thành công`)
            this.updateView(targetPage)
        } catch (error) {
            this.hideLoading()
            this.notifyError(error.message)
        }
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

    async deleteEntity(btnDelete) {
        const rowElement = btnDelete.closest('tr')
        const entityId = rowElement.dataset.id

        if (!entityId) return

        const confirmed = await this.confirm({
            title: 'Bạn có chắc muốn xóa?',
            text: 'Bạn sẽ không hoàn tác được sau khi xóa!',
        })

        if (!confirmed) return

        try {
            this.showLoading()

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

            if (dataAttributeElement.dataset.totalItemPerPage < 2)
                targetPage -= 1

            this.hideLoading()
            this.notifySuccess(`Đã xóa ${this.config.entityName}`)
            this.updateView(targetPage)
        } catch (error) {
            this.hideLoading()
            this.notifyError(error.message)
        }
    }

    // updateView, handlePageChange, handlePopState, handleSearch,
    // sortData, updateSortIcon, debounced
    // đều dùng từ BaseTable
}

class DetailModal {
    constructor(tableInstance) {
        this.tableInstance = tableInstance
        this.modal = document.querySelector('#view-import-receipt-modal')
        this.labelDate = this.modal.querySelector('#view-ngaynhap')
        this.labelSupplier = this.modal.querySelector('#view-ncc-ten')
        this.labelEmployee = this.modal.querySelector('#view-nv-ten')
        this.labelNote = this.modal.querySelector('#view-noidung')
        this.tableDetaile = this.modal.querySelector('#view-receipt-items-body')
        this.totalPrice = this.modal.querySelector('#view-total-amount')
    }

    async showModal(id) {
        const modalInstance = bootstrap.Modal.getInstance(this.modal)
        if (modalInstance) {
            modalInstance.show()
        } else {
            const newInstance = new bootstrap.Modal(this.modal)
            newInstance.show()
        }

        await this.initValue(id)
    }

    async initValue(id) {
        try {
            const res1 = await fetch('/api/import-receipt/' + id)
            const receipt = await res1.json()

            if (!res1.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res1.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            const res2 = await fetch('/api/import-receipt/detail/' + id)
            const details = await res2.json()

            if (!res2.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res2.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            this.labelDate.textContent = helpers.formatTime7(receipt.NgayNhap)
            this.labelEmployee.textContent = receipt.HoTen
            this.labelSupplier.textContent = receipt.TenNCC
            this.labelNote.textContent = receipt.NoiDung

            let html = ''

            let totalPrice = 0
            details.forEach((detail) => {
                const price = detail.DonGiaNhap * detail.SoLuong
                totalPrice += price
                html += `
                    <tr>
                        <td class="text-end">${detail.TenSach}</td>
                        <td class="text-end">${detail.SoLuong}</td>
                        <td class="text-end">${helpers.formatPrice(detail.DonGiaNhap)}</td>
                        <td class="text-end">${helpers.formatPrice(totalPrice)}</td>
                    </tr>
                `
            })

            this.tableDetaile.innerHTML = html
            this.totalPrice.textContent = helpers.formatPrice(totalPrice)
        } catch (error) {
            console.error('Lỗi khi hiển thị chi tiết phiếu nhập:', error)
            Swal.fire({
                icon: 'error',
                title: 'Lỗi khi hiển thị chi tiết phiếu nhập!',
                text: error.message,
            })
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const importReceiptTable = new ImportReceiptTable()
    const importReceiptFormModal = new ImportReceiptFormModal(
        importReceiptTable
    )
    const detailModal = new DetailModal(importReceiptTable)
    importReceiptTable.setImportDetailModalInstance(detailModal)
})
