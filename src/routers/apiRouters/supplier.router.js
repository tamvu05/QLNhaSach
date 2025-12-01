import express from 'express'
import SupplierController from '../../controllers/supplier.controller.js'

const router = express.Router()

router.get('/partials', SupplierController.getPartials)

router.get('/export', SupplierController.export)

router.get('/:id', SupplierController.getById)


router.post('/', SupplierController.create)

router.put('/:id', SupplierController.update)

router.delete('/:id', SupplierController.delete)


export default router
