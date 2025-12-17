import BaseTable from './base.table.js'
import getCurrentVietNamTime from './getCurrentVietNamTime.js'

class ExportReceiptFormModal {
    constructor(exportReceiptTableInstance) {
        this.exportReceiptTableInstance = exportReceiptTableInstance

        // Modal và Buttons
        this.modal = document.querySelector('#add-exportReceipt-modal')
        this.btnSave = document.querySelector('.btn-save-receipt')
        this.btnAddItem = document.querySelector('.btn-add-item')

        // Các trường Form chính
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

        this.selectedItems = new Map()

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

        // Select2 cho Chọn Sách
        $('#book-select-item').select2({
            ...select2Config,
            placeholder: 'Chọn sách',
        })
    }

    initEventListeners() {
        if (this.btnSave) {
            this.btnSave.addEventListener(
                'click',
                this.createReceipt.bind(this)
            )
        }

        if (this.btnAddItem) {
            this.btnAddItem.addEventListener(
                'click',
                this.addItemDetail.bind(this)
            )
        }

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

        if (this.modal) {
            this.modal.addEventListener(
                'hidden.bs.modal',
                this.resetModal.bind(this)
            )

            this.modal.addEventListener('show.bs.modal', async () => {
                await this.loadBookSelect()
            })
        }
    }

    async loadBookSelect() {
        try {
            const res = await fetch('/api/book/')
            const books = await res.json()

            let html = '<option value="">Chọn sách</option>'
            for (const book of books) {
                html += `
                <option value="${book.MaSach}" data-price="${book.DonGia}">
                    ${book.TenSach} (ISBN: ${book.ISBN}, Số lượng tồn: ${book.SoLuongTon}) 
                </option>`
            }

            this.selectBookItem.innerHTML = html
        } catch (error) {
            const errorMessage =
                data.message ||
                data.error ||
                `Lỗi HTTP ${res1.status}: Thao tác thất bại.`
            throw new Error(errorMessage)
        }

        this.inputDate.setAttribute('value', getCurrentVietNamTime())
    }

