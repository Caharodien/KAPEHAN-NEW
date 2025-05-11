const db = require('../config/database');

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'item_name', oi.item_name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    // Format response
    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.items[0].id ? order.items : []
    }));
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error when fetching orders' });
  }
};

// Get orders by status
exports.getOrdersByStatus = async (req, res) => {
  const status = req.params.status;
  
  if (!status || !['pending', 'preparing', 'serving', 'completed'].includes(status)) {
    return res.status(400).json({ 
      message: 'Valid status required (pending, preparing, serving, completed)' 
    });
  }
  
  try {
    const [orders] = await db.query(`
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'item_name', oi.item_name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [status]);
    
    // Format response
    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.items[0].id ? order.items : []
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
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'item_name', oi.item_name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ? OR o.order_number = ?
      GROUP BY o.id
    `, [req.params.id, req.params.id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Format response
    const order = {
      ...orders[0],
      items: orders[0].items[0].id ? orders[0].items : []
    };
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error when fetching order' });
  }
};

// Generate unique order number
function generateOrderNumber(orderType) {
  // First letter - D for Dine-In, T for Takeout
  const prefix = orderType === 'Dine-In' ? 'D' : 'T';
  const timestamp = Date.now().toString();
  // Get last 6 digits of timestamp + random 1 digit
  const orderNumber = prefix + timestamp.slice(-6) + Math.floor(Math.random() * 10);
  return orderNumber.slice(0, 8); // Ensure max 8 chars
}

// Create a new order
exports.createOrder = async (req, res) => {
  const { order_type, items, total_amount, payment_method = 'Cash' } = req.body;
  
  // Validate required fields
  if (!order_type || !items || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res.status(400).json({ 
      message: 'Order type, items array, and total amount are required' 
    });
  }
  
  if (!['Dine-In', 'Takeout'].includes(order_type)) {
    return res.status(400).json({ message: 'Order type must be either "Dine-In" or "Takeout"' });
  }
  
  try {
    // Start transaction
    await db.query('START TRANSACTION');
    
    // Get the max priority number
    const [maxPriorityResult] = await db.query('SELECT MAX(priority_number) as max_priority FROM orders');
    const maxPriority = maxPriorityResult[0].max_priority || 0;
    const priorityNumber = maxPriority + 1;
    
    // Generate order number
    const orderNumber = generateOrderNumber(order_type);
    
    // Insert order
    const [orderResult] = await db.query(
      'INSERT INTO orders (order_number, priority_number, order_type, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)',
      [orderNumber, priorityNumber, order_type, total_amount, payment_method, 'pending']
    );
    
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, item_name, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.name, item.quantity || 1, item.price]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    // Get complete order
    const [orderData] = await db.query(`
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'item_name', oi.item_name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);
    
    // Format response
    const createdOrder = {
      ...orderData[0],
      items: orderData[0].items[0].id ? orderData[0].items : []
    };
    
    res.status(201).json(createdOrder);
  } catch (error) {
    // Rollback transaction in case of error
    await db.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error when creating order' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  
  if (!status || !['pending', 'preparing', 'serving', 'completed'].includes(status)) {
    return res.status(400).json({ 
      message: 'Valid status is required (pending, preparing, serving, completed)' 
    });
  }
  
  try {
    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ? OR order_number = ?',
      [status, id, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get updated order
    const [orders] = await db.query(`
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'item_name', oi.item_name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ? OR o.order_number = ?
      GROUP BY o.id
    `, [id, id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Format response
    const order = {
      ...orders[0],
      items: orders[0].items[0].id ? orders[0].items : []
    };
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error when updating order status' });
  }
};

// Delete an order (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM orders WHERE id = ? OR order_number = ?',
      [req.params.id, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error when deleting order' });
  }
};  