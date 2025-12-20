import BookService from '../services/book.service.js'
import CategoryService from '../services/category.service.js'
import AuthorService from '../services/author.service.js'
import PublisherService from '../services/publisher.service.js'
import { bookConfig } from '../configs/adminView.config.js'
import exportFileExcel from '../utils/exportFileExcel.js'
import { formatPrice } from '../utils/helpers.js'

const BookController = {
    // --- PHẦN CHO USER (Giao diện khách hàng) ---

    // GET / (Trang chủ)
    async home(req, res, next) {
        try {
            // Lấy 8 cuốn sách mới nhất để hiện ở mục "Sách nổi bật"
            // Tận dụng hàm getAll, trang 1, limit 8
            const data = await BookService.getAll(1, 8)

            res.render('user/home', {
                title: 'Trang chủ - BookStore',
                books: data.books, // Truyền sách sang home.ejs
                path: '/', // 💡 Tín hiệu: Đang ở Trang chủ (để sáng đèn menu)
            })
        } catch (error) {
            console.error(error)
            res.render('user/home', {
                title: 'Trang chủ',
                books: [],
                path: '/',
            })
        }
    },

    // GET /book (Danh sách sách - Có tìm kiếm + Phân trang + Lọc thể loại)
    async userGetAll(req, res, next) {
        try {
            // 1. Lấy các tham số từ URL
            const keyword = req.query.keyword || ''
            const categoryId = req.query.categoryId || null // Lấy categoryId nếu có
            const page = parseInt(req.query.page) || 1
            const limit = 12 // Số sách mỗi trang

            // 2. Gọi Service (Truyền đủ 4 tham số)
            const data = await BookService.getAll(page, limit, keyword, categoryId)

            // 3. Render giao diện
            res.render('user/book', {
                title: 'Tủ sách BookStore',
                data: data.books,
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                keyword, // Giữ lại từ khóa tìm kiếm ở ô input
                categoryId, // Giữ lại thể loại đang chọn (để active menu con nếu cần)
                path: '/book', // 💡 Tín hiệu: Đang ở trang Sách (để sáng đèn menu Sách)
            })
        } catch (error) {
            console.error(error)
            res.redirect('/')
        }
    },

    // GET /book/:id (Chi tiết sách)
    async userGetById(req, res, next) {
        try {
            const { id } = req.params

            // Gọi Service lấy thông tin chi tiết (đã JOIN bảng)
            const book = await BookService.getById(id)

            if (book) {
                res.render('user/detail', {
                    title: book.TenSach,
                    book,
                    path: '/book', // 💡 Vẫn để path là '/book' để menu Sách sáng đèn khi xem chi tiết
                })
            } else {
                res.redirect('/book')
            }
        } catch (error) {
            console.error(error)
            res.redirect('/book')
        }
    },

    // --- PHẦN CHO ADMIN (Quản trị viên) ---

    // /admin/book
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await BookService.getWithParam(query)
            const categories = await CategoryService.getAll()
            const authors = await AuthorService.getAll()
            const publishers = await PublisherService.getAll()
            res.render('admin/viewManager', {
                books: data.books,
                authors,
                categories,
                publishers,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.books.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: bookConfig.scripts,
                entityName: bookConfig.entityName,
                tablePartial: bookConfig.tablePartial,
                modalAddSelector: bookConfig.modalAddSelector,
                modalAddPartial: bookConfig.modalAddPartial,
                hrefBase: bookConfig.hrefBase,
                apiBase: bookConfig.apiBase,
                modalAddId: bookConfig.modalAddId,
                modalUpdateId: bookConfig.modalUpdateId,
                formatPrice,
            })
        } catch (err) {
            next(err)
        }
    },

    async getPartials(req, res, next) {
        const renderPartial = (view, data) => {
            return new Promise((resolve, reject) => {
                req.app.render(view, data, (err, html) => {
                    if (err) {
                        console.error(`Lỗi render EJS cho view ${view}:`, err)
                        return reject(err)
                    }
                    resolve(html)
                })
            })
        }

        try {
            const query = req.query
            const data = await BookService.getWithParam(query)
            const categories = await CategoryService.getAll()
            const authors = await AuthorService.getAll()
            const publishers = await PublisherService.getAll()
            const table = await renderPartial('admin/partials/book/tableBook', {
                books: data.books,
                categories,
                authors,
                publishers,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.books.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                formatPrice,
            })

            const pagination = await renderPartial('admin/partials/pagination', {
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                hrefBase: bookConfig.hrefBase,
                apiBase: bookConfig.apiBase,
            })

            return res.json({
                table,
                pagination,
                totalPage: data.totalPage,
            })
        } catch (error) {
            next(error)
        }
    },

    // GET /api/book
    async getAll(req, res, next) {
        try {
            const books = await BookService.getAllJSON() // Admin tạm thời lấy nhiều sách
            res.json(books)
        } catch (error) {
            next(error)
        }
    },

    // GET /admin/book/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await BookService.getByIdJSON(id)
            res.json(data)
        } catch (error) {
            next(error)
        }
    },

    // GET /api/book/quantity/:id
    async getQuantity(req, res, next) {
        try {
            const { id } = req.params
            const quanity = await BookService.getQuantity(id)
            res.json(quanity)
        } catch (error) {
            next(error)
        }
    },

    // POST /api/book
    async create(req, res, next) {
        try {
            const filepath = req.file ? req.file.path : null
            let payload = {...req.body, filepath}

            const data = await BookService.create(payload)
            res.json(data)
        } catch (error) {
            next(error)
        }
    },

    // PUT /api/book/:id
    async update(req, res, next) {
        try {
            const filepath = req.file ? req.file.path : null
            let payload = {...req.body, filepath}

            const { id } = req.params

            const data = await BookService.update(id, payload)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // DELETE /api/book/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await BookService.delete(id)
            res.json({ success })
        } catch (error) {
            next(error)
        }
    },

    // PATCH /api/book/:id/stock
    async updateStock(req, res, next) {
        const { id } = req.params
        const { amount } = req.body
        const data = await BookService.updateStock(id, Number(amount))
        res.json(data)
    },

    // /api/book/export
    async export(req, res, next) {
        try {
            const books = await BookService.getWithDetails()
            console.log(books)
            const excelData = books.map((data) => {
                return {
                    'Tên sách': data.TenSach,
                    'Mô tả': data.MoTa,
                    ISBN: data.ISBN,
                    'Tên tác giả': data.TenTG,
                    'Tên nhà xuất bản': data.TenNXB,
                    'Tên thể loại': data.TenTL,
                    'Số lượng tồn': data.SoLuongTon,
                    'Giá bán': data.DonGia,
                }
            })

            const fileBuffer = exportFileExcel(excelData)
            const filename = 'DanhMucSach.xlsx'

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.setHeader('Content-Length', fileBuffer.length)

            res.send(fileBuffer)
        } catch (error) {
            next(error)
        }
    },
}

export default BookController
