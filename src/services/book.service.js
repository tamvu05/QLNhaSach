import pool from '../configs/db.js';

const BookService = {
    // Hàm lấy sách (có Phân trang + Tìm kiếm + Lọc thể loại + JOIN bảng)
    async getAll(page = 1, limit = 8, keyword = '', categoryId = null) {
        try {
            const offset = (page - 1) * limit;
            
            // 1. Xây dựng câu điều kiện WHERE
            // Lưu ý: Dùng alias 's' đại diện cho bảng 'Sach'
            let whereClause = 'WHERE 1=1'; 
            let params = [];

            // Lọc theo từ khóa tìm kiếm
            if (keyword) {
                whereClause += ' AND s.TenSach LIKE ?';
                params.push(`%${keyword}%`);
            }

            // Lọc theo Thể loại (nếu người dùng bấm vào menu Thể loại)
            if (categoryId) {
                whereClause += ' AND s.MaTL = ?'; 
                params.push(categoryId);
            }

            // Thêm limit và offset vào cuối mảng tham số
            params.push(limit, offset);

            // 2. Query chính (CÓ JOIN BẢNG)
            // Chúng ta nối Sach(s) với TacGia(tg) và TheLoai(tl)
            const query = `
                SELECT 
                    s.MaSach AS id,          -- Đổi tên MaSach thành id cho View EJS hiểu
                    s.TenSach,
                    s.DonGia,                -- Cột cậu cần thêm vào DB
                    s.HinhAnh,               -- Cột cậu cần thêm vào DB
                    s.MoTa,
                    s.SoLuongTon AS SoLuong, -- Đổi tên cho khớp EJS
                    tg.TenTG AS TacGia,      -- Lấy tên tác giả thật
                    tl.TenTL AS TheLoai      -- Lấy tên thể loại thật
                FROM Sach s
                LEFT JOIN TacGia tg ON s.MaTG = tg.MaTG
                LEFT JOIN TheLoai tl ON s.MaTL = tl.MaTL
                ${whereClause}
                ORDER BY s.MaSach DESC
                LIMIT ? OFFSET ?
            `;
            
            const [rows] = await pool.query(query, params);

            // 3. Query đếm tổng (Để tính phân trang)
            // Cũng phải JOIN và WHERE y hệt để đếm đúng số lượng sách sau khi lọc
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM Sach s 
                LEFT JOIN TacGia tg ON s.MaTG = tg.MaTG
                LEFT JOIN TheLoai tl ON s.MaTL = tl.MaTL
                ${whereClause}
            `;
            
            // Params cho câu đếm thì bỏ 2 tham số cuối (limit, offset) đi
            let countParams = params.slice(0, params.length - 2);
            
            const [countResult] = await pool.query(countQuery, countParams);
            const totalBooks = countResult[0].total;
            const totalPages = Math.ceil(totalBooks / limit);

            return {
                books: rows,
                totalBooks,
                totalPages,
                currentPage: page
            };

        } catch (error) {
            console.error('❌ Lỗi BookService.getAll:', error);
            return { books: [], totalBooks: 0, totalPages: 0, currentPage: 1 };
        }
    },

    // Hàm lấy chi tiết 1 cuốn sách (JOIN đầy đủ thông tin)
    async getById(id) {
        try {
            const query = `
                SELECT 
                    s.MaSach AS id,
                    s.TenSach,
                    s.DonGia,
                    s.HinhAnh,
                    s.MoTa,
                    s.SoLuongTon AS SoLuong,
                    s.ISBN,
                    tg.TenTG AS TacGia,      -- Lấy tên tác giả
                    tl.TenTL AS TheLoai,     -- Lấy tên thể loại
                    nxb.TenNXB AS NhaXuatBan -- Lấy thêm cả Nhà xuất bản
                FROM Sach s
                LEFT JOIN TacGia tg ON s.MaTG = tg.MaTG
                LEFT JOIN TheLoai tl ON s.MaTL = tl.MaTL
                LEFT JOIN NhaXuatBan nxb ON s.MaNXB = nxb.MaNXB
                WHERE s.MaSach = ?
            `;
            const [rows] = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error('❌ Lỗi BookService.getById:', error);
            return null;
        }
    },

    // Các hàm create, update... tạm thời để trống
    async create() { return null; },
    async update() { return null; },
    async delete() { return null; },
    async updateStock() { return null; }
};

export default BookService;