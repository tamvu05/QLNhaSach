export default class BaseTable {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl,
            entityName: config.entityName || 'entity',
            exportFilename: config.exportFilename || 'Export.xlsx',
        }

        // Optional hooks provided by subclass
        // this.collectFilters = () => ({})
        // this.applyFiltersFromUrl = (urlParams) => {}

        // DOM references must be set by subclass after super():
        // this.tableWrapper, this.paginationWrapper, this.btnSearch,
        // this.searchInput, this.btnExport, this.sortableHeaders
    }

    // ---------- Utilities ----------
    notifySuccess(message) {
        if (window.Swal)
            Swal.fire({
                icon: 'success',
                title: message,
            })
        else alert(message)
    }

    notifyError(message, title = 'Lỗi') {
        if (window.Swal) Swal.fire({ icon: 'error', title, text: message })
        else alert(`${title}: ${message}`)
    }

    confirm(options = {}) {
        const { title = 'Xác nhận', text = '' } = options
        if (window.Swal) {
            return Swal.fire({
                title,
                text,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận',
                cancelButtonText: 'Hủy bỏ',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
            }).then((r) => r.isConfirmed)
        }
        return Promise.resolve(window.confirm(`${title}\n${text}`))
    }

    showLoading() {
        if (window.Swal) {
            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng chờ trong giây lát!',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            })
        }
    }

    hideLoading() {
        if (window.Swal) Swal.close()
    }

    // ---------- Core behaviors ----------
    getActiveSort() {
        const sortableHeader = this.tableWrapper?.querySelector('tr i.sortable[data-order]')
        if (!sortableHeader) return { sort: null, order: null }
        return {
            sort: sortableHeader.dataset.sort || null,
            order: sortableHeader.dataset.order || null,
        }
    }

    getKeywordFromInput() {
        return this.searchInput ? this.searchInput.value.trim() : null
    }

    buildQueryParams({ page, sort, order, keyword, extra = {} }) {
        const params = new URLSearchParams()
        if (page) params.set('page', String(page))
        if (sort) params.set('sort', sort)
        if (order) params.set('order', order)
        if (keyword) params.set('keyword', keyword)

        Object.entries(extra || {}).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).trim() !== '') {
                params.set(k, v)
            }
        })
        return params.toString()
    }

    async updateView(page = 1, sort, order, keyword, shouldPushState = true, shouldReplaceState = false) {
        try {
            if (isNaN(page) || Number(page) < 1) page = 1

            const kw = keyword !== undefined ? keyword : this.getKeywordFromInput()
            const extra = typeof this.collectFilters === 'function' ? this.collectFilters() : {}

            const qs = this.buildQueryParams({ page, sort, order, keyword: kw, extra })

            const res = await fetch(`${this.config.apiBaseUrl}/partials?${qs}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || data.error || `Lỗi không xác định: ${res.status}`)
            }

            if (this.tableWrapper) this.tableWrapper.innerHTML = data.table
            if (this.paginationWrapper) this.paginationWrapper.innerHTML = data.pagination

            this.updateSortIcon(sort, order)

            if (shouldPushState || shouldReplaceState) {
                const currentUrl = new URL(window.location.href)
                currentUrl.search = ''
                const urlParams = new URLSearchParams()
                urlParams.set('page', String(page))
                if (sort) urlParams.set('sort', sort)
                if (order) urlParams.set('order', order)
                if (kw) urlParams.set('keyword', kw)
                Object.entries(extra || {}).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && String(v).trim() !== '') urlParams.set(k, v)
                })
                currentUrl.search = urlParams.toString()
                const urlString = currentUrl.toString()
                if (shouldReplaceState) history.replaceState(null, '', urlString)
                else history.pushState(null, '', urlString)
            }
        } catch (error) {
            this.notifyError(error.message, 'Cập nhật giao diện thất bại!')
        }
    }

    handlePageChange(targetElement) {
        const pageLink = targetElement.closest('.page-link')
        if (!pageLink) return
        const targetPage = Number(pageLink.dataset.page)
        if (!targetPage) return

        const { sort, order } = this.getActiveSort()
        const keyword = this.getKeywordFromInput()
        const extra = typeof this.collectFilters === 'function' ? this.collectFilters() : {}

        this.updateView(targetPage, sort, order, keyword)
    }

    handlePopState() {
        const urlParams = new URLSearchParams(window.location.search)
        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        if (typeof this.applyFiltersFromUrl === 'function') {
            this.applyFiltersFromUrl(urlParams)
        }

        const currentPage = page ? Number(page) : 1
        this.updateView(currentPage, sort, order, keyword, false)
    }

    handleSearch() {
        const keyword = this.getKeywordFromInput()
        const { sort, order } = this.getActiveSort()
        this.updateView(1, sort, order, keyword)
    }

    sortData(currentHeader) {
        if (!this.sortableHeaders) return
        this.sortableHeaders.forEach((h) => {
            if (h !== currentHeader) h.removeAttribute('data-order')
        })
        const currentOrder = currentHeader.getAttribute('data-order')
        const newOrder = currentOrder === 'asc' ? 'desc' : currentOrder === 'desc' ? 'asc' : 'desc'
        currentHeader.setAttribute('data-order', newOrder)

        const currentPage = this.tableWrapper?.querySelector('#data-attribute')?.dataset?.currentPage || 1
        const sort = currentHeader.dataset.sort
        const keyword = this.getKeywordFromInput()
        this.updateView(Number(currentPage), sort, newOrder, keyword)
    }

    updateSortIcon(sortKey, sortOrder) {
        const headers = this.tableWrapper?.querySelectorAll('tr i.sortable') || []
        headers.forEach((h) => {
            if (h.dataset.sort === sortKey) h.setAttribute('data-order', sortOrder)
            else h.removeAttribute('data-order')
        })
    }

    debounced(func, delay) {
        let timerID
        return (...args) => {
            clearTimeout(timerID)
            timerID = setTimeout(() => func.apply(this, args), delay)
        }
    }

    async exportExcel() {
        try {
            const res = await fetch(`${this.config.apiBaseUrl}/export`)
            if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}: Không thể tải file.`)

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url

            const disposition = res.headers.get('content-disposition')
            let filename = this.config.exportFilename
            if (disposition && disposition.indexOf('filename=') !== -1) {
                filename = disposition.split('filename=')[1].replace(/"/g, '')
            }
            a.download = filename

            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            this.notifyError(error.message, 'Xuất file thất bại!')
        }
    }
}
