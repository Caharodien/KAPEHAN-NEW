const db = require('../config/database');

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.customer_name,
        o.total_amount,
        o.order_time
      FROM orders o
      ORDER BY o.order_time DESC
    `);

    const formattedOrders = await Promise.all(orders.map(async order => {
      const [items] = await db.query(`
        SELECT 
          menu_item_id, 
          quantity, 
          price
        FROM order_items 
        WHERE order_id = ?`, [order.id]);

      return {
        id: order.id,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        order_time: order.order_time,
        items: items || []  // If no items, return an empty array
      };
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error when fetching orders' });
  }
};

// Get orders by status (modified to work with your schema)
exports.getOrdersByStatus = async (req, res) => {
  const status = req.params.status;

  if (!status || !['pending', 'preparing', 'serving', 'completed'].includes(status)) {
    return res.status(400).json({
      message: 'Valid status required (pending, preparing, serving, completed)'
    });
  }

  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.customer_name,
        o.total_amount,
        o.order_time
      FROM orders o
      ORDER BY o.order_time DESC
    `);

    const formattedOrders = await Promise.all(orders.map(async order => {
      const [items] = await db.query(`
        SELECT 
          menu_item_id, 
          quantity, 
          price
        FROM order_items 
        WHERE order_id = ?`, [order.id]);

      return {
        id: order.id,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        order_time: order.order_time,
        status: status, // Adding status to response
        items: items || []  // If no items, return an empty array
      };
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Server error when fetching orders by status' });
  }
};

// Get a single order
exports.getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.customer_name,
        o.total_amount,
        o.order_time
      FROM orders o
      WHERE o.id = ?`, [req.params.id]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [items] = await db.query(`
      SELECT 
        menu_item_id, 
        quantity, 
        price
      FROM order_items 
      WHERE order_id = ?`, [req.params.id]);

    res.json({
      id: orders[0].id,
      customer_name: orders[0].customer_name,
      total_amount: orders[0].total_amount,
      order_time: orders[0].order_time,
      items: items || []  // If no items, return an empty array
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error when fetching order' });
  }
};

// Create a new order (modified for your schema)
exports.createOrder = async (req, res) => {
  const { customer_name, items } = req.body;

  // Validate required fields
  if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Customer name and items array are required'
    });
  }

  try {
    await db.query('START TRANSACTION');

    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Insert order
    const [orderResult] = await db.query(
      'INSERT INTO orders (customer_name, total_amount) VALUES (?, ?)',
      [customer_name, total_amount]
    );

    // Insert order items
    const itemPromises = items.map(item =>
      db.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, item.menu_item_id, item.quantity, item.price]
      )
    );
    await Promise.all(itemPromises);

    await db.query('COMMIT');

    // Get the created order
    const [orderData] = await db.query(`
      SELECT 
        o.id,
        o.customer_name,
        o.total_amount,
        o.order_time
      FROM orders o
      WHERE o.id = ?`, [orderResult.insertId]);

    const [itemsData] = await db.query(`
      SELECT 
        menu_item_id, 
        quantity, 
        price
      FROM order_items 
      WHERE order_id = ?`, [orderResult.insertId]);

    res.status(201).json({
      id: orderData[0].id,
      customer_name: orderData[0].customer_name,
      total_amount: orderData[0].total_amount,
      order_time: orderData[0].order_time,
      items: itemsData || []  // If no items, return an empty array
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({
      message: 'Server error when creating order',
      error: error.message
    });
  }
};

// Update order status (modified for your schema)
exports.updateOrderStatus = async (req, res) => {
  // Since your schema doesn't have status, we'll return a message
  res.json({
    message: 'Status update not supported in current schema',
    note: 'Your orders table needs a status column to use this feature'
  });
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    await db.query('START TRANSACTION');

    // First delete order items
    await db.query('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);

    // Then delete the order
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);

    await db.query('COMMIT');

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order deleted successfully',
      order_id: req.params.id
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error when deleting order' });
  }
};
