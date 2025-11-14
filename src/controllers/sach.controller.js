import SachService from '../services/sach.service.js'

const SachController = {
    // GET /sach
    async getAll(req, res, next) {
        try {
            const data = await SachService.getAll()
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // GET /sach/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params
            const data = await SachService.getById(id)
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // POST /sach
    async create(req, res, next) {
        try {
            const data = await SachService.create(req.body)
            res.status(201).json(data)
        } catch (err) {
            next(err)
        }
    },

    // PUT /sach/:id
    async update(req, res, next) {
        try {
            const { id } = req.params
            const data = await SachService.update(id, req.body)
            res.json(data)
        } catch (err) {
            next(err)
        }
    },

    // DELETE /sach/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const success = await SachService.delete(id)
            res.json({ success })
        } catch (err) {
            next(err)
        }
    },

    // PATCH /sach/:id/stock
    async updateStock(req, res, next) {
        try {
            const { id } = req.params
            const { amount } = req.body

            const data = await SachService.updateStock(id, Number(amount))
            res.json(data)
        } catch (err) {
            next(err)
        }
    },
}

export default SachController
