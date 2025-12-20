import pool from '../configs/db.js'

const ImportReceiptModel = {
    async getWithParam(limit, offset, sortBy = 'MaPN', sortOrder = 'DESC', keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [rows] = await pool.query(
            `SELECT MaPN, NgayNhap, TenNCC, HoTen, NhaCungCap.SDT, NhanVien.MaNV, NhaCungCap.MaNCC, NoiDung
            FROM PhieuNhap 
            LEFT JOIN NhaCungCap on PhieuNhap.MaNCC = NhaCungCap.MaNCC
            LEFT JOIN NhanVien on PhieuNhap.MaNV = NhanVien.MaNV
            WHERE TenNCC LIKE ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [searchKeyword, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [result] = await pool.query(
            `SELECT COUNT(*) AS total FROM PhieuNhap 
            LEFT JOIN NhaCungCap on PhieuNhap.MaNCC = NhaCungCap.MaNCC
            LEFT JOIN NhanVien on PhieuNhap.MaNV = NhanVien.MaNV
            WHERE TenNCC LIKE ?`,
            [searchKeyword]
        )
        return result[0].total
    },

    async getById(id) {
        const [rows] = await pool.query(
            `
            SELECT NgayNhap, TenNCC, HoTen, NoiDung
            FROM PhieuNhap pn
            JOIN NhaCungCap ncc on pn.MaNCC = ncc.MaNCC
            JOIN NhanVien nv on pn.MaNV = nv.MaNV
            WHERE pn.MaPN = ?`,
            [id]
        )
        return rows[0] || null
    },

    async getDetailById(id) {
        const [rows] = await pool.query(
            `
           SELECT TenSach, SoLuong, DonGiaNhap
            FROM PhieuNhap pn
            JOIN CTPhieuNhap ctpn on pn.MaPN = ctpn.MaPN
            JOIN Sach s on ctpn.MaSach = s.MaSach
            WHERE pn.MaPN = ?`,
            [id]
        )
        return rows
    },

    async hasSupplier(id) {
        const [rows] = await pool.query('SELECT * FROM PhieuNhap WHERE MaNCC = ? LIMIT 1', [id])
        return rows[0] || null
    },

    async create({ MaNCC, MaNV, NgayNhap, NoiDung, ChiTietPN }) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [result] = await connection.query('INSERT INTO PhieuNhap(MaNCC, MaNV, NgayNhap, NoiDung) VALUES (?, ?, ?, ?)', [MaNCC, MaNV, NgayNhap, NoiDung])

            const MaPN = result.insertId

            const detailPromise = ChiTietPN.map(async (chiTiet) => {
                const insertCTPromise = connection.query(`INSERT INTO CTPhieuNhap(MaPN, MaSach, SoLuong, DonGiaNhap) VALUES (?, ?, ?, ?)`, [MaPN, chiTiet.MaSach, chiTiet.SoLuong, chiTiet.DonGia])

                const updateSachPromise = connection.query('UPDATE Sach SET SoLuongTon = SoLuongTon + ? WHERE MaSach = ?', [chiTiet.SoLuong, chiTiet.MaSach])

                await Promise.all([insertCTPromise, updateSachPromise])
                return true
            })

            await Promise.all(detailPromise)

            await connection.commit()

            return MaPN
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },

    async existBook(id) {
        const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM CTPhieuNhap WHERE MaSach = ? LIMIT 1`, [id])

        return rows[0].count > 0
    },
}

export default ImportReceiptModel
