import pool from '../configs/db.js'

const AccountModel = {
    async getById(id) {
        const [result] = await pool.query('SELECT * from TaiKhoan WHERE MaTK = ? LIMIT 1', [id])
        return result[0]
    }
}

export default AccountModel