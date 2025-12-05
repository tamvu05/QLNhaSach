import InvoiceService from '../services/invoice.service.js'
import { invoiceConfig } from '../configs/adminView.config.js'

const InvoiceController = {
    // GET /admin/sale/invoice
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await InvoiceService.getWithParam(query)
            console.log(data.invoices);
            res.render('admin/saleInvoice', {
                invoices: data.invoices,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.invoices.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: invoiceConfig.scripts,
                entityName: invoiceConfig.entityName,
                tablePartial: invoiceConfig.tablePartial,
                modalAddSelector: invoiceConfig.modalAddSelector,
                modalAddPartial: invoiceConfig.modalAddPartial,
                // modalUpdatePartial: invoiceConfig.modalUpdatePartial,
                hrefBase: invoiceConfig.hrefBase,
                apiBase: invoiceConfig.apiBase,
                modalAddId: invoiceConfig.modalAddId,
                modalUpdateId: invoiceConfig.modalUpdateId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/sale/invoice
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
            const data = await InvoiceService.getWithParam(query)
            const table = await renderPartial(
                'admin/partials/invoice/tableInvoice',
                {
                    invoices: data.invoices,
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    totalItem: data.totalItem,
                    totalItemPerPage: data.invoices.length,
                    PAGE_LIMIT: data.PAGE_LIMIT,
                }
            )

            const pagination = await renderPartial(
                'admin/partials/pagination',
                {
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    hrefBase: invoiceConfig.hrefBase,
                    apiBase: invoiceConfig.apiBase,
                }
            )

            return res.json({
                table,
                pagination,
                totalPage: data.totalPage,
            })
        } catch (error) {
            next(error)
        }
    },

    // GET /api/sale/invoice/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await InvoiceService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // GET /api/sale/invoice/detail/:id
    async getDetailById(req, res, next) {
        try {
            const { id } = req.params
            const data = await InvoiceService.getDetailById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // POST /api/sale/invoice
    async create(req, res, next) {
        try {
            console.log(req.body)
            const data = await InvoiceService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },
}

export default InvoiceController
