import showToast from './toast.js'
import getCurrentVietNamTime from './getCurrentVietNamTime.js'

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

function formatPrice(price) {
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

function isValidVietnamesePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        return false
    }

    const phoneRegex = /^(0|\+84)(9\d|8\d|7\d|5\d|3\d)\d{7}$/

    return phoneRegex.test(phoneNumber.trim())
}

class InvoiceAddModal {
    constructor(invoiceTableInstance) {
        this.invoiceTableInstance = invoiceTableInstance

        this.modal = document.querySelector('#add-invoice-modal')
        this.btnSave = document.querySelector('.btn-save-receipt')
        this.btnAddItem = document.querySelector('.btn-add-item')

        this.inputName = this.modal.querySelector('#input-hoten')
        this.inputPhone = this.modal.querySelector('#input-sdt')
        this.inputAddress = this.modal.querySelector('#input-diachi')

        this.inputDate = this.modal.querySelector('#receipt-date-input')
        this.textareaNotes = this.modal.querySelector('#receipt-notes-textarea')
        this.paymentMethod = this.modal.querySelector('#payment-method-select')

        this.selectBookItem = this.modal.querySelector('#book-select-item')
        this.inputQuantity = this.modal.querySelector('#input-quantity')
        this.inputUnitPrice = this.modal.querySelector('#input-unit-price')

        this.itemsBody = this.modal.querySelector('#receipt-items-body')
        this.totalAmountDisplay = this.modal.querySelector(
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

        $('#book-select-item').select2({
            ...select2Config,
            placeholder: 'Chọn sách',
        })
    }

    initEventListeners() {
        if (this.btnSave) {
            this.btnSave.addEventListener(
                'click',
                this.createInvoice.bind(this)
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

            // Load sách khi modal chuẩn bị mở
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
                <option value="${book.MaSach}" data-price="${book.DonGia}" data-stock="${book.SoLuongTon}">
                    ${book.TenSach} (ISBN: ${book.ISBN}, Tồn: ${book.SoLuongTon}) 
                </option>`
            }

            this.selectBookItem.innerHTML = html
        } catch (error) {
            // Xử lý lỗi tải sách
            console.error('Lỗi khi tải danh sách sách:', error)
            Swal.fire({
                icon: 'error',
                title: 'Tải sách thất bại!',
                text: error.message,
            })
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

    async addItemDetail() {
        const bookId = this.selectBookItem.value
        let quantity = Number(this.inputQuantity.value)
        let unitPrice = Number(this.inputUnitPrice.value)

        // Lấy tồn kho từ data-stock
        const selectedOption =
            this.selectBookItem.options[this.selectBookItem.selectedIndex]
        const currentStock = Number(selectedOption?.dataset?.stock || 0)

        if (!bookId || quantity <= 0 || unitPrice < 0) {
            this.modal
                .querySelector('.item-input-error')
                .classList.remove('d-none')
            return
        }
        this.modal.querySelector('.item-input-error').classList.add('d-none')

        if (this.selectedItems.has(bookId)) {
            showToast(
                'Sách này đã được thêm. Vui lòng chỉnh sửa số lượng trong bảng.',
                'warning'
            )
            return
        }

        // KIỂM TRA TỒN KHO TẠI CLIENT
        if (quantity > currentStock) {
            this.modal
                .querySelector('.out-of-stock-error')
                .classList.remove('d-none')
            showToast(`Sách này chỉ còn ${currentStock} cuốn.`, 'warning')
            return
        } else {
            this.modal
                .querySelector('.out-of-stock-error')
                .classList.add('d-none')
        }

        // ... (Tiếp tục thêm item và reset form) ...
        const newItem = {
            MaSach: bookId,
            TenSach: selectedOption.text.split(' (ISBN:')[0].trim(),
            SoLuong: quantity,
            DonGia: unitPrice,
        }
        this.selectedItems.set(bookId, newItem)

        $(this.selectBookItem).val(null).trigger('change')
        this.inputQuantity.value = 1
        this.inputUnitPrice.value = 0

        this.renderItemsTable()
        this.renderTotalAmount()
    }

    async createInvoice() {
        try {
            const ok = await this.validateForm()
            if (!ok) return

            const ChiTietHD = Array.from(this.selectedItems.values()).map(
                (item) => ({
                    MaSach: item.MaSach,
                    SoLuong: item.SoLuong,
                    DonGia: item.DonGia,
                })
            )

            const payload = {
                TenNguoiNhan: this.inputName.value.trim() || 'Khách lẻ',
                SDT: this.inputPhone.value.trim() || '',
                DiaChiNhan: this.inputAddress.value.trim() || null,
                NgayTao: this.inputDate.value,
                HinhThucThanhToan: this.paymentMethod.value,
                NoiDung: this.textareaNotes.value.trim(),
                ChiTietHD: ChiTietHD,
                MaNV: 1, // Chỉnh sửa lại sau
            }

            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const res = await fetch('/api/sale/invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                const errorMessage =
                    data.message ||
                    `Lỗi HTTP ${res.status}: Tạo hóa đơn thất bại.`
                throw new Error(errorMessage)
            }

            Swal.close()
            Swal.fire({
                title: 'Tạo hóa đơn thành công!',
                icon: 'success',
                draggable: true,
            })

            this.modal.querySelector('.btn-close').click()
            this.invoiceTableInstance.updateView()
        } catch (error) {
            console.error('Lỗi khi tạo hóa đơn:', error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: ' thất bại!',
                text: error.message,
            })
        }
    }

    async validateForm() {
        const phone = this.inputPhone.value.trim()
        if (phone && phone !== '') {
            const ok = isValidVietnamesePhoneNumber(phone)
            if (!ok) {
                this.modal
                    .querySelector('.invalid-phone-number')
                    .classList.remove('d-none')
                return false
            } else {
                this.modal
                    .querySelector('.invalid-phone-number')
                    .classList.add('d-none')
            }
        } else {
            this.modal
                .querySelector('.invalid-phone-number')
                .classList.add('d-none')
        }

        const requiredSelectors = [
            {
                element: this.inputDate,
                errorClass: 'empty-date',
                message: 'Vui lòng chọn ngày tạo hóa đơn!',
            },
        ]

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

        // 2. Kiểm tra Chi tiết Phiếu (Items)
        const itemsErrorEl = this.modal.querySelector('.items-error')
        if (this.selectedItems.size === 0) {
            itemsErrorEl.classList.remove('d-none')
            return false
        } else {
            itemsErrorEl.classList.add('d-none')
        }

        // 3. Kiểm tra tính hợp lệ của SL/Đơn giá trong bảng (Bao gồm Tồn kho lần cuối)
        let hasError = false
        if (!hasError && this.selectedItems.size > 0) {
            const invalidAmountErrorEl = this.modal.querySelector(
                '.invalid-item-amount'
            )
            const outOfStockErrorEl = this.modal.querySelector(
                '.out-of-stock-error2'
            )

            let isValidAmount = true
            let outOfStock = false

            for (const item of this.selectedItems) {
                const book = item[1]
                if (
                    book.SoLuong <= 0 ||
                    book.DonGia < 0 ||
                    isNaN(book.SoLuong) ||
                    isNaN(book.DonGia)
                ) {
                    isValidAmount = false
                    break
                }

                // KIỂM TRA TỒN KHO THỰC TẾ LẦN CUỐI (Tương tự Export)
                const res = await fetch('/api/book/quantity/' + book.MaSach)
                const stock = await res.json()

                if (book.SoLuong > stock) {
                    outOfStock = true
                    break
                }
            }

            if (!isValidAmount) {
                invalidAmountErrorEl.classList.remove('d-none')
                hasError = true
            } else {
                invalidAmountErrorEl.classList.add('d-none')
            }

            if (outOfStock) {
                outOfStockErrorEl.classList.remove('d-none')
                hasError = true
            } else {
                outOfStockErrorEl.classList.add('d-none')
            }
        }

        return !hasError
    }

    resetModal() {
        // ... (Logic reset form) ...
        this.inputDate.value = getCurrentVietNamTime()
        this.textareaNotes.value = ''
        this.inputQuantity.value = 1
        this.inputUnitPrice.value = 0

        this.inputName.value = '' // Reset trường Khách hàng
        this.inputPhone.value = ''
        this.inputAddress.value = ''

        // Reset Select2 fields
        $(this.selectBookItem).val(null).trigger('change')

        // Reset items
        this.selectedItems.clear()
        this.renderItemsTable()
        this.renderTotalAmount()

        this.modal.querySelectorAll('.value-error').forEach((errorEl) => {
            errorEl.classList.add('d-none')
        })
    }
}

class InvoiceViewModal {
    constructor(invoiceTableInstance) {
        this.invoiceTableInstance = invoiceTableInstance

        // Modal và Buttons
        this.modal = document.querySelector('#modal-view-invoice') // ID modal

        // Khu vực hiển thị thông tin chung
        this.labelName = this.modal.querySelector('#view-hoten')
        this.labelPhone = this.modal.querySelector('#view-sdt')
        this.labelAdresss = this.modal.querySelector('#view-diachi')
        this.labelDate = this.modal.querySelector('#view-ngaydat')
        this.labelNote = this.modal.querySelector('#view-noidung') // Nếu có

        // Khu vực hiển thị Chi tiết
        this.tableDetails = this.modal.querySelector('#view-receipt-items-body')
        this.voucherDisplay = this.modal.querySelector('#voucher')
        this.totalPrice = this.modal.querySelector('#view-total-amount')

        this.initEventListeners()
    }

    initEventListeners() {
        // Hóa đơn là module tĩnh, không có nút save/update
    }

    // Hàm nạp dữ liệu chi tiết và hiển thị modal
    async initValue(id) {
        try {
            const res1 = await fetch('/api/sale/invoice/' + id)
            const invoiceData = await res1.json()

            if (!res1.ok) {
                throw new Error(
                    invoiceData.message ||
                        `Lỗi HTTP ${res1.status}: Không tìm thấy hóa đơn`
                )
            }

            // Fetch Invoice Items (Chi tiết đơn hàng)
            const res2 = await fetch('/api/sale/invoice/detail/' + id)
            const invoiceDetail = await res2.json()

            if (!res2.ok) {
                throw new Error(
                    invoiceDetail.message ||
                        `Lỗi HTTP ${res2.status}: Không tìm thấy chi tiết hóa đơn`
                )
            }

            // --- 1. HIỂN THỊ THÔNG TIN KHÁCH HÀNG & PHIẾU ---
            this.labelName.textContent = invoiceData.TenNguoiNhan
            this.labelPhone.textContent = invoiceData.SDT
            this.labelAdresss.textContent = invoiceData.DiaChiNhan
            this.labelDate.textContent = formatToVietNamTime(
                invoiceData.NgayTaoHoaDon
            )
            // this.labelNote.textContent = invoiceData.GhiChu || 'Không có ghi chú' // Nếu có trường ghi chú

            // --- 2. HIỂN THỊ CHI TIẾT SÁCH TRONG BẢNG ---
            let html = ''
            let totalAmount = 0

            // Giả sử dữ liệu chi tiết có các trường: TenSach, SoLuong, DonGia, KhuyenMai, Voucher
            invoiceDetail.forEach((detail) => {
                // Tính toán Thành tiền sau khi áp dụng Khuyến mãi
                const discountFactor = 1 - (detail.KhuyenMai || 0) / 100
                const lineTotal =
                    detail.DonGia * detail.SoLuong * discountFactor

                totalAmount += lineTotal

                html += `
                    <tr>
                        <td>${detail.TenSach}</td>
                        <td class="text-end">${detail.SoLuong}</td>
                        <td class="text-end">${this.formatPrice(
                            detail.DonGia
                        )}</td>
                        <td class="text-end">${detail.KhuyenMai || 0}%</td>
                        <td class="text-end">${this.formatPrice(lineTotal)}</td>
                    </tr>
                `
            })

            this.tableDetails.innerHTML = html
            this.totalPrice.textContent = this.formatPrice(totalAmount)
            this.voucherDisplay.textContent = this.formatPrice(
                invoiceData.GiaTriVoucher || 0
            )
        } catch (error) {
            console.error('Lỗi khi hiển thị chi tiết hóa đơn:', error)
            Swal.fire({
                icon: 'error',
                title: 'Tải dữ liệu thất bại!',
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

    // Modal Hóa đơn không cần reset phức tạp
    resetModal() {}

    formatPrice(price) {
        // Áp dụng hàm formatPrice từ constructor
        return formatPrice(price)
    }
}

class InvoiceTable {
    constructor() {
        this.config = {
            apiBaseUrl: '/api/sale/invoice',
            entityName: 'hóa đơn bán hàng',
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
        // Hóa đơn là static, thường không có bộ lọc trạng thái

        this.invoiceModalInstance = null

        this.loadInitialState()
        this.initEventListeners()
    }

    loadInitialState() {
        // Hóa đơn thường không lọc trạng thái
        this.searchInput.setAttribute(
            'placeholder',
            'Tìm kiếm theo số điện thoại khách hàng'
        )

        const urlParams = new URLSearchParams(window.location.search)

        // ... (Logic tải trạng thái tìm kiếm ban đầu) ...
        const page = urlParams.get('page')
        const keyword = urlParams.get('keyword')

        if (this.searchInput && keyword) {
            this.searchInput.value = keyword
        }

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, null, null, keyword, false, true)
    }

    initEventListeners() {
        // Bắt sự kiện xem chi tiết
        if (this.tableWrapper)
            this.tableWrapper.addEventListener('click', (event) => {
                const btnDetails = event.target.closest('.btn-show-details')

                if (btnDetails) {
                    const id = btnDetails.closest('tr').dataset.id
                    this.invoiceModalInstance.showModal(id)
                }
            })

        // ... (Listeners Phân trang, Search, Popstate tương tự OrderTable) ...
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
            this.searchInput.addEventListener('input', () => {
                const func = () => {
                    this.handleSearch()
                }
                const delay = 1000
                const handleDebounced = this.debounced(func, delay)
                handleDebounced()
            })
        }
    }

    setInvoiceModalInstance(instance) {
        this.invoiceModalInstance = instance
    }

    // --- Các hàm quản lý View (Tương tự OrderTable) ---
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

    handleSearch() {
        const keyword = this.searchInput ? this.searchInput.value.trim() : null

        const sortableHeader = this.tableWrapper?.querySelector(
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
    const invoiceTable = new InvoiceTable()
    const invoiceViewModal = new InvoiceViewModal(invoiceTable)
    const invoiceAddModal = new InvoiceAddModal(invoiceTable)

    invoiceTable.setInvoiceModalInstance(invoiceViewModal)
})
