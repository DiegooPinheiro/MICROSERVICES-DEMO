// users-service/src/routes.js
import express from 'express';
import {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
} from './controllers/usersController.js';

const router = express.Router();

// CRUD Users
router.get('/', listUsers);        // List all users
router.post('/', createUser);      // Create user
router.get('/:id', getUserById);   // Get user by ID
router.put('/:id', updateUser);    // Update user
router.delete('/:id', deleteUser); // Delete user

export default router;
