import pool from '../configs/db.js'

const AuthorModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM TacGia')
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM TacGia WHERE MaTG = ?', [id])
        return rows[0] || null
    },

    async create({ TenTG, GhiChu }) {
        const [result] = await pool.query('INSERT INTO TacGia (TenTG, GhiChu) VALUES (?, ?)', [TenTG, GhiChu])
        return result.insertId
    },

    async update(id, { TenTG, GhiChu }) {
        const [result] = await pool.query('UPDATE TacGia SET TenTG = ?, GhiChu = ? WHERE MaTG = ?', [TenTG, GhiChu, id])
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM TacGia WHERE MaTG = ?', [id])
        return result.affectedRows > 0
    },
}

export default AuthorModel