import showToast from './toast.js'
const tbodyElement = document.querySelector('.category-table tbody')

// Hanlde thêm thể loại và ẩn/hiện modal
const addModal = document.querySelector('#add-category-modal')
const btnAddCategory = addModal.querySelector('.btn-add-category-name')
const nameEmptyAddModal = addModal.querySelector('.empty-name')
const notUniqueAddModal = addModal.querySelector('.not-unique-name')
const newDescriptionElement = addModal.querySelector('#new-category-desc')
const newCategoryNameElement = addModal.querySelector('#new-category-name')

if (btnAddCategory) {
    btnAddCategory.onclick = async () => {
        const TenTL = newCategoryNameElement.value.trim()
        const MoTa = newDescriptionElement.value.trim()

        if (TenTL === '') {
            nameEmptyAddModal.classList.add('active')
            return
        }

        try {
            const isUnique = await checkUnique(TenTL)

            if (!isUnique) {
                notUniqueAddModal.classList.add('active')
                return
            }

            const res = await fetch('/api/category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ TenTL, MoTa }),
            })

            const data = await res.json()

            if (!res.ok)
                throw new Error(
                    data.message ||
                        data.error ||
                        `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                )

            updateTableAfterAdd(data)
            showToast('Đã thêm thể loại', 'success')

            if (addModal) {
                const modalInstance = bootstrap.Modal.getInstance(addModal)
                modalInstance.hide()
            }
        } catch (error) {
            showToast(error.message, 'danger')
        }
    }
}

async function checkUnique(TenTL) {
    try {
        if (TenTL !== '') {
            const res = await fetch(
                `/api/category/check-unique?name=${TenTL}`,
                { method: 'GET' }
            )
            const data = await res.json()

            return data.isUnique
        }
    } catch (error) {
        console.log('Lỗi khi thêm thể loại:' + error)
    }
}

function updateTableAfterAdd(category) {
    if (!tbodyElement) return

    const noDataElement = tbodyElement.querySelector('.no-data')

    if (noDataElement) {
        noDataElement.remove()
    }

    const STT = tbodyElement.querySelectorAll('tr').length
    const newRow = document.createElement('tr')
    newRow.dataset.id = category.MaTL

    newRow.innerHTML = `
        <td class="stt">
            ${STT + 1}
        </td>
        <td class="name">
            ${category.TenTL}
        </td>
        <td class="desc">
            ${category.MoTa}
        </td>
        <td>    
            <button class="btn btn-sm btn-info me-2 btn-show-update-category">
                <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-delete-category">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `

    tbodyElement.appendChild(newRow)
}

if (newCategoryNameElement) {
    newCategoryNameElement.oninput = () => {
        nameEmptyAddModal.classList.remove('active')
        notUniqueAddModal.classList.remove('active')
    }

    newCategoryNameElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            btnAddCategory.click()
        }
    })
}

if (addModal) {
    addModal.addEventListener('hidden.bs.modal', () => {
        nameEmptyAddModal.classList.remove('active')
        notUniqueAddModal.classList.remove('active')
        newCategoryNameElement.value = ''
        newDescriptionElement.value = ''
    })
}

// Hanlde xóa, sửa thể loại   -- Chưa kiểm tra sách còn tham chiếu
const updateModal = document.querySelector('#update-category-modal')

if (tbodyElement) {
    tbodyElement.onclick = async (event) => {
        // Xóa thể loại
        const btnDelete = event.target.closest('.btn-delete-category')
        if (btnDelete) {
            deleteCategory(btnDelete)
        }

        const btnUpdate = event.target.closest('.btn-show-update-category')
        if (btnUpdate) {
            await showModalUpdate(btnUpdate)
        }
    }
}

