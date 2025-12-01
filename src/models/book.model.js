import pool from '../configs/db.js'

const BookModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM Sach')
        return rows
    },

    async getById(id) {
        const [rows] = await pool.query(`
            SELECT s.*, tg.TenTG, tl.TenTL, nxb.TenNXB
            FROM Sach s
            LEFT JOIN TacGia tg ON s.MaTG = tg.MaTG
            LEFT JOIN TheLoai tl ON s.MaTL = tl.MaTL
            LEFT JOIN NhaXuatBan nxb ON s.MaNXB = nxb.MaNXB
            WHERE MaSach = ?
        `, [id])
        return rows[0] || null
    },

    async getByISBN(isdn) {
        const [rows] = await pool.query('SELECT * FROM Sach WHERE ISBN = ?', [isdn])
        return rows[0] || null
    },

    async getOtherByISBN(MaSach, isbn) {
        const [rows] = await pool.query('SELECT * FROM Sach WHERE MaSach <> ? and ISBN = ?', [MaSach, isbn])
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

    async getWithParam(limit, offset, sortBy = 'MaSach', sortOrder = 'DESC', keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [rows] = await pool.query(
            `SELECT * FROM Sach
            JOIN TacGia on Sach.MaTG = TacGia.MaTG
            JOIN TheLoai on Sach.MaTL = TheLoai.MaTL
            JOIN NhaXuatBan on Sach.MaNXB = NhaXuatBan.MaNXB
            WHERE TenSach LIKE ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [searchKeyword, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [result] = await pool.query(
            'SELECT COUNT(*) AS total FROM Sach WHERE TenSach LIKE ?', [searchKeyword]
        )
        return result[0].total
    },

    async create({ TenSach, MaTG, MaNXB, MaTL, DonGia, ISBN, MoTa, uploadResult }) {
        const HinhAnh = uploadResult ? uploadResult.url : null
        const hinhAnhId = uploadResult ? uploadResult.publicId : null;

        const [result] = await pool.query(
            `INSERT INTO Sach (TenSach, ISBN, MaTG, MaNXB, MaTL, DonGia, HinhAnh, HinhAnhID, MoTa)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [TenSach, ISBN, MaTG, MaNXB, MaTL, DonGia, HinhAnh, hinhAnhId, MoTa]
        )
        return result.insertId
    },

    async update(id, { TenSach, ISBN, MaTG, MaNXB, MaTL, DonGia, MoTa }) {
        const [result] = await pool.query(
            `UPDATE Sach 
             SET TenSach = ?, ISBN = ?, MaTG = ?, MaNXB = ?, MaTL = ?, DonGia = ?, MoTa = ?
             WHERE MaSach = ?`,
            [TenSach, ISBN, MaTG, MaNXB, MaTL, DonGia, MoTa, id]
        )
        return result.affectedRows > 0
    },

    async updateImage(id, uploadResult) {
        const HinhAnh = uploadResult ? uploadResult.url : null
        const hinhAnhID = uploadResult ? uploadResult.publicId : null;
        const [result] = await pool.query(
            `UPDATE Sach 
             SET HinhAnh = ?, HinhAnhID = ?
             WHERE MaSach = ?`,
            [HinhAnh, hinhAnhID, id]
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

    async countByCategory(MaTL) {
        const [result] = await pool.query('SELECT COUNT(*) AS bookCount FROM Sach WHERE MaTL = ?', [MaTL])
        return result[0].bookCount
    },

    async countByAuthor(MaTG) {
        const [result] = await pool.query('SELECT COUNT(*) AS bookCount FROM Sach WHERE MaTG = ?', [MaTG])
        return result[0].bookCount
    },

    async countByPublisher(MaNXB) {
        const [result] = await pool.query('SELECT COUNT(*) AS bookCount FROM Sach WHERE MaNXB = ?', [MaNXB])
        return result[0].bookCount
    },
}

export default BookModel