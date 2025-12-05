import { voucherConfig } from '../configs/adminView.config.js'
import exportFileExcel from '../utils/exportFileExcel.js'
import VoucherService from '../services/voucher.service.js'

const VoucherController = {
    // /admin/voucher
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await VoucherService.getWithParam(query)
            res.render('admin/voucher', {
                vouchers: data.vouchers,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.vouchers.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: voucherConfig.scripts,
                hrefBase: voucherConfig.hrefBase,
                apiBase: voucherConfig.apiBase,
                modalId: voucherConfig.modalId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/voucher/partials
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
            const data = await VoucherService.getWithParam(query)
            const table = await renderPartial(
                'admin/partials/voucher/tableVoucher',
                {
                    vouchers: data.vouchers,
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    totalItem: data.totalItem,
                    totalItemPerPage: data.vouchers.length,
                    PAGE_LIMIT: data.PAGE_LIMIT,
                }
            )

            const pagination = await renderPartial(
                'admin/partials/pagination',
                {
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    hrefBase: voucherConfig.hrefBase,
                    apiBase: voucherConfig.apiBase,
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

    // // GET /api/voucher/:id  trả về json
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await VoucherService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // // POST /api/voucher
    async create(req, res, next) {
        try {
            const data = await VoucherService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },

    // // PUT /api/voucher/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            const data = await VoucherService.update(id, req.body)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // // DELETE /api/voucher/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await VoucherService.delete(id)
            return res.json({ success })
        } catch (err) {
            next(err)
        }
    },

    // // /api/voucher/export
    // async export(req, res, next) {
    //     try {
    //         const vouchers = await VoucherService.getAll()
    //         console.log(vouchers);
    //         const excelData = vouchers.map((data) => {
    //             return {
    //                 'Tên tác giả': data.TenTG,
    //                 'Mô tả': data.MoTa,
    //             }
    //         })

    //         const fileBuffer = exportFileExcel(excelData)
    //         const filename = 'DanhSachTacGia.xlsx'

    //         res.setHeader(
    //             'Content-Type',
    //             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    //         )
    //         res.setHeader(
    //             'Content-Disposition',
    //             `attachment; filename="${filename}"`
    //         )
    //         res.setHeader('Content-Length', fileBuffer.length)

    //         res.send(fileBuffer)
    //     } catch (error) {
    //         next(error)
    //     }
    // },
}

export default VoucherController
