import pool from '../configs/db.js'

const CategoryModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM TheLoai')
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM TheLoai WHERE MaTL = ?', [id])
        return rows[0] || null
    },

    async create({ TenTL, GhiChu }) {
        const [result] = await pool.query('INSERT INTO TheLoai (TenTL, GhiChu) VALUES (?, ?)', [TenTL, GhiChu])
        return result.insertId
    },

    async update(id, { TenTL, GhiChu }) {
        const [result] = await pool.query('UPDATE TheLoai SET TenTL = ?, GhiChu = ? WHERE MaTL = ?', [TenTL, GhiChu, id])
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM TheLoai WHERE MaTL = ?', [id])
        return result.affectedRows > 0
    },
}

export default CategoryModel