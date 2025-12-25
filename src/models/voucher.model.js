import pool from '../configs/db.js'

const VoucherModel = {
    async getWithParam(limit, offset, sortBy = 'MaVC', sortOrder = 'DESC', keyword = '', status = '') {
        const searchKeyword = `%${keyword}%`
        const TrangThai = `%${status}%`

        const [rows] = await pool.query(`SELECT * FROM Voucher WHERE MaVC LIKE ? AND TrangThai like ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`, [searchKeyword, TrangThai, limit, offset])
        return rows
    },

    async getTotal(keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [result] = await pool.query('SELECT COUNT(*) AS total FROM Voucher WHERE MaVC LIKE ?', [searchKeyword])
        return result[0].total
    },

    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM Voucher WHERE MaVC = ?', [id])
        return rows[0] || null
    },

    async update(id, { SoLuong, NgayKT, TrangThai }) {
        const [result] = await pool.query(
            `UPDATE Voucher SET SoLuong = ?, NgayKT = ?, TrangThai = ?
            WHERE MaVC = ?`,
            [SoLuong, NgayKT, TrangThai, id]
        )
        return result.affectedRows > 0
    },

    async create({ MaVC, SoLuong, NgayBD, NgayKT, LoaiVC, GiaTriGiam, SoTienGiamMax, DKTongTien }) {
        const [result] = await pool.query(
            `INSERT INTO Voucher(MaVC, SoLuong, NgayBD, NgayKT, LoaiVC, GiaTriGiam, SoTienGiamMax, DKTongTien) 
            values (?,?,?,?,?,?,?,?)`,
            [MaVC, SoLuong, NgayBD, NgayKT, LoaiVC, GiaTriGiam, SoTienGiamMax, DKTongTien]
        )
        return result.insertId
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM Voucher WHERE MaVC = ?', [id])
        return result.affectedRows > 0
    },

    async updateExpiredVouchers() {
        const [result] = await pool.query(
            `UPDATE Voucher 
            SET TrangThai = 'VO_HIEU' 
            WHERE NgayKT < NOW() AND TrangThai = 'HOAT_DONG'`
        )
        return result.affectedRows
    },
}

export default VoucherModel
