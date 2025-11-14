import pool from './configs/db.js'
const [rows] = await pool.query('SELECT 1 + 2 AS three')
console.log(rows)

