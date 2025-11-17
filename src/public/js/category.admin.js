const btnThemTL = document.querySelector('.btn-them')
const listTL = document.querySelector('.list-the-loai')
let btnXoaTL = document.querySelectorAll('.btn-xoa')
let btnSuaTL = document.querySelectorAll('.btn-sua')

btnThemTL.onclick = async () => {
    const TenTL = document.querySelector('#ten-tl').value.trim()
    const GhiChu = document.querySelector('#ghi-chu').value.trim()

    if (TenTL === '') {
        alert('Vui lòng nhập tên thể loại!')
        return
    }

    try {
        const res = await fetch('/api/category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ TenTL, GhiChu }),
        })

        if (res.ok) {
            const theLoai = await res.json()
            document.querySelector('#ten-tl').value = ''
            document.querySelector('#ghi-chu').value = ''
            renderAfterAdd(theLoai)
        }
    } catch (error) {
        alert('Lỗi' + error)
    }
}

btnXoaTL.forEach((btn) => {
    btn.onclick = async () => {
        try {
            const id = btn.dataset.id
            const res = await fetch('/api/category/' + id, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            })

            if (res.ok) {
                renderAfterDelete(btn)
            }
        } catch (error) {
            alert('Lỗi' + error)
        }
    }
})



function renderAfterAdd(theLoai) {
    const newLi = document.createElement('li')
    newLi.innerHTML = ` 
        <h4>Tên thể loại: ${theLoai.TenTL}</h4>
        <h4>Ghi chú: ${theLoai.GhiChu}</h4>
        <button class="btn-xoa" data-id="${theLoai.MaTL}">Xóa</button>
        <button class="btn-sua" data-id="${theLoai.MaTL}" 
                data-ten="${theLoai.TenTL}" 
                data-ghichu="${theLoai.GhiChu}">Sửa</button> 
    `
    listTL.appendChild(newLi)
    btnXoaTL = document.querySelectorAll('.btn-xoa')
    btnSuaTL = document.querySelectorAll('.btn-sua')
}

function renderAfterDelete(btn) {
    const li = btn.parentElement
    listTL.removeChild(li)
}