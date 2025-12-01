import express from 'express'
import BookController from '../../controllers/book.controller.js'
import { createUploadMiddleware } from '../../middlewares/upload.js';

const router = express.Router()

router.get('/partials', BookController.getPartials)

router.get('/export', BookController.export)

router.get('/:id', BookController.getById)

router.post('/', createUploadMiddleware('HinhAnh'), BookController.create);

router.put('/:id', createUploadMiddleware('HinhAnh'), BookController.update);

router.delete('/:id', BookController.delete);

router.patch('/:id/stock', BookController.updateStock);

export default router