import pool from '../configs/db.js'

const ExportReceiptModel = {
    async getWithParam(
        limit,
        offset,
        sortBy = 'MaPX',
        sortOrder = 'DESC',
        keyword = ''
    ) {
        const searchKeyword = `%${keyword}%`    
        const [rows] = await pool.query(
            `SELECT MaPX, NgayXuat, HoTen, NhanVien.MaNV, NoiDung
            FROM PhieuXuat
            LEFT JOIN NhanVien on PhieuXuat.MaNV = NhanVien.MaNV
            WHERE HoTen LIKE ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [searchKeyword, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '') {
        const searchKeyword = `%${keyword}%`
        const [result] = await pool.query(
            `SELECT COUNT(*) AS total
            FROM PhieuXuat
            LEFT JOIN NhanVien on PhieuXuat.MaNV = NhanVien.MaNV
            WHERE HoTen LIKE ?`,
            [searchKeyword]
        )
        return result[0].total
    },

    async getById(id) {
        const [rows] = await pool.query(
            `SELECT MaPX, NgayXuat, HoTen, NhanVien.MaNV, NoiDung
            FROM PhieuXuat
            LEFT JOIN NhanVien on PhieuXuat.MaNV = NhanVien.MaNV
            WHERE PhieuXuat.MaPX = ?`,
            [id]
        )
        return rows[0] || null
    },

    async getDetailById(id) {
        const [rows] = await pool.query(
            `SELECT TenSach, SoLuong, DonGiaXuat
            FROM PhieuXuat px
            JOIN CTPhieuXuat ctpx on ctpx.MaPX = px.MaPX
            JOIN Sach s on ctpx.MaSach = s.MaSach
            WHERE px.MaPX = ?`,
            [id]
        )
        return rows
    },

    async create({MaNV, NgayXuat, NoiDung, ChiTietPX }) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [result] = await connection.query(
                'INSERT INTO PhieuXuat(MaNV, NgayXuat, NoiDung) VALUES (?, ?, ?)',
                [MaNV, NgayXuat, NoiDung]
            )

            const MaPX = result.insertId

            const detailPromise = ChiTietPX.map(async (chiTiet) => {
                const insertCTPromise = connection.query(
                    `INSERT INTO CTPhieuXuat(MaPX, MaSach, SoLuong, DonGiaXuat) VALUES (?, ?, ?, ?)`,
                    [MaPX, chiTiet.MaSach, chiTiet.SoLuong, chiTiet.DonGia]
                )

                const updateSachPromise = connection.query(
                    'UPDATE Sach SET SoLuongTon = SoLuongTon - ? WHERE MaSach = ?',
                    [chiTiet.SoLuong, chiTiet.MaSach]
                )

                await Promise.all([insertCTPromise, updateSachPromise])
                return true
            })

            await Promise.all(detailPromise)

            await connection.commit()

            return MaPX
        } catch (error) {
            await connection.rollback()
            throw error 
        } finally {
            connection.release()
        }
    },

    async existBook(id) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count FROM CTPhieuXuat WHERE MaSach = ? LIMIT 1`,
            [id]
        )

        return rows[0].count > 0
    },
}

export default ExportReceiptModel
