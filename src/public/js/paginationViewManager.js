import showToast from './toast.js'

const paginationWrapper = document.querySelector('#pagination-view-manager')
if (paginationWrapper) {
    const tableWrapper = document.querySelector('#table-view-manager')
    const apiBaseElement = paginationWrapper.querySelector('#attribute-api-base')
    let apiBase
    if (apiBaseElement) apiBase = apiBaseElement.dataset.apiBase

    paginationWrapper.addEventListener('click', (event) => {
        const btn = event.target.closest('a.page-link')

        if (btn && btn.hasAttribute('href')) {
            event.preventDefault()

            const href = btn.getAttribute('href')
            const url = new URL(href, window.location.origin)
            const newPage = url.searchParams.get('page')

            const sortableHeader = tableWrapper.querySelector(
                'tr i.sortable[data-order]'
            )
            let sort = null,
                order = null
            if (sortableHeader) {
                sort = sortableHeader.dataset.sort
                order = sortableHeader.dataset.order
            }

            const inputSearch = document.querySelector(
                '.manager-container .search-value'
            )
            let keyword = null
            if (inputSearch.value.trim() !== '') keyword = inputSearch.value.trim()

            updateView(newPage, sort, order, keyword)
        }
    })

    // Hàm cập nhật view
    async function updateView(page = 1, sort, order, keyword) {
        try {
            if (isNaN(page) || Number(page) < 1) page = 1

            let query = `page=${page}`
            if (sort) query += `&sort=${sort}`
            if (order) query += `&order=${order}`
            if (keyword) query += `&keyword=${keyword}`

            const res = await fetch(`${apiBase}/partials?${query}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(
                    data.message || `Lỗi không xác định: ${res.status}`
                )
            }

            if (tableWrapper) tableWrapper.innerHTML = data.table
            if (paginationWrapper) paginationWrapper.innerHTML = data.pagination

            updateSortIcon(sort, order)

            //Cập nhật lại URL trình duyệt mà kh reload trang
            const currentUrl = new URL(window.location.href)
            currentUrl.search = ''
            currentUrl.searchParams.set('page', page)
            if (sort) currentUrl.searchParams.set('sort', sort)
            if (order) currentUrl.searchParams.set('order', order)
            if (keyword) currentUrl.searchParams.set('keyword', keyword)

            history.pushState(null, '', currentUrl.toString())
        } catch (error) {
            showToast(error.message, 'danger')
        }
    }

    // Update sort icon
    function updateSortIcon(sortKey, sortOrder) {
        const sortableHeaders = tableWrapper.querySelectorAll('tr i.sortable')
        sortableHeaders.forEach((h) => {
            if (h.dataset.sort === sortKey) {
                h.setAttribute('data-order', sortOrder)
                return
            }
        })
    }
}
