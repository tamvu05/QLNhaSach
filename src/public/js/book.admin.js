// showToast replaced with Swal
import BaseTable from './base.table.js'

class BookFormModal {
    constructor(bookTableInstance) {
        this.bookTableInstance = bookTableInstance
        this.addModal = document.querySelector('#add-book-modal')
        this.bookNameInput = document.querySelector('#book-name-input')
        this.isbnInput = document.querySelector('#book-isbn-input')
        this.priceInput = document.querySelector('#book-price-input')
        this.authorInput = document.querySelector('#book-author-select')
        this.publisherInput = document.querySelector('#book-publisher-select')
        this.categoryInput = document.querySelector('#book-category-select')
        this.descriptionInput = document.querySelector('#book-desc-input')
        this.btnSave = document.querySelector('#add-book-modal .btn-save-book')
        this.imageInput = document.querySelector('#book-image-input')
        this.imagePreview = document.querySelector('#book-image-preview')
        this.btnRemoveImage = document.querySelector('#btn-remove-image')
        this.currentImageURL = null
        this.type = 'add'
        this.headerModal = document.querySelector('#add-book-modal-label')
        this.updateId = null
        this.imageCurrent = null
        this.inventoryQuantity = document.querySelector('#inventory-quantity')
        console.log(this.inventoryQuantity)

        this.initEventListener()
    }

    initEventListener() {
        // select2 cho tác giả
        $('#book-author-select').select2({
            placeholder: 'Chọn Tác giả',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#add-book-modal'),
        })

        // select2 cho nhà xuất bản
        $('#book-publisher-select').select2({
            placeholder: 'Chọn Nhà xuất bản',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#add-book-modal'),
        })

        // select2 cho thể loại
        $('#book-category-select').select2({
            placeholder: 'Chọn Thể loại',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#add-book-modal'),
        })

        // Thêm/Chỉnh sửa đầu sách
        if (this.btnSave) {
            this.btnSave.addEventListener('click', (event) => {
                if (this.type === 'add') this.addNewBook()
                else this.updateBook(this.updateId)
            })
        }

        // Đóng modal
        if (this.addModal) {
            this.addModal.addEventListener(
                'hidden.bs.modal',
                this.hideModalAdd.bind(this)
            )
        }

        // Khi tải ảnh lên
        if (this.imageInput) {
            this.imageInput.addEventListener(
                'change',
                this.handleImageUpload.bind(this)
            )
        }

        // Khi xóa ảnh vừa tải lên
        if (this.btnRemoveImage) {
            this.btnRemoveImage.addEventListener(
                'click',
                this.deleteImage.bind(this)
            )
        }

        // Click vào ảnh preview
        if (this.imagePreview) {
            this.imagePreview.addEventListener(
                'click',
                this.openImage.bind(this)
            )
        }
    }

    async initValueForUpdate(id) {
        this.type = 'update'
        this.headerModal.textContent = 'Chỉnh sửa thông tin sách'
        this.updateId = id
        document.querySelector('#book-image-label').textContent =
            'Chọn hình ảnh bìa mới'

        try {
            const res = await fetch('/api/book/' + id)
            const book = await res.json()
            if (!res.ok) {
                const errorMessage =
                    book.message ||
                    book.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            this.bookNameInput.value = book.TenSach
            this.isbnInput.value = book.ISBN
            this.priceInput.value = book.DonGia
            this.descriptionInput.value = book.MoTa
            this.imageCurrent = book.HinhAnh
            $(this.authorInput).val(book.MaTG).trigger('change')
            $(this.categoryInput).val(book.MaTL).trigger('change')
            $(this.publisherInput).val(book.MaNXB).trigger('change')
            this.inventoryQuantity.innerHTML = `
                <label class="form-label">Số lượng tồn kho</label>
                <div>${book.SoLuongTon}</div>`
        } catch (error) {
            console.log(error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Chọn ảnh bìa thất bại!',
                text: error.message,
            })
        }

        this.imagePreview.src = this.imageCurrent
        this.imagePreview.style.display = 'block'
        this.btnRemoveImage.style.display = 'block'
    }

    removeInitValueForUpdate() {
        this.type = 'add'
        this.headerModal.textContent = 'Thêm sách'
        this.updateId = null
        document.querySelector('#book-image-label').textContent =
            'Chọn hình ảnh bìa'
        this.imageCurrent = null
        this.inventoryQuantity.innerHTML = ``
    }

