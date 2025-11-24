import XLSX from 'xlsx'

/**
 * 
 * @param {Array<Object>} data - Mảng các đối tượng
 * @returns 
 */

function exportFileExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Thể loại')

    const fileBuffer = XLSX.write(wb, {
        type: 'buffer',
        bookType: 'xlsx'
    })
    
    return fileBuffer;
}

export default exportFileExcel