    // --- LOGIC THAO TÁC CHI TIẾT SÁCH (Giữ nguyên) ---

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
                value = Math.max(1, value)
                inputElement.value = value
                item.SoLuong = value
            } else if (field === 'price') {
                value = Math.max(0, value)
                inputElement.value = value
                item.DonGia = value
            }

            this.selectedItems.set(itemId, item)
            this.renderTotalAmount()
        }
    }

    async addItemDetail() {
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

        const res = await fetch('/api/book/quantity/' + bookId)
        const bookQuantity = await res.json()

        if (quantity > bookQuantity) {
            this.modal
                .querySelector('.out-of-stock-error')
                .classList.remove('d-none')
            return
        } else {
            this.modal
                .querySelector('.out-of-stock-error')
                .classList.add('d-none')
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
            const ok = await this.validateForm()
            if (!ok) {
                return
            }

            const ChiTietPX = Array.from(this.selectedItems.values()).map(
                (item) => ({
                    MaSach: item.MaSach,
                    SoLuong: item.SoLuong,
                    DonGia: item.DonGia,
                })
            )

            const payload = {
                MaNV: 1, // Đổi thành mã NV sau
                NgayXuat: this.inputDate.value,
                NoiDung: this.textareaNotes.value.trim(),
                ChiTietPX: ChiTietPX,
            }

            const res = await fetch('/api/export-receipt', {
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
                text: 'Đã tạo phiếu xuất hàng',
            })
            this.modal.querySelector('.btn-close').click()
            this.exportReceiptTableInstance.updateView(1)
        } catch (error) {
            console.error('Lỗi khi tạo phiếu xuất:', error)
            Swal.fire({
                icon: 'error',
                title: 'Tạo phiếu xuất hàng thất bại!',
                text: error.message,
            })
        }
    }

    async validateForm() {
        const requiredSelectors = [
            {
                element: this.inputDate,
                errorClass: 'empty-date',
                message: 'Vui lòng chọn ngày xuất!',
            },
        ]

        // Kiểm tra trường bắt buộc
        for (const field of requiredSelectors) {
            const errorElement = this.modal.querySelector(
                `.${field.errorClass}`
            )
            const value = field.element.value || $(field.element).val()

            if (!value || value === '' || value === null) {
                errorElement.classList.remove('d-none')
                return false
            } else {
                errorElement.classList.add('d-none')
            }
        }

        // Kiểm tra Chi tiết Phiếu (Items)
        const itemsErrorEl = this.modal.querySelector('.items-error')
        if (this.selectedItems.size === 0) {
            itemsErrorEl.classList.remove('d-none')
            return false
        } else {
            itemsErrorEl.classList.add('d-none')
        }

        let hasError = false

        // Kiểm tra tính hợp lệ của SL/Đơn giá trong bảng
        if (!hasError && this.selectedItems.size > 0) {
            const invalidAmountErrorEl = this.modal.querySelector(
                '.invalid-item-amount'
            )
            let isValid = true
            let outOfStock = false
            for (const item of this.selectedItems) {
                const id = item[0]
                const book = item[1]

                if (
                    book.SoLuong <= 0 ||
                    book.DonGia < 0 ||
                    isNaN(book.SoLuong) ||
                    isNaN(book.DonGia)
                ) {
                    isValid = false
                    break
                }

                const res = await fetch('/api/book/quantity/' + id)
                const stock = await res.json()

                if (book.SoLuong > stock) {
                    outOfStock = true
                    break
                }
            }

            if (!isValid) {
                invalidAmountErrorEl.classList.remove('d-none')
                hasError = true
            } else if (outOfStock) {
                this.modal
                    .querySelector('.out-of-stock-error2')
                    .classList.remove('d-none')
                hasError = true
            } else {
                invalidAmountErrorEl.classList.add('d-none')
                this.modal
                    .querySelector('.out-of-stock-error2')
                    .classList.add('d-none')
            }
        }

        return !hasError
    }

    resetModal() {
        // Reset form inputs
        this.inputDate.value = getCurrentVietNamTime()
        this.textareaNotes.value = ''
        this.inputQuantity.value = 1
        this.inputUnitPrice.value = 0

        // Reset Select2 fields
        // ❌ Không cần selectSupplier
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

// --- Class 2: ExportReceiptTable (Quản lý Bảng, Phân trang, Sự kiện) ---
class ExportReceiptTable extends BaseTable {
    constructor() {
        super({
            apiBaseUrl: '/api/export-receipt', // Endpoint đổi thành export-receipt
            entityName: 'phiếu xuất hàng',
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
        this.sortableHeaders =
            this.tableWrapper?.querySelectorAll('tr .sortable')

        this.exportDetailModalInstance = null // Đổi tên instance

        // No filters
        this.collectFilters = () => ({})
        this.applyFiltersFromUrl = () => {}

        this.loadInitialState()
        this.initEventListener()
    }

    loadInitialState() {
        // Đổi placeholder cho phù hợp
        this.searchInput.setAttribute(
            'placeholder',
            'Tìm kiếm theo tên nhân viên'
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
                const sortableHeader = event.target.closest('tr i.sortable')

                if (btnDetails) {
                    const id = btnDetails.closest('tr').dataset.id
                    this.exportDetailModalInstance.showModal(id)
                } else if (sortableHeader) this.sortData(sortableHeader)
            })

        if (this.paginationWrapper) {
            this.paginationWrapper.addEventListener('click', (e) => {
                e.preventDefault()
                this.handlePageChange(e.target)
            })
        }

        window.addEventListener('popstate', this.handlePopState.bind(this))

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

    setExportDetailModalInstance(instance) {
        this.exportDetailModalInstance = instance
    }

    // ... (Các hàm còn lại: handlePageChange, updateView, sortData, handlePopState, handleSearch, debounced, exportExcel giữ nguyên logic của ImportReceiptTable, chỉ thay đổi tên biến và endpoint API) ...
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

    // updateView, handlePageChange, handlePopState, handleSearch,
    // sortData, updateSortIcon, debounced, exportExcel
    // đều dùng từ BaseTable
}

// --- Class 3: DetailModal (Xem Chi tiết Phiếu Xuất) ---
class DetailModal {
    constructor(tableInstance) {
        this.tableInstance = tableInstance
        this.modal = document.querySelector('#view-import-receipt-modal')
        this.labelDate = this.modal.querySelector('#view-ngayxuat')
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
            const res1 = await fetch('/api/export-receipt/' + id)
            const receipt = await res1.json()

            if (!res1.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res1.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            const res2 = await fetch('/api/export-receipt/detail/' + id)
            const details = await res2.json()

            if (!res2.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res2.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            this.labelDate.textContent = this.formatToVietNamTime(
                receipt.NgayXuat
            )
            this.labelEmployee.textContent = receipt.HoTen
            this.labelNote.textContent = receipt.NoiDung

            let html = ''
            let totalPrice = 0

            details.forEach((detail) => {
                const price = detail.DonGiaXuat * detail.SoLuong
                totalPrice += price
                html += `
                    <tr>
                        <td class="text-end">${detail.TenSach}</td>
                        <td class="text-end">${detail.SoLuong}</td>
                        <td class="text-end">${detail.DonGiaXuat.toLocaleString(
                            'vi-VN'
                        )}</td>
                        <td class="text-end">${price.toLocaleString(
                            'vi-VN'
                        )}</td>
                    </tr>
                `
            })

            this.tableDetaile.innerHTML = html
            this.totalPrice.textContent = totalPrice.toLocaleString('vi-VN')
        } catch (error) {
            console.error('Lỗi khi hiển thị chi tiết phiếu xuất:', error)
            Swal.fire({
                icon: 'error',
                title: 'Lỗi khi hiển thị chi tiết phiếu xuất!',
                text: error.message,
            })
        }
    }

    formatToVietNamTime(dateInput) {
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
}

// --- Khởi tạo ứng dụng ---
document.addEventListener('DOMContentLoaded', () => {
    const exportReceiptTable = new ExportReceiptTable()
    const exportReceiptFormModal = new ExportReceiptFormModal(
        exportReceiptTable
    )
    const detailModal = new DetailModal(exportReceiptTable)

    exportReceiptTable.setExportDetailModalInstance(detailModal)
})
