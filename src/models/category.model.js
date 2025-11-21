import pool from '../configs/db.js'

const CategoryModel = {
    async getTotal() {
        const [result] = await pool.query('SELECT COUNT(*) AS total FROM TheLoai')
        return result[0].total
    },

    async getAll(limit, offset) {
        const [rows] = await pool.query('SELECT * FROM TheLoai LIMIT ? OFFSET ?', [limit, offset])
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM TheLoai WHERE MaTL = ?', [id])
        return rows[0] || null
    },

    async create({ TenTL, MoTa }) {
        const [result] = await pool.query('INSERT INTO TheLoai (TenTL, MoTa) VALUES (?, ?)', [TenTL, MoTa])
        return result.insertId
    },

    async update(id, { TenTL, MoTa }) {
        const [result] = await pool.query('UPDATE TheLoai SET TenTL = ?, MoTa = ? WHERE MaTL = ?', [TenTL, MoTa, id])
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM TheLoai WHERE MaTL = ?', [id])
        return result.affectedRows > 0
    },

    async getByName(TenTL) {
        const [rows] = await pool.query('SELECT * FROM TheLoai WHERE TenTL like ?', [TenTL])
        return rows[0] || null
    }
}

export default CategoryModel