import pool from '../configs/db.js'

const EmployeeModel = {
    async getWithParam(limit, offset, sortBy = 'MaNV', sortOrder = 'DESC', keyword = '', status = '') {
        const searchKeyword = `%${keyword}%`
        const TrangThai = `%${status}%`

        const [rows] = await pool.query(
            `SELECT MaNV, HoTen as TenNV, SDT, NgayVaoLam, TrangThai, TenDangNhap as Email  
            FROM NhanVien JOIN TaiKhoan on NhanVien.MaTK = TaiKhoan.MaTK
            WHERE HoTen LIKE ? AND TrangThai like ? ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
            [searchKeyword, TrangThai, limit, offset]
        )
        return rows
    },

    async getTotal(keyword = '') {
        const HoTen = `%${keyword}%`
        const [result] = await pool.query('SELECT COUNT(*) AS total FROM NhanVien WHERE HoTen LIKE ?', [HoTen])
        return result[0].total
    },

    async getById(id) {
        const [rows] = await pool.query(
            `SELECT MaNV, HoTen as TenNV, SDT, NgaySinh, NgayVaoLam, TrangThai, TenDangNhap as Email  
            FROM NhanVien JOIN TaiKhoan on NhanVien.MaTK = TaiKhoan.MaTK
            WHERE MaNV = ?`,
            [id]
        )
        return rows[0] || null
    },

    async existEmail(email) {
        const [rows] = await pool.query('SELECT 1 FROM TaiKhoan WHERE TenDangNhap = ?', [email])
        return rows[0] || null
    },

    async update(id, { HoTen, NgaySinh, NgayVaoLam, TrangThai, SDT, MatKhauHash = null }) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            await connection.query(`UPDATE NhanVien SET HoTen = ?, NgaySinh = ?, NgayVaoLam = ?, SDT = ? WHERE MaNV = ?`, [HoTen, NgaySinh, NgayVaoLam, SDT, id])

            const [result3] = await connection.query('SELECT MaTK FROM NhanVien WHERE MaNV = ?', [id])
            const MaTK = result3[0].MaTK

            let set = 'TrangThai = ?'
            let params = [TrangThai]
            if (MatKhauHash) {
                set += ', MatKhauHash = ?'
                params.push(MatKhauHash)
            }
            params.push(MaTK)

            await connection.query(`UPDATE TaiKhoan SET ${set} WHERE MaTK = ?`, params)

            await connection.commit()

            return true
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },

    async create({ Email, MatKhauHash, SDT, NgayVaoLam, NgaySinh, HoTen }) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [result] = await connection.query(
                `INSERT INTO TaiKhoan(TenDangNhap, MatKhauHash, VaiTro) 
                values (?, ?, ?)`,
                [Email, MatKhauHash, 3] // 3 là nhân viên
            )

            const MaTK = result.insertId

            const [result2] = await connection.query(
                `INSERT INTO NhanVien(MaTK, HoTen, SDT, NgaySinh, NgayVaoLam) 
                values (?, ?, ?, ?, ?)`,
                [MaTK, HoTen, SDT, NgaySinh, NgayVaoLam]
            )

            const MaNV = result2.insertId

            await connection.commit()

            return MaNV
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },

    // async delete(id) {
    //     const [result] = await pool.query('DELETE FROM Voucher WHERE MaVC = ?', [id])
    //     return result.affectedRows > 0
    // },
}

export default EmployeeModel
