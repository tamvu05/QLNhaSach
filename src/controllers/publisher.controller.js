import PublisherService from '../services/publisher.service.js'
import { publisherConfig } from '../configs/adminView.config.js'
import exportFileExcel from '../utils/exportFileExcel.js'

const PublisherController = {

    /**
     * API ADMIN
     */

    // /admin/publisher
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await PublisherService.getWithParam(query)
            res.render('admin/viewManager', {
                publishers: data.publishers,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.publishers.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: publisherConfig.scripts,
                entityName: publisherConfig.entityName,
                tablePartial: publisherConfig.tablePartial,
                modalAddSelector: publisherConfig.modalAddSelector,
                modalAddPartial: publisherConfig.modalAddPartial,
                modalUpdatePartial: publisherConfig.modalUpdatePartial,
                hrefBase: publisherConfig.hrefBase,
                apiBase: publisherConfig.apiBase,
                modalAddId: publisherConfig.modalAddId,
                modalUpdateId: publisherConfig.modalUpdateId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/publisher/partials
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
            const data = await PublisherService.getWithParam(query)
            const table = await renderPartial(
                'admin/partials/publisher/tablePublisher',
                {
                    publishers: data.publishers,
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    totalItem: data.totalItem,
                    totalItemPerPage: data.publishers.length,
                    PAGE_LIMIT: data.PAGE_LIMIT,
                }
            )

            const pagination = await renderPartial(
                'admin/partials/pagination',
                {
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    hrefBase: publisherConfig.hrefBase,
                    apiBase: publisherConfig.apiBase,
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
    // // GET /api/publisher
    // async getAll(req, res, next) {
    //     try {
    //         const data = await PublisherService.getAll()
    //         return res.json(data)
    //     } catch (err) {
    //         next(err)
    //     }
    // },

    // GET /api/publisher/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await PublisherService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // POST /api/publisher
    async create(req, res, next) {
        try {
            const data = await PublisherService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },

    // PUT /api/publisher/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            console.log(req.body)
            const data = await PublisherService.update(id, req.body)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // DELETE /api/publisher/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await PublisherService.delete(id)
            return res.json({ success })
        } catch (err) {
            next(err)
        }
    },

    // /api/publisher/export 
    async export(req, res, next) {
        try {
            const publishers = await PublisherService.getAll()
            console.log(publishers);
            const excelData = publishers.map(data => {
                return {
                    'Tên nhà xuất bản': data.TenNXB,
                    'Mô tả': data.MoTa,
                }
            })

            const fileBuffer = exportFileExcel(excelData)
            const filename = 'DanhSachNhaXuatBan.xlsx'
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.setHeader('Content-Length', fileBuffer.length)

            res.send(fileBuffer)
        } catch (error) {
            next(error)
        }
    },
}

export default PublisherController
