import pool from '../configs/db.js'

const ExportReceiptModel = {
    async getWithParam(
        limit,
        offset,
        sortBy = 'MaPX',
        sortOrder = 'DESC',
        keyword = '',
        MaNV = null
    ) {
        const searchKeyword = `%${keyword}%`
        const conditions = ['HoTen LIKE ?']
        const params = [searchKeyword]

        if (MaNV) {
            conditions.push('PhieuXuat.MaNV = ?')
            params.push(MaNV)
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`

        const [rows] = await pool.query(
            `SELECT MaPX, NgayXuat, HoTen, NhanVien.MaNV, NoiDung, PhieuXuat.TrangThai
            FROM PhieuXuat
            LEFT JOIN NhanVien on PhieuXuat.MaNV = NhanVien.MaNV
            ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '', MaNV = null) {
        const searchKeyword = `%${keyword}%`
        const conditions = ['HoTen LIKE ?']
        const params = [searchKeyword]

        if (MaNV) {
            conditions.push('PhieuXuat.MaNV = ?')
            params.push(MaNV)
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`

        const [result] = await pool.query(
            `SELECT COUNT(*) AS total
            FROM PhieuXuat
            LEFT JOIN NhanVien on PhieuXuat.MaNV = NhanVien.MaNV
            ${whereClause}`,
            params
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
                'INSERT INTO PhieuXuat(MaNV, NgayXuat, NoiDung, TrangThai) VALUES (?, ?, ?, ?)',
                [MaNV, NgayXuat, NoiDung, 'HIEU_LUC']
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

    async cancel(id) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            // Check current status
            const [receipt] = await connection.query(
                `SELECT TrangThai FROM PhieuXuat WHERE MaPX = ?`,
                [id]
            )

            if (!receipt || receipt.length === 0) {
                throw new Error('Phiếu xuất không tồn tại')
            }

            if (receipt[0].TrangThai === 'DA_HUY') {
                throw new Error('Phiếu xuất đã được hủy trước đó')
            }

            // Get the details of the export receipt
            const [details] = await connection.query(
                `SELECT MaSach, SoLuong FROM CTPhieuXuat WHERE MaPX = ?`,
                [id]
            )

            if (details.length === 0) {
                throw new Error('Phiếu xuất không có chi tiết')
            }

            // Reverse the inventory changes (add quantities back)
            const updatePromises = details.map((detail) =>
                connection.query(
                    'UPDATE Sach SET SoLuongTon = SoLuongTon + ? WHERE MaSach = ?',
                    [detail.SoLuong, detail.MaSach]
                )
            )

            await Promise.all(updatePromises)

            // Update status to DA_HUY instead of deleting
            await connection.query(
                "UPDATE PhieuXuat SET TrangThai = 'DA_HUY' WHERE MaPX = ?",
                [id]
            )

            await connection.commit()

            return true
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },
}

export default ExportReceiptModel
