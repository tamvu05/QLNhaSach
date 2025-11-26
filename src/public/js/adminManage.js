import showToast from './toast.js'

const tableWrapper = document.querySelector('#table-view-manager')
const paginationWrapper = document.querySelector('#pagination-view-manager')

/**
 * Hàm khởi tạo và gán sự kiện cho trang quản lý chung
 * @param {object} config - Chứa các cấu hình cụ thể của thực thể
 */
export function initializeManager(config) {
    const {
        apiBaseUrl,
        modalAddId,
        modalUpdateId,
        entityName,
        entityIdKey,
        entityNameKey,
        entityDescKey,
    } = config

    // --- 1. SETUP ADD MODAL ---
    const addModal = document.getElementById(modalAddId)
    if (!addModal) return

    const btnAddEntity = addModal.querySelector('.btn-save-entity')
    const nameEmptyAddModal = addModal.querySelector('.empty-name')
    const notUniqueAddModal = addModal.querySelector('.not-unique-name')
    const newEntityNameInput = addModal.querySelector('#entity-name-input')
    const newEntityDescInput = addModal.querySelector('#entity-desc-input')

    if (btnAddEntity) {
        btnAddEntity.onclick = async () => {
            const nameValue = newEntityNameInput.value.trim()
            const descValue = newEntityDescInput
                ? newEntityDescInput.value.trim()
                : ''

            if (nameValue === '') {
                nameEmptyAddModal.classList.add('active')
                return
            }

            const body = {}
            body[entityNameKey] = nameValue
            body[entityDescKey] = descValue

            try {
                const res = await fetch(apiBaseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })

                const data = await res.json()

                if (!res.ok)
                    throw new Error(
                        data.message ||
                            data.error ||
                            `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                    )

                updateView(1)
                showToast(`Đã thêm ${entityName}`, 'success')

                const modalInstance = bootstrap.Modal.getInstance(addModal)
                modalInstance.hide()
            } catch (error) {
                if (error.message.includes(`Trùng tên`)) {
                    notUniqueAddModal.classList.add('active')
                    return
                }
                showToast(error.message, 'danger')
            }
        }
    }

    // Loại bỏ element thông báo invalid
    if (newEntityNameInput) {
        newEntityNameInput.oninput = () => {
            nameEmptyAddModal.classList.remove('active')
            notUniqueAddModal.classList.remove('active')
        }

        newEntityNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
                btnAddEntity.click()
            }
        })
    }

    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', () => {
            nameEmptyAddModal.classList.remove('active')
            notUniqueAddModal.classList.remove('active')
            newEntityNameInput.value = ''
            newEntityDescInput.value = ''
        })
    }

    // --- 2. SETUP UPDATE MODAL ---

    const updateModal = document.getElementById(modalUpdateId)
    if (!updateModal) return

    const btnUpdate = updateModal.querySelector('.btn-save-entity')
    const updateEntityNameInput =
        updateModal.querySelector('#entity-name-input')
    const updateEntityDescInput =
        updateModal.querySelector('#entity-desc-input')
    const nameEmptyUpdateModal = updateModal.querySelector('.empty-name')
    const notUniqueUpdateModal = updateModal.querySelector('.not-unique-name')

    // Hàm Hiển thị Modal Update
    async function showModalUpdate(btnUpdate) {
        const row = btnUpdate.closest('tr')
        const id = row.dataset.id

        try {
            const res = await fetch(`${apiBaseUrl}/${id}`, {
                method: 'GET',
            })
            const entity = await res.json()

            updateEntityNameInput.value = entity[entityNameKey]
            updateEntityDescInput.value = entity[entityDescKey]
            updateEntityNameInput.dataset.id = entity[entityIdKey]

            const modalInstance = bootstrap.Modal.getInstance(updateModal)
            if (modalInstance) {
                modalInstance.show()
            } else {
                const newInstance = new bootstrap.Modal(updateModal)
                newInstance.show()
            }
        } catch (error) {
            console.log(`Có lỗi khi hiện thông tin ${entityName}: ${error}`)
        }
    }

    // Logic nút Update
    if (btnUpdate) {
        btnUpdate.onclick = async () => {
            const nameValue = updateEntityNameInput.value.trim()
            const descValue = updateEntityDescInput.value.trim()

            if (nameValue === '') {
                nameEmptyUpdateModal.classList.add('active')
                return
            }

            const body = {}
            body[entityNameKey] = nameValue
            body[entityDescKey] = descValue

            try {
                const id = updateEntityNameInput.dataset.id
                const res = await fetch(`${apiBaseUrl}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })

                const data = await res.json()

                if (!res.ok)
                    throw new Error(
                        data.message ||
                            data.error ||
                            `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                    )

                const dataAttributeElement =
                    tableWrapper.querySelector('#data-attribute')
                const currentPage = dataAttributeElement.dataset.currentPage
                updateView(currentPage)
                showToast(`Đã cập nhật ${entityName}`, 'success')

                if (updateModal) {
                    const modalInstance =
                        bootstrap.Modal.getInstance(updateModal)
                    modalInstance.hide()
                }
            } catch (error) {
                if (error.message.includes('Trùng tên')) {
                    notUniqueUpdateModal.classList.add('active')
                    return
                }
                console.log(error)
                showToast(error.message, 'danger')
            }
        }
    }

    // Loại bỏ element thông báo invalid
    if (updateEntityNameInput) {
        updateEntityNameInput.oninput = () => {
            nameEmptyUpdateModal.classList.remove('active')
            notUniqueUpdateModal.classList.remove('active')
        }

        updateEntityNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
                btnUpdate.click()
            }
        })
    }

    updateModal.addEventListener('hidden.bs.modal', () => {
        nameEmptyUpdateModal.classList.remove('active')
        notUniqueUpdateModal.classList.remove('active')
        updateEntityNameInput.value = ''
        updateEntityDescInput.value = ''
    })

    // --- 3. LOGIC XỬ LÝ TABLE (DELETE, UPDATE, SORT) ---
    if (tableWrapper) {
        tableWrapper.onclick = async (event) => {
            // Delete
            const btnDelete = event.target.closest('.btn-delete-entity')
            if (btnDelete) {
                deleteEntity(btnDelete)
            }

            // Update
            const btnUpdate = event.target.closest('.btn-show-modal-update')
            if (btnUpdate) {
                await showModalUpdate(btnUpdate)
            }

            const sortableHeader = event.target.closest('tr i.sortable')
            if (sortableHeader) {
                sortData(sortableHeader)
            }
        }
    }

    // Hàm Delete chung
    async function deleteEntity(btnDelete) {
        const rowElement = btnDelete.closest('tr')
        const entityId = rowElement.dataset.id

        if (entityId) {
            try {
                const res = await fetch(`${apiBaseUrl}/${entityId}`, {
                    method: 'DELETE',
                })

                const data = await res.json()

                if (!res.ok)
                    throw new Error(
                        data.message ||
                            data.error ||
                            `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                    )

                const dataAttributeElement =
                    tableWrapper.querySelector('#data-attribute')
                let targetPage = dataAttributeElement.dataset.currentPage

                if (dataAttributeElement.dataset.totalItemPerPage < 2)
                    targetPage -= 1

                updateView(targetPage)
                showToast(`Đã xóa ${entityName}`, 'success')
            } catch (error) {
                showToast(error.message, 'danger')
            }
        }
    }

    // Hàm Update View (phân trang, sắp xếp)
    async function updateView(
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

            const res = await fetch(`${apiBaseUrl}/partials?${query}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(
                    data.message || `Lỗi không xác định: ${res.status}`
                )
            }

            if (tableWrapper) tableWrapper.innerHTML = data.table
            if (paginationWrapper) paginationWrapper.innerHTML = data.pagination

            updateSortIcon(sort, order)

            // Cập nhật lại URL trình duyệt mà kh reload trang
            if (shouldPushState || shouldReplaceState) {
                const currentUrl = new URL(window.location.href)
                currentUrl.search = ''
                currentUrl.searchParams.set('page', page)
                if (sort) currentUrl.searchParams.set('sort', sort)
                if (order) currentUrl.searchParams.set('order', order)
                if (keyword) currentUrl.searchParams.set('keyword', keyword)

                if (shouldReplaceState) {
                    history.replaceState(null, '', currentUrl.toString())
                } else {
                    history.pushState(null, '', currentUrl.toString())
                }
            }
        } catch (error) {
            showToast(error.message, 'danger')
        }
    }

    // Hàm Sort data và Update sort icon
    function sortData(currentHeader) {
        const sortableHeaders = tableWrapper.querySelectorAll('tr .sortable')
        // 1. Loại bỏ trạng thái sắp xếp của các cột khác (Đưa về icon mặc định)
        sortableHeaders.forEach((h) => {
            if (h !== currentHeader) {
                h.removeAttribute('data-order') // Xóa data-order để áp dụng CSS mặc định
            }
        })

        // 2. Chuyển đổi trạng thái sắp xếp của cột hiện tại
        let currentOrder = currentHeader.getAttribute('data-order')
        let newOrder

        if (currentOrder === 'asc') {
            newOrder = 'desc'
        } else if (currentOrder === 'desc') {
            newOrder = 'asc'
        } else {
            newOrder = 'desc'
        }

        currentHeader.setAttribute('data-order', newOrder)

        const currentPage =
            tableWrapper.querySelector('#data-attribute').dataset.currentPage
        const sort = currentHeader.dataset.sort

        const inputSearch = document.querySelector(
            '.manager-container .search-value'
        )
        let keyword = null
        if (inputSearch) keyword = inputSearch.value.trim()

        updateView(currentPage, sort, newOrder, keyword)
    }

    // Hàm tìm kiếm
    const btnSearch = document.querySelector(
        '.manager-container .search-button'
    )
    const inputSearch = document.querySelector(
        '.manager-container .search-value'
    )

    if (!btnSearch || !inputSearch) return

    btnSearch.onclick = () => {
        const keyword = inputSearch.value.trim()

        const sortableHeader = tableWrapper.querySelector(
            'tr i.sortable[data-order]'
        )
        let sort = null,
            order = null
        if (sortableHeader) {
            sort = sortableHeader.dataset.sort
            order = sortableHeader.dataset.order
        }
        updateView(1, sort, order, keyword)
    }

    inputSearch.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') btnSearch.click()
    })

    function updateSortIcon(sortKey, sortOrder) {
        const sortableHeaders = tableWrapper.querySelectorAll('tr i.sortable')
        sortableHeaders.forEach((h) => {
            if (h.dataset.sort === sortKey) {
                h.setAttribute('data-order', sortOrder)
                return
            }
        })
    }

    // --- 4. EXPORT EXCEL ---
    const btnExport = document.querySelector('.export-button')
    if (btnExport) {
        btnExport.onclick = async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/export`)
                if (!res.ok)
                    throw new Error(
                        `Lỗi HTTP ${res.status}: Không thể tải file.`
                    )

                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)

                const a = document.createElement('a')
                a.href = url

                const disposition = res.headers.get('content-disposition')
                let filename = 'DanhSachTheLoai.xlsx' // Tên mặc định
                if (disposition && disposition.indexOf('filename=') !== -1) {
                    // Cố gắng trích xuất tên file từ header (loại bỏ dấu nháy kép)
                    filename = disposition
                        .split('filename=')[1]
                        .replace(/"/g, '')
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


    // --- 4. XỬ LÝ TIẾN/LÙI TRÊN TRÌNH DUYỆT ---
    // Hàm xử lý sự kiện Back/Forward
    function handlePopState() {
        const urlParams = new URLSearchParams(window.location.search)

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        const currentPage = page ? Number(page) : 1

        updateView(currentPage, sort, order, keyword, false)
    }

    // Hàm Khởi tạo trạng thái ban đầu (LOAD TRANG)
    function loadInitialState() {
        const urlParams = new URLSearchParams(window.location.search)

        const page = urlParams.get('page')
        const sort = urlParams.get('sort')
        const order = urlParams.get('order')
        const keyword = urlParams.get('keyword')

        // Cập nhật ô input tìm kiếm
        if (inputSearch && keyword) {
            inputSearch.value = keyword
        }

        const currentPage = page ? Number(page) : 1

        // Gọi updateView lần đầu tiên
        // Không cần đẩy trạng thái, hoặc để mặc định là true để chuẩn hóa URL
        updateView(currentPage, sort, order, keyword, false, true)
    }

    window.addEventListener('popstate', handlePopState)

    loadInitialState()
}
