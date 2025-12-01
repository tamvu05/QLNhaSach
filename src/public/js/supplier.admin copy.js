import showToast from './toast.js'

class Supply {
    constructor() {
        this.table = document.querySelector('#table-view-manager')
        this.modal = document.querySelector('#supplier-modal')
        this.inputName = this.modal.querySelector('#entity-name-input')
        this.inputAddress = this.modal.querySelector('#entity-addresss-input')
        this.inputPhone = this.modal.querySelector('#entity-phone-input')
        this.btnSave = this.modal.querySelector('.btn-save-entity')
        this.btnExport = document.querySelector('.export-button')
        this.sortableHeaders = this.table.querySelectorAll('tr .sortable')
        this.inputSearch = document.querySelector('.search-value')
        this.pagination = document.querySelector('#pagination-view-manager')
        this.type = 'add'

        this.initState()
        this.initEventListener()
    }

    initEventListener() {
        // Lưu
        if (this.btnSave) {
            this.btnSave.addEventListener('click', () => {
                if (this.type === 'add') this.addSupplier()
            })
        }

        // Đóng modal
        if (this.modal) {
            this.modal.addEventListener(
                'hidden.bs.modal',
                this.hideModalAdd.bind(this)
            )
        }

        // Nhập liệu
        if (this.modal) {
            this.modal.addEventListener('keydown', (event) => {
                this.resetFormModal(event.target)
            })
        }

        // click table
        if (this.table) {
            this.table.addEventListener('click', (e) => {
                const btnDelete = e.target.closest('.btn-delete-entity')
                const btnUpdate = e.target.closest('.btn-show-modal-update')
                const sortableHeader = e.target.closest('tr i.sortable')

                if (btnDelete) this.deleteSupplier(btnDelete)
                else if (btnUpdate) {
                } else if (sortableHeader) this.sortData(sortableHeader)
            })
        }

        // Chuyển trang
        if (this.pagination) {
            this.pagination.addEventListener('click', (e) => {
                const element = e.target.closest('a.page-link')
                if (element) {
                    e.preventDefault()
                    this.handlePageChange(element)
                }
            })
        }
    }

    initState() {
        const urlParams = new URLSearchParams(window.location.search)
        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        if (keyword) this.inputSearch.value = keyword
        if (sort && order) {
            this.sortableHeaders.forEach((h) => {
                if (h.dataset.sort === sort) {
                    h.setAttribute('data-order', order)
                }
            })
        }
    }

    initValueForUpdate() {}

    resetValueForUpdate() {
        this.type = 'add'
    }

    async addSupplier() {
        if (!this.validateForm()) return

        try {
            const res = await fetch('/api/supplier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    TenNCC: this.inputName.value.trim(),
                    DiaChi: this.inputAddress.value.trim(),
                    SDT: this.inputPhone.value.trim(),
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                const errorMessage =
                    data.message ||
                    data.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                throw new Error(errorMessage)
            }

            showToast('Đã thêm sách', 'success')
            this.modal.querySelector('.btn-close').click()

            const query = this.getQueryString(1)
            console.log(query)
            window.location = '/admin/supplier' + query
        } catch (error) {
            console.log(error)
            showToast(error.message, 'danger')
        }
    }

    async deleteSupplier(btnDelete) {
        const rowElement = btnDelete.closest('tr')
        const entityId = rowElement.dataset.id

        if (!entityId) return

        try {
            const res = await fetch(`/api/supplier/${entityId}`, {
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

            this.updateView(targetPage)
            showToast(`Đã xóa nhà cung cấp`, 'success')
        } catch (error) {
            showToast(error.message, 'danger')
        }
    }

    validateForm() {
        const requiredFields = [
            { element: this.inputName, invalidSelector: '.empty-name' },
            { element: this.inputAddress, invalidSelector: '.empty-address' },
            { element: this.inputPhone, invalidSelector: '.empty-phone' },
        ]

        let hasError = false

        for (const field of requiredFields) {
            const e = this.modal.querySelector(field.invalidSelector)
            if (field.element.value.trim() === '') {
                e.classList.remove('invalid-value')
                hasError = true
            } else {
                e.classList.add('invalid-value')
            }
        }

        if (!hasError) {
            const phoneRegex = /^(0|\+84)(9\d|8\d|7\d|5\d|3\d)\d{7}$/
            if (!phoneRegex.test(this.inputPhone.value.trim())) {
                this.modal
                    .querySelector('.invalid-phone')
                    .classList.remove('invalid-value')
                hasError = true
            } else {
                this.modal
                    .querySelector('.invalid-phone')
                    .classList.add('invalid-value')
            }
        }

        return !hasError
    }

    getQueryString(p = null, s = null, o = null, k = null) {
        const urlParams = new URLSearchParams(window.location.search)

        const page = p ? p : urlParams.get('page') || 1
        const sort = s ? s : urlParams.get('sort') || null
        const order = o ? o : urlParams.get('order') || null
        const keyword = k ? k : urlParams.get('keyword') || null

        let query = `?page=${page}`
        if (sort) query += `&sort=${sort}`
        if (order) query += `&order=${order}`
        if (keyword) query += `&keyword=${keyword}`

        return query
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

        const sort = currentHeader.dataset.sort

        const query = this.getQueryString(null, sort, newOrder, null)
        window.location = '/admin/supplier' + query
    }

    handlePageChange(btnPage) {
        const href = btnPage.getAttribute('href')
        const page = href.split('?page=')[1]
        const query = this.getQueryString(page)
        window.location = '/admin/supplier' + query
    }

    hideModalAdd() {
        this.resetFormModal()
    }

    resetFormModal(element = null) {
        const requiredFields = [
            { element: this.inputName, invalidSelector: '.empty-name' },
            { element: this.inputAddress, invalidSelector: '.empty-address' },
            { element: this.inputPhone, invalidSelector: '.empty-phone' },
        ]

        if (element) {
            requiredFields.forEach((field) => {
                if (field.element === element)
                    this.modal
                        .querySelector(field.invalidSelector)
                        .classList.add('invalid-value')
            })
        } else {
            requiredFields.forEach((field) => {
                field.element.value = ''
                this.modal
                    .querySelector(field.invalidSelector)
                    .classList.add('invalid-value')
            })
        }
    }

    setTypeUpdate() {
        this.type = 'update'
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const supply = new Supply()
})
