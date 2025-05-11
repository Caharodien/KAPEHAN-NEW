const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get all orders
router.get('/', orderController.getAllOrders);

// Get orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

// Get a single order
router.get('/:id', orderController.getOrderById);

// Create a new order
router.post('/', orderController.createOrder);

// Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// Delete an order (admin only)
router.delete('/:id', orderController.deleteOrder);

module.exports = router;