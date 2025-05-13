const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// GET all orders
router.get('/', orderController.getAllOrders);

// GET orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

// GET a single order by ID
router.get('/:id', orderController.getOrderById);

// POST a new order
router.post('/', orderController.createOrder);

// PATCH: update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// DELETE an order (admin only)
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
