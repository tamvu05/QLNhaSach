import pool from '../configs/db.js'

const CategoryModel = {
    async getTotal(keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [result] = await pool.query(
            'SELECT COUNT(*) AS total FROM TheLoai WHERE TenTL LIKE ?', [searchKeyword]
        )
        return result[0].total
    },

    async getAll() {
        const [rows] = await pool.query('SELECT * FROM TheLoai')
        return rows
    },

    async getWithParam(limit, offset, sortBy = 'MaTL', sortOrder = 'DESC', keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [rows] = await pool.query(
            `SELECT * FROM TheLoai WHERE TenTL LIKE ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [searchKeyword, limit, offset]
        )
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM TheLoai WHERE MaTL = ?',
            [id]
        )
        return rows[0] || null
    },

    async create({ TenTL, MoTa }) {
        const [result] = await pool.query(
            'INSERT INTO TheLoai (TenTL, MoTa) VALUES (?, ?)',
            [TenTL, MoTa]
        )
        return result.insertId
    },

    async update(id, { TenTL, MoTa }) {
        const [result] = await pool.query(
            'UPDATE TheLoai SET TenTL = ?, MoTa = ? WHERE MaTL = ?',
            [TenTL, MoTa, id]
        )
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query(
            'DELETE FROM TheLoai WHERE MaTL = ?',
            [id]
        )
        return result.affectedRows > 0
    },

    async getByName(TenTL) {
        const [rows] = await pool.query(
            'SELECT * FROM TheLoai WHERE TenTL like ?',
            [TenTL]
        )
        return rows[0] || null
    },

    async getOtherByName(TenTL, MaTL) {
        const [rows] = await pool.query(
            'SELECT * FROM TheLoai WHERE TenTL like ? and MaTL <> ?',
            [TenTL, MaTL]
        )
        return rows[0] || null
    },
}

export default CategoryModel
