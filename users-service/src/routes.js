import express from 'express';
const router = express.Router();
import { createUserById, getAllUsers, getUserById, updateUser, deleteUser } from './controllers/usersController.js';

router.post('/', createUserById);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
