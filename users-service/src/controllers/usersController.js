// users-service/src/controllers/usersController.js
import { v4 as uuidv4 } from 'uuid';

const users = [];

// GET /users - List all users
export const listUsers = (req, res) => {
    res.json(users);
};

// POST /users - Create new user
export const createUser = (req, res) => {
    const { name, email } = req.body || {};

    if (!name || !email) {
        return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    // Check if email already exists
    const emailExists = users.some(u => u.email === email);
    if (emailExists) {
        return res.status(400).json({ error: "Email já cadastrado" });
    }

    const user = {
        id: uuidv4(),
        name,
        email,
        createdAt: new Date().toISOString()
    };

    users.push(user);
    res.status(201).json(user);
};

// GET /users/:id - Get user by id
export const getUserById = (req, res) => {
    const user = users.find(u => u.id === req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
};

// PUT /users/:id - Update user
export const updateUser = (req, res) => {
    const user = users.find(u => u.id === req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, email } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;

    res.json(user);
};

// DELETE /users/:id - Delete user
export const deleteUser = (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);

    if (index === -1) return res.status(404).json({ error: "User not found" });

    users.splice(index, 1);
    res.status(204).send();
};