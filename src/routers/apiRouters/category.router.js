import express from 'express'
import CategoryController from '../../controllers/category.controller.js'

const router = express.Router()

router.post('/', CategoryController.create)

router.put('/:id', CategoryController.update)

router.delete('/:id', CategoryController.delete)

export default router
