const {v4: uuidv4} = require('uuid');
const users = [];


//POST /products/ - Get all products (for demonstration, usually would be GET)
exports.getAllProducts = (req, res) => {
    res.json(products );
};
//POST /products/ - Get all products by ID (for demonstration, usually would be GET)
exports.createProductById = (req, res) => {
    const { name, price } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

    const product = { id: uuidv4(), name, price, createdAt: new Date().toDateString() };
    products.push(product);
    res.status(201).json(product);
};

//GET /products/ - Get all products
exports.listProducts = (req, res) => {
    res.json(products);
};

//GET /products/:id - Get product  by ID
exports.getProductById = (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
};

//PUT /products/:id - Update product
exports.updateProduct = (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });


//DELETE /users/:id - Delete user
    const { name, price } = req.body;
    if (name) product.name = name;
    if (price) product.price = price;
    res.json(product);
};
exports.deleteProduct = (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    products.splice(index, 1);
    res.status(204).send();
};



