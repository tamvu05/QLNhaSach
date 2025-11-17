import CategoryService from  '../services/category.service.js'

const CategoryController = {
    // GET /admin/category
    async getAll(req, res, next) {
        try {
            const data = await CategoryService.getAll()
            console.log(data);
            res.render('admin/category', {
                title: 'Admin Dashboard',
                data,
                scripts: ['/js/category.admin.js']
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /admin/category/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await CategoryService.getById(id)
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

// GET /category
    async userGetAll(req, res, next) {
        try {
            const data = await CategoryService.getAll()
             res.render('user/category', {
                title: 'Nhà sách ...',
                layout: res.userLayout,
                data
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /category/:id
    async userGetById(req, res, next) {
        try {
            const { id } = req.params
            const data = await CategoryService.getById(id)
            res.json(data)
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
            next(err)
        }
    },

    // PUT /api/category/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            const data = await CategoryService.update(id, req.body)
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // DELETE /api/category/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await CategoryService.delete(id)
            res.json({ success })
        } catch (err) {
            next(err)
        }
    },
}

export default CategoryController
