import pool from '../configs/db.js'

const CartModel = {
    async existBook(MaSach) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count FROM GioHang WHERE MaSach = ? LIMIT 1`,
            [MaSach]
        )

        return rows[0].count > 0
    },
}

export default CartModel
