const {v4: uuidv4} = require('uuid');
const users = [];


//POST /geteway/ - Get all geteway (for demonstration, usually would be GET)
exports.getAllGeteway = (req, res) => {
    res.json(geteway);
};

//POST /geteway/ - Get all geteway by ID (for demonstration, usually would be GET)
exports.createGetewayById = (req, res) => {
    const { name, price } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

    const geteway = { id: uuidv4(), name, price, createdAt: new Date().toDateString() };
    geteway.push(geteway);
    res.status(201).json(geteway);
};

//GET /geteway/ - Get all geteway
exports.listGeteway = (req, res) => {
    res.json(geteway);
};

//GET /geteway/:id - Get geteway  by ID
exports.getGetewayById = (req, res) => {
    const geteway = geteway.find(p => p.id === req.params.id);
    if (!geteway) return res.status(404).json({ error: 'Geteway not found' });
    res.json(geteway);
};

//PUT /geteway/:id - Update geteway
exports.updateGeteway = (req, res) => {
    const geteway = geteway.find(p => p.id === req.params.id);
    if (!geteway) return res.status(404).json({ error: 'Geteway not found' });


//DELETE /geteway/:id - Delete geteway
    const { name, price } = req.body;
    if (name) geteway.name = name;
    if (price) geteway.price = price;
    res.json(geteway);
};
exports.deleteGeteway = (req, res) => {
    const index = geteway.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Geteway not found' });
    geteway.splice(index, 1);
    res.status(204).send();
};



