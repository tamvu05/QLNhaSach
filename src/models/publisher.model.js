import pool from '../configs/db.js'

const PublisherBanModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM NhaXuatBan')
        return rows
    },

    async getWithParam(limit, offset, sortBy = 'MaNXB', sortOrder = 'DESC', keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [rows] = await pool.query(
            `SELECT * FROM NhaXuatBan WHERE TenNXB LIKE ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [searchKeyword, limit, offset]
        )
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM NhaXuatBan WHERE MaNXB = ?', [id])
        return rows[0] || null
    },

    async getTotal(keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [result] = await pool.query(
            'SELECT COUNT(*) AS total FROM NhaXuatBan WHERE TenNXB LIKE ?', [searchKeyword]
        )
        return result[0].total
    },

    async getByName(TenNXB) {
        const [rows] = await pool.query(
            'SELECT * FROM NhaXuatBan WHERE TenNXB like ?',
            [TenNXB]
        )
        return rows[0] || null
    },

    async getOtherByName(TenNXB, MaNXB) {
        const [rows] = await pool.query(
            'SELECT * FROM NhaXuatBan WHERE TenNXB like ? and MaNXB <> ?',
            [TenNXB, MaNXB]
        )
        return rows[0] || null
    },

    async create({ TenNXB, MoTa }) {
        const [result] = await pool.query('INSERT INTO NhaXuatBan (TenNXB, MoTa) VALUES (?, ?)', [TenNXB, MoTa])
        return result.insertId
    },

    async update(id, { TenNXB, MoTa }) {
        const [result] = await pool.query('UPDATE NhaXuatBan SET TenNXB = ?, MoTa = ? WHERE MaNXB = ?', [TenNXB, MoTa, id])
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM NhaXuatBan WHERE MaNXB = ?', [id])
        return result.affectedRows > 0
    },
}

export default PublisherBanModel
