import pool from '../configs/db.js'

const InvoiceModel = {
    async getWithParam(
        limit,
        offset,
        sortBy = 'MaDH',
        sortOrder = 'DESC',
        keyword = '',
        status = ''
    ) {
        const SDT = `%${keyword}%`
        const TrangThai = `%${status}%`

        const [rows] = await pool.query(
            `SELECT *
            FROM DonHang
            WHERE SDT like ? AND TrangThai like ? AND TrangThai IN ('DA_GIAO', 'DA_BAN_TRUC_TIEP')
            ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [SDT, TrangThai, limit, offset]
        )

        console.log(rows)
        return rows
    },

    async getTotal(keyword = '') {
        const SDT = `%${keyword}%`
        const [result] = await pool.query(
            `SELECT COUNT(*) AS total
            FROM DonHang
            WHERE SDT like ? AND TrangThai IN ('DA_GIAO', 'DA_BAN_TRUC_TIEP')`,
            [SDT]
        )
        return result[0].total
    },

    async getById(id) {
        const [rows] = await pool.query(
            `SELECT *
            FROM DonHang
            WHERE MaDH = ?`,
            [id]
        )
        return rows[0] || null
    },

    async getDetailById(id) {
        const [rows] = await pool.query(
            `SELECT s.TenSach , ct.SoLuong , ct.DonGia , dh.TongTien, s.MaSach
            FROM DonHang dh
            JOIN CTDonHang ct  ON dh.MaDH = ct.MaDH 
            JOIN Sach s ON ct.MaSach  = s.MaSach 
            WHERE dh.MaDH = ?`,
            [id]
        )
        return rows
    },

    async create({
        TenNguoiNhan,
        SDT,
        DiaChiNhan,
        NgayTao,
        NoiDung,
        ChiTietHD,
        MaNV,
        HinhThucThanhToan = 'CASH'
    }) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [result] = await connection.query(
                `INSERT INTO DonHang(MaNV, NgayTaoHoaDon, TenNguoiNhan , DiaChiNhan, SDT, GhiChu, HinhThucThanhToan, TrangThai, NgayDat) 
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    MaNV,
                    NgayTao,
                    TenNguoiNhan,
                    DiaChiNhan,
                    SDT,
                    NoiDung,
                    HinhThucThanhToan,
                    'DA_BAN_TRUC_TIEP',
                    null,
                ]
            )

            const MaDH = result.insertId

            const detailPromise = ChiTietHD.map(async (chiTiet) => {
                const insertCTPromise = connection.query(
                    `INSERT INTO CTDonHang(MaDH, MaSach, SoLuong, DonGia) VALUES (?, ?, ?, ?)`,
                    [MaDH, chiTiet.MaSach, chiTiet.SoLuong, chiTiet.DonGia]
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

            return MaDH
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },
}

export default InvoiceModel
