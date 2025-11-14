import pool from '../configs/db.js'

const NhaXuatBanModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM NhaXuatBan')
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM NhaXuatBan WHERE MaNXB = ?', [id])
        return rows[0] || null
    },

    async create({ TenNXB, DiaChi, Email, SDT }) {
        const [result] = await pool.query('INSERT INTO NhaXuatBan (TenNXB, DiaChi, Email, SDT) VALUES (?, ?, ?, ?)', [TenNXB, DiaChi, Email, SDT])
        return result.insertId
    },

    async update(id, { TenNXB, DiaChi, Email, SDT }) {
        const [result] = await pool.query('UPDATE NhaXuatBan SET TenNXB = ?, DiaChi = ?, Email = ?, SDT = ? WHERE MaNXB = ?', [TenNXB, DiaChi, Email, SDT, id])
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM NhaXuatBan WHERE MaNXB = ?', [id])
        return result.affectedRows > 0
    },
}

export default NhaXuatBanModel
