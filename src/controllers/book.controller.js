import BookService from '../services/book.service.js'

const BookController = {
    // --- PHẦN CHO USER (Giao diện khách hàng) ---

    // GET / (Trang chủ)
    async home(req, res) {
        try {
            // Lấy 8 cuốn sách mới nhất để hiện ở mục "Sách nổi bật"
            // Tận dụng hàm getAll, trang 1, limit 8
            const data = await BookService.getAll(1, 8);

            res.render('user/home', {
                title: 'Trang chủ - BookStore',
                books: data.books, // Truyền sách sang home.ejs
                path: '/'          // 💡 Tín hiệu: Đang ở Trang chủ (để sáng đèn menu)
            });
        } catch (error) {
            console.error(error);
            res.render('user/home', { title: 'Trang chủ', books: [], path: '/' });
        }
    },

    // GET /book (Danh sách sách - Có tìm kiếm + Phân trang + Lọc thể loại)
    async userGetAll(req, res) {
        try {
            // 1. Lấy các tham số từ URL
            const keyword = req.query.keyword || ''; 
            const categoryId = req.query.categoryId || null; // Lấy categoryId nếu có
            const page = parseInt(req.query.page) || 1;
            const limit = 12; // Số sách mỗi trang

            // 2. Gọi Service (Truyền đủ 4 tham số)
            const data = await BookService.getAll(page, limit, keyword, categoryId);

            // 3. Render giao diện
            res.render('user/book', {
                title: 'Tủ sách BookStore',
                data: data.books,
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                keyword,    // Giữ lại từ khóa tìm kiếm ở ô input
                categoryId, // Giữ lại thể loại đang chọn (để active menu con nếu cần)
                path: '/book' // 💡 Tín hiệu: Đang ở trang Sách (để sáng đèn menu Sách)
            });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // GET /book/:id (Chi tiết sách)
    async userGetById(req, res) {
        try {
            const { id } = req.params; 
            
            // Gọi Service lấy thông tin chi tiết (đã JOIN bảng)
            const book = await BookService.getById(id);

            if (book) {
                res.render('user/detail', { 
                    title: book.TenSach,
                    book,
                    path: '/book' // 💡 Vẫn để path là '/book' để menu Sách sáng đèn khi xem chi tiết
                });
            } else {
                res.redirect('/book');
            }
        } catch (error) {
            console.error(error);
            res.redirect('/book');
        }
    },

    // --- PHẦN CHO ADMIN (Quản trị viên) ---

    // GET /admin/book
    async getAll(req, res) {
        const data = await BookService.getAll(1, 100); // Admin tạm thời lấy nhiều sách
        res.render('admin/book', {
            title: 'Admin Dashboard',
            data: data.books,
            layout: 'layouts/adminLayout' // Chỉ định layout Admin
        })
    },

    // GET /admin/book/:id
    async getById(req, res) {
        const { id } = req.params
        const data = await BookService.getById(id)
        res.json(data)
    },

    // --- PHẦN API XỬ LÝ DỮ LIỆU (CRUD) ---

    // POST /api/book
    async create(req, res) {
        const data = await BookService.create(req.body)
        res.status(201).json(data)
    },

    // PUT /api/book/:id
    async update(req, res) {
        const { id } = req.params
        const data = await BookService.update(id, req.body)
        res.json(data)
    },

    // DELETE /api/book/:id
    async delete(req, res) {
        const { id } = req.params
        const success = await BookService.delete(id)
        res.json({ success })
    },

    // PATCH /api/book/:id/stock
    async updateStock(req, res) {
        const { id } = req.params
        const { amount } = req.body
        const data = await BookService.updateStock(id, Number(amount))
        res.json(data)
    },
}

export default BookController