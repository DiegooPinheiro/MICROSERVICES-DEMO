const express = require('express');
const router = express.Router();
const controllers = require('./controllers/usersController');

router.post('/', controllers.createUserById);
router.get('/', controllers.getAllUsers);
router.get('/:id', controllers.getUserById);
router.put('/:id', controllers.updateUser);
router.delete('/:id', controllers.deleteUser);

module.exports = router;
