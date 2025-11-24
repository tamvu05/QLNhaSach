import AuthorService from '../services/author.service.js'
import { authorConfig } from '../configs/adminView.config.js'
import exportFileExcel from '../utils/exportFileExcel.js'

const AuthorController = {
    /**
     * API ADMIN
     */

    // /admin/author
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await AuthorService.getWithParam(query)
            res.render('admin/viewManager', {
                authors: data.authors,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.authors.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: authorConfig.scripts,
                entityName: authorConfig.entityName,
                tablePartial: authorConfig.tablePartial,
                modalAddSelector: authorConfig.modalAddSelector,
                modalAddPartial: authorConfig.modalAddPartial,
                modalUpdatePartial: authorConfig.modalUpdatePartial,
                hrefBase: authorConfig.hrefBase,
                apiBase: authorConfig.apiBase,
                modalAddId: authorConfig.modalAddId,
                modalUpdateId: authorConfig.modalUpdateId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/category/partials
    // Lấy table view và pagination dưới dạng json
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
            const data = await AuthorService.getWithParam(query)
            const table = await renderPartial(
                'admin/partials/author/tableAuthor',
                {
                    authors: data.authors,
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    totalItem: data.totalItem,
                    totalItemPerPage: data.authors.length,
                    PAGE_LIMIT: data.PAGE_LIMIT,
                }
            )

            const pagination = await renderPartial(
                'admin/partials/pagination',
                {
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    hrefBase: authorConfig.hrefBase,
                    apiBase: authorConfig.apiBase,
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

    // GET /api/author/:id  trả về json
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await AuthorService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // GET /api/author
    // async getAll(req, res, next) {
    //     try {
    //         const data = await AuthorService.getAll()
    //         return res.json(data)
    //     } catch (err) {
    //         next(err)
    //     }
    // },

    // POST /api/author
    async create(req, res, next) {
        try {
            const data = await AuthorService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },

    // PUT /api/author/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            const data = await AuthorService.update(id, req.body)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // DELETE /api/author/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await AuthorService.delete(id)
            return res.json({ success })
        } catch (err) {
            next(err)
        }
    },

    // /api/category/export
    async export(req, res, next) {
        try {
            const authors = await AuthorService.getAll()
            const excelData = authors.map((data) => {
                return {
                    'Tên tác giả': data.TenTG,
                    'Mô tả': data.MoTa,
                }
            })

            const fileBuffer = exportFileExcel(excelData)
            const filename = 'DanhSachTacGia.xlsx'

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${filename}"`
            )
            res.setHeader('Content-Length', fileBuffer.length)

            res.send(fileBuffer)
        } catch (error) {
            next(error)
        }
    },
}

export default AuthorController
