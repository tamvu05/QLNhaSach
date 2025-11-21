import dotenv from 'dotenv'
dotenv.config()

import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

// Lấy đường dẫn thư mục hiện tại (thư mục src/configs)
const __dirname = import.meta.dirname

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    
    // CẤU HÌNH SSL CHUẨN (Dùng chứng chỉ)
    ssl: {
        // Đọc file ca.pem nằm cùng thư mục với file db.js này
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
    }
})

console.log("---------------------------------------------------");
console.log("🔐 ĐANG KẾT NỐI CLOUD DATABASE (CÓ SSL):");
console.log("👉 Host:", process.env.DB_HOST);
console.log("---------------------------------------------------");

export default pool