const express = require('express');
const routes = require('./routes');
const controllers = require('./controllers/productController');

router.post('/', controllers.getAllUsers);
router.post('/:id', controllers.createUserById);
router.get('/', controllers.getAllUsers);
router.get('/:id', controllers.getUserById);
router.put('/:id', controllers.updateUser);
router.delete('/:id', controllers.deleteUser);


module.exports = router;