async function deleteCategory(btnDelete) {
    const rowElement = btnDelete.parentElement.parentElement
    const MaTL = rowElement.dataset.id
    if (MaTL) {
        try {
            const res = await fetch('/api/category/' + MaTL, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (!res.ok)
                throw new Error(
                    data.message ||
                        data.error ||
                        `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                )

            rowElement.remove()
            updateSTT('.category-table tbody')
            showToast('Đã xóa thể loại', 'success')

        } catch (error) {
            showToast(error.message, 'danger')
        }
    }
}

function updateSTT() {
    if (!tbodyElement) return

    const rows = tbodyElement.querySelectorAll('tr')

    if (rows.length === 0) {
        const noDataElement = document.createElement('tr')
        noDataElement.classList.add('no-data')

        noDataElement.innerHTML = `
            <tr class="no-data">
                <td colspan="4" class="text-center">
                    Không có dữ liệu...
                </td>
            </tr>
        `
        tbodyElement.appendChild(noDataElement)
        return
    }

    rows.forEach((row, index) => {
        const sttCell = row.querySelector('td:first-child')
        if (!sttCell) return
        sttCell.textContent = index + 1
    })
}

async function showModalUpdate(btnUpdate) {
    const row = btnUpdate.parentElement.parentElement
    const id = row.dataset.id

    try {
        const res = await fetch(`/api/category/${id}`, { method: 'GET' })
        const category = await res.json()

        if (!res.ok)
            throw new Error(
                data.message ||
                    data.error ||
                    `Lỗi HTTP ${res.status}: Thao tác thất bại.`
            )

        updateNameElement.value = category.TenTL
        updateDescElement.value = category.MoTa
        updateNameElement.dataset.originalName = category.TenTL
        updateNameElement.dataset.id = category.MaTL

        if (updateModal) {
            const modalInstance = bootstrap.Modal.getInstance(updateModal)
            if (modalInstance) {
                modalInstance.show()
            } else {
                const newInstance = new bootstrap.Modal(updateModal)
                newInstance.show()
            }
        }
    } catch (error) {
        console.log('Có lỗi khi hiện thông tin thể loại: ' + error)
    }
}

// Chỉnh sửa thể loại
const btnUpdate = updateModal.querySelector('.btn-update-category-name')
const updateNameElement = updateModal.querySelector('#update-category-name')
const updateDescElement = updateModal.querySelector('#update-category-desc')
const nameEmptyUpdateModal = updateModal.querySelector('.empty-name')
const notUniqueUpdateModal = updateModal.querySelector('.not-unique-name')

if (btnUpdate) {
    btnUpdate.onclick = async () => {
        const TenTL = updateNameElement.value.trim()
        const MoTa = updateDescElement.value.trim()

        if (TenTL === '') {
            nameEmptyUpdateModal.classList.add('active')
            return
        }

        try {
            const originalName = updateNameElement.dataset.originalName
            const id = updateNameElement.dataset.id

            if (TenTL !== originalName) {
                const isUnique = await checkUnique(TenTL)

                if (!isUnique) {
                    notUniqueUpdateModal.classList.add('active')
                    return
                }
            }

            const res = await fetch(`/api/category/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ TenTL, MoTa }),
            })

            const data = await res.json()

            if (!res.ok)
                throw new Error(
                    data.message ||
                        data.error ||
                        `Lỗi HTTP ${res.status}: Thao tác thất bại.`
                )

            updateTableAfterUpdate(data)
            showToast('Đã cập nhật thể loại', 'success')

            if (updateModal) {
                const modalInstance = bootstrap.Modal.getInstance(updateModal)
                modalInstance.hide()
            }
        } catch (error) {
            showToast(error.message, 'danger')
        }
    }
}

function updateTableAfterUpdate(category) {
    const row = tbodyElement.querySelector(`tr[data-id="${category.MaTL}"]`)
    row.querySelector('.name').textContent = category.TenTL
    row.querySelector('.desc').textContent = category.MoTa
}


if (updateNameElement) {
    updateNameElement.oninput = () => {
        nameEmptyUpdateModal.classList.remove('active')
        notUniqueUpdateModal.classList.remove('active')
    }

    updateNameElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            btnUpdate.click()
        }
    })
}

if (updateModal) {
    updateModal.addEventListener('hidden.bs.modal', () => {
        nameEmptyUpdateModal.classList.remove('active')
        notUniqueUpdateModal.classList.remove('active')
        updateNameElement.value = ''
        updateDescElement.value = ''
    })
}
