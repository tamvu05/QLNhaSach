import pool from '../configs/db.js'

const SupplierModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM NhaCungCap')
        return rows
    },

    async getWithParam(
        limit,
        offset,
        sortBy = 'MaNCC',
        sortOrder = 'DESC',
        keyword = ''
    ) {
        const searchKeyword = `%${keyword}%`
        const [rows] = await pool.query(
            `SELECT * FROM NhaCungCap WHERE TenNCC LIKE ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [searchKeyword, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [result] = await pool.query(
            'SELECT COUNT(*) AS total FROM NhaCungCap WHERE TenNCC LIKE ?',
            [searchKeyword]
        )
        return result[0].total
    },

    async getById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM NhaCungCap WHERE MaNCC = ?',
            [id]
        )
        return rows[0] || null
    },

    async update(id, { TenNCC, DiaChi, SDT }) {
        const [result] = await pool.query(
            'UPDATE NhaCungCap SET TenNCC = ?, DiaChi = ?, SDT = ? WHERE MaNCC = ?',
            [TenNCC, DiaChi, SDT, id]
        )
        return result.affectedRows > 0
    },

    async create({ TenNCC, DiaChi, SDT }) {
        const [result] = await pool.query(
            'INSERT INTO NhaCungCap (TenNCC, DiaChi, SDT) VALUES (?, ?, ?)',
            [TenNCC, DiaChi, SDT]
        )
        return result.insertId
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM NhaCungCap WHERE MaNCC = ?', [id])
        return result.affectedRows > 0
    },
}

export default SupplierModel
