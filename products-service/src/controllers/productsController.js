// products-service/src/controllers/productsController.js
import { v4 as uuidv4 } from 'uuid';

const products = [];

// GET /products - List all products
export const listProducts = (req, res) => {
    res.json(products);
};

// POST /products - Create new product
export const createProduct = (req, res) => {
    const { name, price } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    if (isNaN(price)) {
        return res.status(400).json({ error: 'Price must be a number' });
    }

    const product = {
        id: uuidv4(),
        name,
        price: Number(price),
        createdAt: new Date().toISOString()
    };

    products.push(product);
    res.status(201).json(product);
};

// GET /products/:id - Get product by ID
export const getProductById = (req, res) => {
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
};

// PUT /products/:id - Update product
export const updateProduct = (req, res) => {
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price } = req.body;

    if (name) product.name = name;
    if (price !== undefined) {
        if (isNaN(price)) {
            return res.status(400).json({ error: 'Price must be a number' });
        }
        product.price = Number(price);
    }

    res.json(product);
};

// DELETE /products/:id - Delete product
export const deleteProduct = (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    products.splice(index, 1);
    res.status(204).send();
};
