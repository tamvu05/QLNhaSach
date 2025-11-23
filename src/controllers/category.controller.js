import CategoryService from '../services/category.service.js'

const CategoryController = {
    // --- PHẦN CHO USER (Giao diện khách hàng) ---

    // GET /category
    async userGetAll(req, res, next) {
        try {
            // 1. Gọi Service lấy dữ liệu
            const categories = await CategoryService.getAll()

            // 2. Render ra View
            res.render('user/category', {
                title: 'Danh mục Thể loại', // Tiêu đề tab
                categories: categories, // Dữ liệu truyền sang
                path: '/category', // 💡 Tín hiệu để sáng đèn menu Thể loại
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /api/category/:id (API trả về JSON nếu cần, hoặc redirect sang trang Book)
    async userGetById(req, res, next) {
        try {
            const { id } = req.params
            const data = await CategoryService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // --- PHẦN CHO ADMIN (Giữ nguyên khung sườn cũ của cậu) ---

    // GET /admin/category
    async getViewManager(req, res, next) {
        try {
            const query = req.query
            const data = await CategoryService.getWithParam(query)
            res.render('admin/viewManager', {
                scripts: ['/js/category.admin.js'],
                categories: data.categories,
                currentPage: data.currentPage,
                totalPage: data.totalPage,
                totalItem: data.totalItem,
                totalItemPerPage: data.categories.length,
                PAGE_LIMIT: data.PAGE_LIMIT,
                entityName: 'thể loại',
                tablePartial: 'partials/category/tableCategory',
                modalAddSelector: '#add-category-modal',
                modalAddPartial: 'partials/category/modalAddCategory',
                modalUpdatePartial: 'partials/category/modalUpdateCategory',
                hrefPagination: '/admin/category/',
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
            const data = await CategoryService.getWithParam(query)
            const table = await renderPartial(
                'admin/partials/category/tableCategory',
                {
                    categories: data.categories,
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    totalItem:  data.totalItem,
                    totalItemPerPage: data.categories.length,
                    PAGE_LIMIT: data.PAGE_LIMIT,
                }
            )

            const pagination = await renderPartial(
                'admin/partials/pagination',
                {
                    currentPage: data.currentPage,
                    totalPage: data.totalPage,
                    hrefPagination: '/admin/category/',
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

    // GET /api/category/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await CategoryService.getById(id)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // POST /api/category
    async create(req, res, next) {
        try {
            const data = await CategoryService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            console.log(err)
            next(err)
        }
    },

    // PUT /api/category/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            const data = await CategoryService.update(id, req.body)
            return res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // DELETE /api/category/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await CategoryService.delete(id)
            return res.json({ success })
        } catch (err) {
            next(err)
        }
    },
}

export default CategoryController
