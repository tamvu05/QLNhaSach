import pool from '../configs/db.js'

const OrderModel = {
    async getWithParam(limit, offset, sortBy = 'MaDH', sortOrder = 'DESC', keyword = '', status = '') {
        const SDT = `%${keyword}%`
        const TrangThai = `%${status}%`

        const [rows] = await pool.query(
            `SELECT *
            FROM DonHang
            WHERE SDT like ? AND TrangThai like ? AND TrangThai IN ('CHO_XAC_NHAN', 'DANG_CHUAN_BI_HANG', 'DA_GIAO_CHO_DON_VI_VAN_CHUYEN')
            ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [SDT, TrangThai, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '') {
        const SDT = `%${keyword}%`
        const [result] = await pool.query(
            `SELECT COUNT(*) AS total
            FROM DonHang
            WHERE SDT like ? AND TrangThai IN ('CHO_XAC_NHAN', 'DANG_CHUAN_BI_HANG', 'DA_GIAO_CHO_DON_VI_VAN_CHUYEN')`,
            [SDT]
        )
        return result[0].total
    },

    async getById(id) {
        const [rows] = await pool.query(
            `SELECT *
            FROM DonHang
            WHERE MaDH = ?`,
            [id]
        )
        return rows[0] || null
    },

    async getDetailById(id) {
        const [rows] = await pool.query(
            `SELECT s.TenSach , ct.SoLuong , ct.DonGia , dh.TongTien, s.MaSach
            FROM DonHang dh
            JOIN CTDonHang ct  ON dh.MaDH = ct.MaDH 
            JOIN Sach s ON ct.MaSach  = s.MaSach 
            WHERE dh.MaDH = ?`,
            [id]
        )
        return rows
    },

    async updateState(id, TrangThai = 'CHO_XAC_NHAN') {
        const [result] = await pool.query('UPDATE DonHang SET TrangThai = ? WHERE MaDH = ?', [TrangThai, id])
        return result.affectedRows > 0
    },

    async updateInvoiceDate(id, date) {
        const [result] = await pool.query('UPDATE DonHang SET NgayTaoHoaDon = ? WHERE MaDH = ?', [date, id])
        return result.affectedRows > 0
    },

    async delete(id) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const details = await this.getDetailById(id)

            await connection.query('DELETE FROM CTDonHang WHERE MaDH = ?', [id])

            const stockUpdatePromises = details.map((detail) => {
                return connection.query('UPDATE Sach SET SoLuongTon = SoLuongTon + ? WHERE MaSach = ?', [detail.SoLuong, detail.MaSach])
            })

            const deleteOrder = connection.query('DELETE FROM DonHang WHERE MaDH = ?', [id])

            // chạy song song
            await Promise.all([...stockUpdatePromises, deleteOrder])
            await connection.commit()

            return true
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },
}

export default OrderModel
