import pool from '../configs/db.js'
import config from '../configs/app.config.js'
import BookModel from '../models/book.model.js'
import { createHttpError } from '../utils/errorUtil.js'
import OrderDetailModel from '../models/orderDetail.model.js'
import CartModel from '../models/cart.model.js'
import { deleteImage } from '../utils/cloudinary.js'
import ImportReceiptModel from '../models/importReceipt.model.js'
import { uploadImage } from '../utils/cloudinary.js'
import ExportReceiptModel from '../models/exportReceipt.model.js'

const { PAGE_LIMIT } = config

const BookService = {
    // Hàm lấy sách (có Phân trang + Tìm kiếm + Lọc thể loại + JOIN bảng)
    async getAll(page = 1, limit = 8, keyword = '', categoryId = null) {
        try {
            const offset = (page - 1) * limit

            // 1. Xây dựng câu điều kiện WHERE
            // Lưu ý: Dùng alias 's' đại diện cho bảng 'Sach'
            let whereClause = 'WHERE 1=1'
            let params = []

            // Lọc theo từ khóa tìm kiếm
            if (keyword) {
                whereClause += ' AND s.TenSach LIKE ?'
                params.push(`%${keyword}%`)
            }

            // Lọc theo Thể loại (nếu người dùng bấm vào menu Thể loại)
            if (categoryId) {
                whereClause += ' AND s.MaTL = ?'
                params.push(categoryId)
            }

            // Thêm limit và offset vào cuối mảng tham số
            params.push(limit, offset)

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
            `

            const [rows] = await pool.query(query, params)

            // 3. Query đếm tổng (Để tính phân trang)
            // Cũng phải JOIN và WHERE y hệt để đếm đúng số lượng sách sau khi lọc
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM Sach s 
                LEFT JOIN TacGia tg ON s.MaTG = tg.MaTG
                LEFT JOIN TheLoai tl ON s.MaTL = tl.MaTL
                ${whereClause}
            `

            // Params cho câu đếm thì bỏ 2 tham số cuối (limit, offset) đi
            let countParams = params.slice(0, params.length - 2)

            const [countResult] = await pool.query(countQuery, countParams)
            const totalBooks = countResult[0].total
            const totalPages = Math.ceil(totalBooks / limit)

            return {
                books: rows,
                totalBooks,
                totalPages,
                currentPage: page,
            }
        } catch (error) {
            console.error('❌ Lỗi BookService.getAll:', error)
            return { books: [], totalBooks: 0, totalPages: 0, currentPage: 1 }
        }
    },

    // Lấy hết không điều kiện
    async getAllJSON() {
        return BookModel.getAll()
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
            `
            const [rows] = await pool.query(query, [id])
            return rows[0]
        } catch (error) {
            console.error('❌ Lỗi BookService.getById:', error)
            return null
        }
    },

    async getByIdJSON(id) {
        const book = await BookModel.getById(id)
        return book
    },

    async getQuantity(id) {
        const quanity = await BookModel.getQuantity(id)
        return quanity
    },

    async getWithDetails() {
        const books = await BookModel.getWithDetails()
        return books
    },

    async getWithParam(query) {
        let { page, sort, order, keyword } = query

        let currentPage = Number(page)
        let limit = Number(PAGE_LIMIT)

        if (isNaN(limit) || limit < 2 || limit > 50) limit = 10

        if (!keyword) keyword = ''

        const total = await BookModel.getTotal(keyword)
        const totalPage = Math.ceil(total / limit)

        if (isNaN(currentPage) || currentPage > totalPage) currentPage = 1
        else if (currentPage < 1) currentPage = totalPage

        const offset = (currentPage - 1) * limit

        const validParam = ['MaSach', 'TenSach', 'ASC', 'asc', 'DESC', 'desc']

        const sortBy = validParam.includes(sort) ? sort : 'MaSach'
        const sortOrder = validParam.includes(order) ? order : 'DESC'

        const books = await BookModel.getWithParam(limit, offset, sortBy, sortOrder, keyword)

        return {
            books,
            currentPage,
            limit,
            totalPage,
            total,
            totalItem: total,
            PAGE_LIMIT,
        }
    },

    async create(payload) {
        if (payload.TenSach == '' || payload.ISBN == '' || payload.DonGia == '' || payload.MaTG == '' || payload.MaTL == '' || payload.MaNXB == '')
            throw createHttpError('Thông tin sách còn thiếu!', 401)

        const isbnExist = await BookModel.getByISBN(payload.ISBN)
        if (isbnExist) throw createHttpError('Trùng mã ISBN!', 409)

        if (payload.filepath) {
            const uploadResult = await uploadImage(payload.filepath, 'book_coves')
            payload = {...payload, uploadResult}
        }

        const book = BookModel.create(payload)

        return book
    },

    async update(id, payload) {
        if (payload.TenSach == '' || payload.ISBN == '' || payload.DonGia == '' || payload.MaTG == '' || payload.MaTL == '' || payload.MaNXB == '')
            throw createHttpError('Thông tin sách còn thiếu!', 401)

        const exist = await BookModel.getById(id)
        if (!exist) throw createHttpError('Mã sách không tồn tại')

        const existOther = await BookModel.getOtherByISBN(id, payload.ISBN)
        if (existOther) throw createHttpError('Trùng mã ISBN!', 409)

        const isUpdate = BookModel.update(id, payload)
        if (!isUpdate) throw createHttpError('Có lỗi khi cập nhật thông tin sách', 500)
            
        if (payload.filepath) {
            const uploadResult = await uploadImage(payload.filepath, 'book_coves')
            const ok = await BookModel.updateImage(id, uploadResult)
            if (!ok) throw createHttpError('Có lỗi khi thay đổi ảnh bìa', 500)
            deleteImage(exist.HinhAnhID)
        }

        return isUpdate
    },

    async delete(id) {
        if (!id) throw new Error('Thiếu mã sách')

        const exist = await BookModel.getById(id)
        if (!exist) throw createHttpError('Mã sách không tồn tại')

        // Kiểm tra tồn kho
        if (exist.SoLuongTon > 0) throw createHttpError('Sách còn tồn kho', 409)

        // Kiểm tra trong chi tiết hóa đơn
        const existInOrder = await OrderDetailModel.existBook(id)
        if (existInOrder) throw createHttpError('Sách đã có lịch sử giao dịch!', 409)

        // Kiểm tra trong giỏ hàng
        const existInCart = await CartModel.existBook(id)
        if (existInCart) throw createHttpError('Sách đã có lịch sử giao dịch!', 409)

        // Kiểm tra trong chi tiết phiếu nhập
        const existInImportDetail = await ImportReceiptModel.existBook(id)
        if (existInImportDetail) throw createHttpError('Sách đã có lịch sử nhập hàng!', 409)

        // Kiểm tra trong chi tiết phiếu xuất
        const existInExportDetail = await ExportReceiptModel.existBook(id)
        if (existInExportDetail) throw createHttpError('Sách đã có lịch sử xuất hàng!', 409)

        const imageId = exist.HinhAnhID
        if (imageId) await deleteImage(imageId)

        const success = await BookModel.delete(id)
        if (!success) throw createHttpError('Xóa ảnh thất bại', 500)

        return true
    },

    async updateStock() {
        return null
    },
}

export default BookService
