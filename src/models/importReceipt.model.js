import pool from '../configs/db.js'

const ImportReceiptModel = {
    async getWithParam(limit, offset, sortBy = 'MaPN', sortOrder = 'DESC', keyword = '', MaNV = null) {
        const searchKeyword = `%${keyword}%`
        const conditions = ['TenNCC LIKE ?']
        const params = [searchKeyword]

        if (MaNV) {
            conditions.push('PhieuNhap.MaNV = ?')
            params.push(MaNV)
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`

        const [rows] = await pool.query(
            `SELECT MaPN, NgayNhap, TenNCC, HoTen, NhaCungCap.SDT, NhanVien.MaNV, NhaCungCap.MaNCC, NoiDung, PhieuNhap.TrangThai
            FROM PhieuNhap 
            LEFT JOIN NhaCungCap on PhieuNhap.MaNCC = NhaCungCap.MaNCC
            LEFT JOIN NhanVien on PhieuNhap.MaNV = NhanVien.MaNV
            ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '', MaNV = null) {
        const searchKeyword = `%${keyword}%`
        const conditions = ['TenNCC LIKE ?']
        const params = [searchKeyword]

        if (MaNV) {
            conditions.push('PhieuNhap.MaNV = ?')
            params.push(MaNV)
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`

        const [result] = await pool.query(
            `SELECT COUNT(*) AS total FROM PhieuNhap 
            LEFT JOIN NhaCungCap on PhieuNhap.MaNCC = NhaCungCap.MaNCC
            LEFT JOIN NhanVien on PhieuNhap.MaNV = NhanVien.MaNV
            ${whereClause}`,
            params
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

            const [result] = await connection.query('INSERT INTO PhieuNhap(MaNCC, MaNV, NgayNhap, NoiDung, TrangThai) VALUES (?, ?, ?, ?, ?)', [MaNCC, MaNV, NgayNhap, NoiDung, 'HIEU_LUC'])

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

    async cancel(id) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            // Check current status
            const [receipt] = await connection.query(
                `SELECT TrangThai FROM PhieuNhap WHERE MaPN = ?`,
                [id]
            )

            if (!receipt || receipt.length === 0) {
                throw new Error('Phiếu nhập không tồn tại')
            }

            if (receipt[0].TrangThai === 'DA_HUY') {
                throw new Error('Phiếu nhập đã được hủy trước đó')
            }

            // Get the details of the import receipt
            const [details] = await connection.query(
                `SELECT MaSach, SoLuong FROM CTPhieuNhap WHERE MaPN = ?`,
                [id]
            )

            if (details.length === 0) {
                throw new Error('Phiếu nhập không có chi tiết')
            }

            // Validate stock won't go negative, then reverse the inventory
            for (const detail of details) {
                // Lock the row to avoid race conditions
                const [stockRows] = await connection.query(
                    'SELECT SoLuongTon FROM Sach WHERE MaSach = ? FOR UPDATE',
                    [detail.MaSach]
                )

                if (!stockRows || stockRows.length === 0) {
                    throw new Error('Sách không tồn tại trong kho')
                }

                const currentStock = Number(stockRows[0].SoLuongTon)
                const importQty = Number(detail.SoLuong)

                // Constraint: SoLuongTon - SoLuongNhap >= 0
                if (currentStock - importQty < 0) {
                    throw new Error(
                        'Không thể hủy phiếu nhập: số lượng tồn không đủ để trừ (' +
                            `Tồn: ${currentStock}, Nhập: ${importQty})`
                    )
                }

                await connection.query(
                    'UPDATE Sach SET SoLuongTon = SoLuongTon - ? WHERE MaSach = ?',
                    [importQty, detail.MaSach]
                )
            }

            // Update status to DA_HUY instead of deleting
            await connection.query(
                "UPDATE PhieuNhap SET TrangThai = 'DA_HUY' WHERE MaPN = ?",
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

export default ImportReceiptModel
