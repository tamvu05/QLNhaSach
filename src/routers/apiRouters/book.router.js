import express from 'express'
import BookController from '../../controllers/book.controller.js'

const router = express.Router()


router.post('/', BookController.create);

router.put('/:id', BookController.update);

router.delete('/:id', BookController.delete);

router.patch('/:id/stock', BookController.updateStock);

export default router