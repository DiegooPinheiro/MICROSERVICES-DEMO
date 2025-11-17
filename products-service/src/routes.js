import express from 'express';
const router = express.Router();
import { createProductById, listProducts, getProductById, updateProduct, deleteProduct } from './controllers/productsController.js';

router.post('/', createProductById);
router.get('/', listProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
