import SupplierService from "../services/supplier.service.js"
import { supplierConfig } from "../configs/adminView.config.js"
import exportFileExcel from '../utils/exportFileExcel.js'

const SupplierController = {
    // GET /admin/supplier
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await SupplierService.getWithParam(query)
            res.render('admin/viewManager', {
                suppliers: data.suppliers,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.suppliers.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: supplierConfig.scripts,
                entityName: supplierConfig.entityName,
                tablePartial: supplierConfig.tablePartial,
                modalAddSelector: supplierConfig.modalAddSelector,
                modalAddPartial: supplierConfig.modalAddPartial,
                // modalUpdatePartial: supplierConfig.modalUpdatePartial,
                hrefBase: supplierConfig.hrefBase,
                apiBase: supplierConfig.apiBase,
                modalAddId: supplierConfig.modalAddId,
                modalUpdateId: supplierConfig.modalUpdateId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/supplier/partials
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
            const data = await SupplierService.getWithParam(query)
            const table = await renderPartial(
                'admin/partials/supplier/tableSupplier',
                {
                    suppliers: data.suppliers,
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    totalItem: data.totalItem,
                    totalItemPerPage: data.suppliers.length,
                    PAGE_LIMIT: data.PAGE_LIMIT,
                }
            )

            const pagination = await renderPartial(
                'admin/partials/pagination',
                {
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    hrefBase: supplierConfig.hrefBase,
                    apiBase: supplierConfig.apiBase,
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

    // GET /api/supplier/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await SupplierService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // POST /api/supplier
    async create(req, res, next) {
        try {
            const supplierId = await SupplierService.create(req.body)
            res.json(supplierId)
        } catch (error) {
            next(error)
        }
    },

    // PUT /api/supplier/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            console.log(req.body)
            const data = await SupplierService.update(id, req.body)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    
    // DELETE /api/supplier/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await SupplierService.delete(id)
            return res.json({ success })
        } catch (err) {
            next(err)
        }
    },

    // /api/supplier/export 
    async export(req, res, next) {
        try {
            const suppliers = await SupplierService.getAll()
            console.log(suppliers);
            const excelData = suppliers.map(data => {
                return {
                    'Tên nhà cung cấp': data.TenNCC,
                    'Địa chỉ': data.DiaChi,
                    'Số điện thoại': data.SDT
                }
            })

            const fileBuffer = exportFileExcel(excelData)
            const filename = 'DanhSachNhaCungCap.xlsx'
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.setHeader('Content-Length', fileBuffer.length)

            res.send(fileBuffer)
        } catch (error) {
            next(error)
        }
    },
}

export default SupplierController