import { employeeConfig } from '../configs/adminView.config.js'
import exportFileExcel from '../utils/exportFileExcel.js'
import EmployeeService from '../services/employee.service.js'

const EmployeeController = {
    // /admin/employee
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await EmployeeService.getWithParam(query)
            res.render('admin/employee', {
                employees: data.employees,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.employees.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                scripts: employeeConfig.scripts,
                hrefBase: employeeConfig.hrefBase,
                apiBase: employeeConfig.apiBase,
                modalId: employeeConfig.modalId,
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/employee/partials
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
            const data = await EmployeeService.getWithParam(query)
            const table = await renderPartial('admin/partials/employee/tableEmployee', {
                employees: data.employees,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.employees.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
            })

            const pagination = await renderPartial('admin/partials/pagination', {
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                hrefBase: employeeConfig.hrefBase,
                apiBase: employeeConfig.apiBase,
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

    // GET /api/employee/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await EmployeeService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // GET /admin/profile
    async profile(req, res, next) {
        try {
            const MaNV = req?.session?.account?.MaNV

            if (!MaNV) {
                return res.redirect('/login')
            }

            const employee = await EmployeeService.getById(MaNV)

            res.render('admin/profile.ejs', {
                account: employee,
            })
        } catch (err) {
            next(err)
        }
    },

    // POST /api/employee
    async create(req, res, next) {
        try {
            const data = await EmployeeService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },

    // PUT /api/employee/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            const data = await EmployeeService.update(id, req.body)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // // // DELETE /api/employee/:id
    // async delete(req, res, next) {
    //     try {
    //         const { id } = req.params
    //         const success = await EmployeeService.delete(id)
    //         return res.json({ success })
    //     } catch (err) {
    //         next(err)
    //     }
    // },

    // // /api/employee/export
    // async export(req, res, next) {
    //     try {
    //         const employees = await EmployeeService.getAll()
    //         console.log(employees);
    //         const excelData = employees.map((data) => {
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

export default EmployeeController
