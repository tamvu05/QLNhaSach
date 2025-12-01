import pool from '../configs/db.js'

const OrderDetailModel = {
    async existBook(MaSach) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count FROM CTDonHang WHERE MaSach = ? LIMIT 1`,
            [MaSach]
        )

        return rows[0].count > 0
    },
}

export default OrderDetailModel
