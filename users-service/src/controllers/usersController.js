import { v4 as uuidv4 } from 'uuid';
const users = [];


//POST /users/ - Get all users (for demonstration, usually would be GET)
export const getAllUsers = (req, res) => {
    res.json(users);
};
//POST /users/ - Get all users (for demonstration, usually would be GET)
export const createUserById = (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const user = { id: uuidv4(), name, email, createdAt: new Date().toDateString() };
    users.push(user);
    res.status(201).json(user);
};

//GET /users/ - Get all users
export const listUsers = (req, res) => {
    res.json(users);
};

//GET /users/:id - Get user by ID
export const getUserById = (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
};
//PUT /users/:id - Update user
export const updateUser = (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { name, email } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    res.json(user);
};
//DELETE /users/:id - Delete user
export const deleteUser = (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(index, 1);
    res.status(204).send();
};

