import express from 'express'
import EmployeeController from '../../controllers/employee.controller.js'

const router = express.Router()

router.get('/partials', EmployeeController.getPartials)
router.get('/:id', EmployeeController.getById)
router.post('/', EmployeeController.create)
router.put('/:id', EmployeeController.update)
router.delete('/:id', EmployeeController.delete)

export default router
