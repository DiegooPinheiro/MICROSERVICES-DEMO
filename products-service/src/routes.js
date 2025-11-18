// products-service/src/routes.js
import express from 'express';
import {
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct
} from './controllers/productsController.js';

const router = express.Router();

router.get('/', listProducts);        // GET all products
router.post('/', createProduct);      // CREATE product
router.get('/:id', getProductById);   // GET product by ID
router.put('/:id', updateProduct);    // UPDATE product
router.delete('/:id', deleteProduct); // DELETE product

export default router;
