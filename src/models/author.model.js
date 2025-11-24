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

    async create({ TenTG, MoTa }) {
        const [result] = await pool.query('INSERT INTO TacGia (TenTG, MoTa) VALUES (?, ?)', [TenTG, MoTa])
        return result.insertId
    },

    async update(id, { TenTG, MoTa }) {
        const [result] = await pool.query('UPDATE TacGia SET TenTG = ?, MoTa = ? WHERE MaTG = ?', [TenTG, MoTa, id])
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM TacGia WHERE MaTG = ?', [id])
        return result.affectedRows > 0
    },

    async getWithParam(limit, offset, sortBy = 'MaTG', sortOrder = 'DESC') {
        const [rows] = await pool.query(
            `SELECT * FROM TacGia ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [limit, offset]
        )
        return rows
    },

    async getTotal() {
        const [result] = await pool.query(
            'SELECT COUNT(*) AS total FROM TacGia'
        )
        return result[0].total
    },
}

export default AuthorModel