    async addNewBook() {
        try {
            if (!this.validateForm()) return

            const formData = new FormData()

            formData.append('TenSach', this.bookNameInput.value)
            formData.append('ISBN', this.isbnInput.value)
            formData.append('MaTG', this.authorInput.value)
            formData.append('MaNXB', this.publisherInput.value)
            formData.append('MaTL', this.categoryInput.value)
            formData.append('DonGia', this.priceInput.value)
            formData.append('MoTa', this.descriptionInput.value)

            if (this.imageInput.files[0]) {
                formData.append('HinhAnh', this.imageInput.files[0])
            }

            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const res = await fetch('/api/book', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            Swal.close()

            Swal.fire({
                title: 'Thêm sách thành công!',
                icon: 'success',
                draggable: true,
            })

            this.addModal.querySelector('.btn-close').click()

            this.bookTableInstance.updateView(1)
        } catch (error) {
            console.log(error)

            Swal.close()

            Swal.fire({
                icon: 'error',
                title: 'Thêm sách thất bại!',
                text: error.message,
            })
        }
    }

    async updateBook(id) {
        try {
            if (!this.validateForm()) return

            const formData = new FormData()

            formData.append('TenSach', this.bookNameInput.value)
            formData.append('ISBN', this.isbnInput.value)
            formData.append('MaTG', this.authorInput.value)
            formData.append('MaNXB', this.publisherInput.value)
            formData.append('MaTL', this.categoryInput.value)
            formData.append('DonGia', this.priceInput.value)
            formData.append('MoTa', this.descriptionInput.value)

            if (this.imageInput.files[0]) {
                formData.append('HinhAnh', this.imageInput.files[0])
            }

            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const res = await fetch('/api/book/' + id, {
                method: 'PUT',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            Swal.close()

            Swal.fire({
                title: 'Chỉnh sửa sách thành công!',
                icon: 'success',
                draggable: true,
            })

            this.addModal.querySelector('.btn-close').click()

            const urlParams = new URLSearchParams(window.location.search)
            const page = urlParams.get('page')

            this.bookTableInstance.updateView(page)
        } catch (error) {
            console.log(error)

            Swal.close()

            Swal.fire({
                icon: 'error',
                title: 'Chỉnh sửa sách thất bại!',
                text: error.message,
            })
        }
    }

    validateForm() {
        const requiredFields = [
            { element: this.bookNameInput, classInvalid: 'name-error' },
            { element: this.isbnInput, classInvalid: 'isbn-error' },
            { element: this.priceInput, classInvalid: 'price-error' },
            { element: this.authorInput, classInvalid: 'author-error' },
            { element: this.categoryInput, classInvalid: 'category-error' },
            { element: this.publisherInput, classInvalid: 'publisher-error' },
        ]

        let hasError = false

        for (const field of requiredFields) {
            if (!field.element || !field.element.value.trim()) {
                document
                    .querySelector(`#add-book-modal .${field.classInvalid}`)
                    .classList.remove('d-none')
                field.element?.focus()
                hasError = true
                break
            } else {
                document
                    .querySelector(`#add-book-modal .${field.classInvalid}`)
                    .classList.add('d-none')
            }

            if (field.element === this.isbnInput) {
                const isbnValue = field.element.value.trim()
                if (isbnValue.length !== 10 && isbnValue.length !== 13) {
                    document
                        .querySelector('#add-book-modal .isbn-error-length')
                        .classList.remove('d-none')
                    field.element?.focus()
                    hasError = true
                    break
                } else {
                    document
                        .querySelector('#add-book-modal .isbn-error-length')
                        .classList.add('d-none')
                }
            }
        }

        return !hasError
    }

    hideModalAdd() {
        this.removeInitValueForUpdate()

        const requiredFields = [
            { element: this.bookNameInput, classInvalid: 'name-error' },
            { element: this.isbnInput, classInvalid: 'isbn-error' },
            { element: this.priceInput, classInvalid: 'price-error' },
        ]

        requiredFields.forEach((field) => {
            field.element.value = ''
            this.addModal
                .querySelector(`.${field.classInvalid}`)
                .classList.add('d-none')
        })

        const requiredFields2 = [
            { element: this.authorInput, classInvalid: 'author-error' },
            { element: this.categoryInput, classInvalid: 'category-error' },
            { element: this.publisherInput, classInvalid: 'publisher-error' },
        ]

        requiredFields2.forEach((field) => {
            $(field.element).val(null).trigger('change')
            this.addModal
                .querySelector(`.${field.classInvalid}`)
                .classList.add('d-none')
        })

        this.descriptionInput.value = ''

        this.deleteImage()
    }

    handleImageUpload(event) {
        const files = event.target.files

        if (files.length === 0) {
            this.deleteImage()
            return
        }

        const file = files[0]

        if (file && file.type.startsWith('image/')) {
            if (this.currentImageURL) URL.revokeObjectURL(this.currentImageURL)

            const reader = new FileReader()

            reader.onload = (e) => {
                this.imagePreview.src = e.target.result
                this.imagePreview.style.display = 'block'
                this.btnRemoveImage.style.display = 'block'
            }

            reader.readAsDataURL(file)

            this.currentImageURL = URL.createObjectURL(file)
        } else {
            this.resetImageField()
            Swal.fire({
                icon: 'error',
                title: 'Tệp không hợp lệ!',
                text: 'Chỉ chấp nhận các tệp hình ảnh hợp lệ.',
            })
        }
    }

    deleteImage() {
        if (this.currentImageURL) {
            URL.revokeObjectURL(this.currentImageURL)
            this.currentImageURL = null
        }

        if (this.imageInput) {
            this.imageInput.value = ''
        }

        if (this.imagePreview) {
            if (this.imageCurrent) {
                this.imagePreview.src = this.imageCurrent
            } else {
                this.imagePreview.src = ''
                this.imagePreview.style.display = 'none'
                this.btnRemoveImage.style.display = 'none'
            }
        }
    }

    openImage() {
        if (this.imagePreview) {
            if (this.imageInput.files.length === 0)
                window.open(this.imageCurrent, '_blank')
            else window.open(this.currentImageURL, '_blank')
        }
    }

    showModal(id) {
        const modalInstance = bootstrap.Modal.getInstance(this.addModal)
        if (modalInstance) {
            modalInstance.show()
        } else {
            const newInstance = new bootstrap.Modal(this.addModal)
            newInstance.show()
        }

        this.initValueForUpdate(id)
    }
}

class BookTable extends BaseTable {
    constructor() {
        super({
            apiBaseUrl: '/api/book',
            entityName: 'đầu sách',
            exportFilename: 'DanhMucSach.xlsx',
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
        this.btnExport = document.querySelector(
            '.manager-container .export-button'
        )
        this.sortableHeaders =
            this.tableWrapper.querySelectorAll('tr .sortable')
        this.bookFormModalInstance = null

        // No extra filters for books right now
        this.collectFilters = () => ({})

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

        const currentPage = page ? Number(page) : 1

        this.updateView(currentPage, sort, order, keyword, false, true)
    }

    initEventListener() {
        if (this.tableWrapper)
            this.tableWrapper.addEventListener('click', (event) => {
                const btnDelete = event.target.closest('.btn-delete-entity')
                const btnUpdate = event.target.closest('.btn-show-modal-update')
                const sortableHeader = event.target.closest('tr i.sortable')

                // Xóa sách
                if (btnDelete) this.deleteEntity(btnDelete)
                // Chỉnh sửa sách
                else if (btnUpdate) {
                    const id = btnUpdate.closest('tr').dataset.id
                    this.bookFormModalInstance.showModal(id)
                }
                // Sắp xếp
                else if (sortableHeader) this.sortData(sortableHeader)
            })

        // back/forward trình duyệt
        window.addEventListener('popstate', this.handlePopState.bind(this))

        // search
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

        // Export
        if (this.btnExport) {
            this.btnExport.addEventListener('click', () => this.exportExcel())
        }
    }

    setBookFormModalInstance(instance) {
        this.bookFormModalInstance = instance
    }

    // updateView, handlePopState, handleSearch, sortData, updateSortIcon,
    // debounced, exportExcel đều dùng từ BaseTable

    async deleteEntity(btnDelete) {
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

        const rowElement = btnDelete.closest('tr')
        const entityId = rowElement.dataset.id

        if (!entityId) return

        try {
            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

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

            Swal.close()

            Swal.fire({
                title: 'Xóa sách thành công!',
                icon: 'success',
                draggable: true,
            })

            this.updateView(targetPage)
        } catch (error) {
            Swal.close()

            Swal.fire({
                icon: 'error',
                title: 'Xóa sách thất bại!',
                text: error.message,
            })
        }
    }

    sortData(currentHeader) {
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

    
}

document.addEventListener('DOMContentLoaded', () => {
    const bookTable = new BookTable()
    const bookFormModal = new BookFormModal(bookTable)
    bookTable.setBookFormModalInstance(bookFormModal)
})
