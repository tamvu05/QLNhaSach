import express from 'express'
import SachController from '../../controllers/sach.controller.js'
const router = express.Router()

router.get('/', SachController.getAll)

router.get('/:id', SachController.getById)

export default router
