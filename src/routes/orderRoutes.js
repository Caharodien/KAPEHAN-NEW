const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Example route
router.get('/example', (req, res) => {
  res.json({ message: 'Order route' });
});

// CREATE: Add a new order
router.post('/', orderController.createOrder);

// READ: Get all orders
router.get('/', orderController.getAllOrders);

// READ: Get orders by status (must come before `/:id`)
router.get('/status/:status', orderController.getOrdersByStatus);

// READ: Get a single order by ID
router.get('/:id', orderController.getOrderById);

// UPDATE: Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// DELETE: Delete an order (admin only)
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
