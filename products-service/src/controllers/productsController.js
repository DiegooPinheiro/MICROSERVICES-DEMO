import { v4 as uuidv4 } from 'uuid';
const products = [];


//POST /products/ - Get all products (for demonstration, usually would be GET)
export const getAllProducts = (req, res) => {
    res.json(products );
};
//POST /products/ - Get all products by ID (for demonstration, usually would be GET)
export const createProductById = (req, res) => {
    const { name, price } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

    const product = { id: uuidv4(), name, price, createdAt: new Date().toDateString() };
    products.push(product);
    res.status(201).json(product);
};

//GET /products/ - Get all products
export const listProducts = (req, res) => {
    res.json(products);
};

//GET /products/:id - Get product  by ID
export const getProductById = (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
};

//PUT /products/:id - Update product
export const updateProduct = (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });


//DELETE /users/:id - Delete user
    const { name, price } = req.body;
    if (name) product.name = name;
    if (price) product.price = price;
    res.json(product);
};
export const deleteProduct = (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    products.splice(index, 1);
    res.status(204).send();
};



