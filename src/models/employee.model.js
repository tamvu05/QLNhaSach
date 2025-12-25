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
            `SELECT MaNV, HoTen as TenNV, SDT, NgaySinh, NgayVaoLam, TrangThai, TenDangNhap as Email, VaiTro, NgaySinh, NgayVaoLam, HinhAnh, HinhAnhID
            FROM NhanVien JOIN TaiKhoan on NhanVien.MaTK = TaiKhoan.MaTK
            WHERE MaNV = ?`,
            [id]
        )
        return rows[0] || null
    },

    async getEmpIdByAccountId(MaTK) {
        const [rows] = await pool.query(`SELECT MaNV FROM NhanVien WHERE MaTK = ?`, [MaTK])
        return rows[0].MaNV || null
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

    async updateProfile(MaNV, { HoTen, SDT, NgaySinh, Email = null }, isManager = false) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [rows] = await connection.query('SELECT MaNV, MaTK FROM NhanVien WHERE MaNV = ? FOR UPDATE', [MaNV])
            if (!rows || rows.length === 0) throw new Error('Nhân viên không tồn tại')
            const MaTK = rows[0].MaTK

            if (Email && isManager) {
                const [dup] = await connection.query('SELECT 1 FROM TaiKhoan WHERE TenDangNhap = ? AND MaTK != ? LIMIT 1', [Email, MaTK])
                if (dup.length > 0) throw new Error('Email đã tồn tại')
                await connection.query('UPDATE TaiKhoan SET TenDangNhap = ? WHERE MaTK = ?', [Email, MaTK])
            }

            await connection.query(`UPDATE NhanVien SET HoTen = ?, SDT = ?, NgaySinh = ? WHERE MaNV = ?`, [HoTen, SDT, NgaySinh, MaNV])

            await connection.commit()
            return true
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },

    async hasTransactions(MaNV) {
        const [rows] = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM PhieuNhap WHERE MaNV = ?) AS importCount,
                (SELECT COUNT(*) FROM PhieuXuat WHERE MaNV = ?) AS exportCount,
                (SELECT COUNT(*) FROM HoaDon WHERE MaNV = ?) AS invoiceCount`,
            [MaNV, MaNV, MaNV]
        )

        const stats = rows[0] || { importCount: 0, exportCount: 0, invoiceCount: 0 }
        return Number(stats.importCount) + Number(stats.exportCount) + Number(stats.invoiceCount) > 0
    },

    async delete(id) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [employeeRows] = await connection.query(
                'SELECT MaNV, MaTK FROM NhanVien WHERE MaNV = ? FOR UPDATE',
                [id]
            )

            if (!employeeRows || employeeRows.length === 0) {
                throw new Error('Nhân viên không tồn tại')
            }

            const MaTK = employeeRows[0].MaTK

            const [usageRows] = await connection.query(
                `SELECT 
                    (SELECT COUNT(*) FROM PhieuNhap WHERE MaNV = ?) AS importCount,
                    (SELECT COUNT(*) FROM PhieuXuat WHERE MaNV = ?) AS exportCount,
                    (SELECT COUNT(*) FROM HoaDon WHERE MaNV = ?) AS invoiceCount`,
                [id, id, id]
            )

            const usage = usageRows[0]
            if (usage && (usage.importCount > 0 || usage.exportCount > 0 || usage.invoiceCount > 0)) {
                throw new Error('Nhân viên đã phát sinh giao dịch, không thể xóa')
            }

            await connection.query('DELETE FROM NhanVien WHERE MaNV = ?', [id])
            await connection.query('DELETE FROM TaiKhoan WHERE MaTK = ?', [MaTK])

            await connection.commit()
            return true
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },

    async getAccountByEmployeeId(MaNV) {
        const [rows] = await pool.query(
            `SELECT tk.MaTK, tk.MatKhauHash FROM NhanVien nv JOIN TaiKhoan tk ON nv.MaTK = tk.MaTK WHERE nv.MaNV = ? LIMIT 1`,
            [MaNV]
        )
        return rows[0] || null
    },

    async updatePassword(MaTK, MatKhauHash) {
        const [res] = await pool.query('UPDATE TaiKhoan SET MatKhauHash = ? WHERE MaTK = ?', [MatKhauHash, MaTK])
        return res.affectedRows > 0
    },

    async updateAvatar(MaNV, { HinhAnh, HinhAnhID }) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [rows] = await connection.query('SELECT MaNV FROM NhanVien WHERE MaNV = ? FOR UPDATE', [MaNV])
            if (!rows || rows.length === 0) throw new Error('Nhân viên không tồn tại')

            const [res] = await connection.query(
                'UPDATE NhanVien SET HinhAnh = ?, HinhAnhID = ? WHERE MaNV = ?',
                [HinhAnh, HinhAnhID, MaNV]
            )

            await connection.commit()
            return res.affectedRows > 0
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    },
}

export default EmployeeModel
