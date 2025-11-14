const express = require('express');
const router = express.Router();
const controllers = require('./controllers/productsController');

router.post('/', controllers.createProductById);
router.get('/', controllers.listProducts);
router.get('/:id', controllers.getProductById);
router.put('/:id', controllers.updateProduct);
router.delete('/:id', controllers.deleteProduct);

module.exports = router;