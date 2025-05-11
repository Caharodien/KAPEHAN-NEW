const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Get all menu items
router.get('/', menuController.getAllItems);

// Get menu items by category
router.get('/category/:category', menuController.getItemsByCategory);

// Get a single menu item
router.get('/:id', menuController.getItemById);

// Create a new menu item
router.post('/', menuController.createItem);

// Update a menu item
router.put('/:id', menuController.updateItem);

// Delete a menu item
router.delete('/:id', menuController.deleteItem);

module.exports = router;