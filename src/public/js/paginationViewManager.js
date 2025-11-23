import showToast from './toast.js'

const paginationZone = document.querySelector('#pagination-view-manager')
const tableWrapper = document.querySelector('#table-view-manager')

if (paginationZone) {
    paginationZone.addEventListener('click', (event) => {
        const btn = event.target.closest('a.page-link')

        if (btn && btn.hasAttribute('href')) {
            event.preventDefault()

            const href = btn.getAttribute('href')
            const url = new URL(href, window.location.origin)
            const newPage = url.searchParams.get('page')

            updateView(newPage)
        }
    })
}

// Hàm cập nhật view
async function updateView(page = 1) {
    try {

        const sortableHeader = tableWrapper.querySelector('tr i.sortable[data-order]')
        let query = `page=${page}`
        if(sortableHeader) {
            const sort = sortableHeader.dataset.sort
            const order = sortableHeader.dataset.order
            query += `&sort=${sort}&order=${order}`
        }

        const res = await fetch(`/api/category/partials?${query}`)
        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.message || `Lỗi không xác định: ${res.status}`)
        }

        const paginationElement = document.querySelector(
            '#pagination-view-manager'
        )

        tableWrapper.innerHTML = data.table
        paginationElement.innerHTML = data.pagination
        if(sortableHeader) {
            const sort = sortableHeader.dataset.sort
            const order = sortableHeader.dataset.order
            console.log(sort, order);
            updateSortIcon(sort, order)
        }

        // Cập nhật lại URL trình duyệt mà kh reload trang
        // const currentUrl = new URL(window.location.href)
        // currentUrl.searchParams.set('page', page)
        // history.pushState(null, '', currentUrl.toString())
    } catch (error) {
        showToast('Lỗi cập nhật view', 'danger')
    }
}

// Update sort icon
function updateSortIcon(sortKey, sortOrder) {
            console.log(sortKey, sortOrder);

    const sortableHeaders = tableWrapper.querySelectorAll('tr i.sortable')
    sortableHeaders.forEach(h => {
        if(h.dataset.sort === sortKey) {
            h.setAttribute('data-order', sortOrder)
            return
        }
    })
}