import BookService from '../services/book.service.js'

const BookController = {
    // GET /admin/book
    async getAll(req, res, next) {
        try {
            const data = await BookService.getAll()
            res.render('admin/book', {
                title: 'Admin Dashboard',
                data
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /admin/book/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await BookService.getById(id)
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // GET /book
    async userGetAll(req, res, next) {
        try {
            const data = await BookService.getAll()
            res.render('user/book', {
                title: 'Nhà sách ...',
                layout: res.userLayout,
                data
            })
        } catch (err) {
            next(err)
        }
    },

    // GET /book/:id
    async userGetById(req, res, next) {
        try {
            const { id } = req.params
            const data = await BookService.getById(id)
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // POST /api/book
    async create(req, res, next) {
        try {
            const data = await BookService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },

    // PUT /api/book/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            const data = await BookService.update(id, req.body)
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // DELETE /api/book/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await BookService.delete(id)
            res.json({ success })
        } catch (err) {
            next(err)
        }
    },

    // PATCH /api/book/:id/stock
    async updateStock(req, res, next) {
        try {
            const { id } = req.params
            const { amount } = req.body

            const data = await BookService.updateStock(id, Number(amount))
            res.json(data)
        } catch (err) {
            next(err)
        }
    },
}

export default BookController
