import { importReceiptConfig } from '../configs/adminView.config.js'
import exportFileExcel from '../utils/exportFileExcel.js'
import ImportReceiptService from '../services/importReceipt.service.js'
import BookService from '../services/book.service.js'
import SupplierService from '../services/supplier.service.js'

const ImportReceiptController = {
    // GET /admin/import-receipt
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const account = req?.session?.account ?? {}
            const data = await ImportReceiptService.getWithParam(query, account)
            const books = await BookService.getAllJSON()
            const suppliers = await SupplierService.getAll()
            res.render('admin/viewManager', {
                importReceipts: data.importReceipts,
                books,
                suppliers,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.importReceipts.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: importReceiptConfig.scripts,
                entityName: importReceiptConfig.entityName,
                tablePartial: importReceiptConfig.tablePartial,
                modalAddSelector: importReceiptConfig.modalAddSelector,
                modalAddPartial: importReceiptConfig.modalAddPartial,
                // modalUpdatePartial: importReceiptConfig.modalUpdatePartial,
                hrefBase: importReceiptConfig.hrefBase,
                apiBase: importReceiptConfig.apiBase,
                modalAddId: importReceiptConfig.modalAddId,
                modalUpdateId: importReceiptConfig.modalUpdateId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/import-receipt
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
            const account = req?.session?.account ?? {}
            const data = await ImportReceiptService.getWithParam(query, account)
            const books = await BookService.getAllJSON()
            const suppliers = await SupplierService.getAll()
            const table = await renderPartial('admin/partials/importReceipt/tableImportReceipt', {
                importReceipts: data.importReceipts,
                books,
                suppliers,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.importReceipts.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
            })

            const pagination = await renderPartial('admin/partials/pagination', {
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                hrefBase: importReceiptConfig.hrefBase,
                apiBase: importReceiptConfig.apiBase,
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

    // GET /api/import-receipt/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await ImportReceiptService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // GET /api/import-receipt/detail/:id
    async getDetailById(req, res, next) {
        try {
            const { id } = req.params
            const data = await ImportReceiptService.getDetailById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // POST /api/import-receipt
    async create(req, res, next) {
        try {
             const MaNV = req?.session?.account?.MaNV ?? null
            const payload = { ...req.body, MaNV } 
            const data = await ImportReceiptService.create(payload)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },

    // PUT /api/import-receipt/cancel/:id
    async cancel(req, res, next) {
        try {
            const { id } = req.params
            const result = await ImportReceiptService.cancel(id)
            res.json({ success: true, message: 'Đã hủy phiếu nhập thành công' })
        } catch (err) {
            next(err)
        }
    },
}

export default ImportReceiptController
