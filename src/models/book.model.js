import pool from '../configs/db.js'

const BookModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM Sach')
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM Sach WHERE MaSach = ?', [id])
        return rows[0] || null
    },

    async getWithDetails() {
        const [rows] = await pool.query(`
            SELECT s.*, tg.TenTG, tl.TenTL, nxb.TenNXB
            FROM Sach s
            LEFT JOIN TacGia tg ON s.MaTG = tg.MaTG
            LEFT JOIN TheLoai tl ON s.MaTL = tl.MaTL
            LEFT JOIN NhaXuatBan nxb ON s.MaNXB = nxb.MaNXB
        `)
        return rows
    },

    async create({ TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon }) {
        const [result] = await pool.query(
            `INSERT INTO Sach (TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon]
        )
        return result.insertId
    },

    async update(id, { TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon }) {
        const [result] = await pool.query(
            `UPDATE Sach 
             SET TenSach = ?, MaTG = ?, MaNXB = ?, MaTL = ?, DonGia = ?, SoLuongTon = ?
             WHERE MaSach = ?`,
            [TenSach, MaTG, MaNXB, MaTL, DonGia, SoLuongTon, id]
        )
        return result.affectedRows > 0
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM Sach WHERE MaSach = ?', [id])
        return result.affectedRows > 0
    },

    async updateStock(id, amount) {
        const [result] = await pool.query('UPDATE Sach SET SoLuongTon = SoLuongTon + ? WHERE MaSach = ?', [amount, id])
        return result.affectedRows > 0
    },
}

export default BookModel