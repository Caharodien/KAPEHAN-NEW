const db = require('../config/database');

// Get all orders with detailed items
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.coffee_type,
        o.priority_number,
        o.total_amount,
        o.payment_method,
        o.status,
        o.created_at as order_time
      FROM orders o
      ORDER BY o.status, o.priority_number, o.created_at DESC
    `);

    const formattedOrders = await Promise.all(orders.map(async order => {
      const [items] = await db.query(`
        SELECT 
          product_name, 
          quantity, 
          unit_price as price
        FROM order_items 
        WHERE order_id = ?`, [order.id]);

      return {
        id: order.id,
        order_number: order.order_number,
        order_type: order.order_type,
        coffee_type: order.coffee_type,
        priority_number: order.priority_number,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        status: order.status,
        order_time: order.order_time,
        items: items || []
      };
    }));

    res.json({ 
      success: true,
      orders: formattedOrders 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error when fetching orders' 
    });
  }
};

// Get orders by status
exports.getOrdersByStatus = async (req, res) => {
  const status = req.params.status;

  if (!status || !['Pending', 'Preparing', 'Ready', 'Completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status required (Pending, Preparing, Ready, Completed)'
    });
  }

  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.priority_number,
        o.total_amount,
        o.created_at as order_time
      FROM orders o
      WHERE o.status = ?
      ORDER BY o.priority_number, o.created_at DESC
    `, [status]);

    const formattedOrders = await Promise.all(orders.map(async order => {
      const [items] = await db.query(`
        SELECT 
          product_name, 
          quantity, 
          unit_price as price
        FROM order_items 
        WHERE order_id = ?`, [order.id]);

      return {
        id: order.id,
        order_number: order.order_number,
        order_type: order.order_type,
        priority_number: order.priority_number,
        total_amount: order.total_amount,
        order_time: order.order_time,
        status: status,
        items: items || []
      };
    }));

    res.json({ 
      success: true,
      orders: formattedOrders 
    });
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error when fetching orders by status' 
    });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.coffee_type,
        o.priority_number,
        o.total_amount,
        o.payment_method,
        o.status,
        o.created_at as order_time
      FROM orders o
      WHERE o.id = ?`, [req.params.id]);

    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    const [items] = await db.query(`
      SELECT 
        product_name, 
        quantity, 
        unit_price as price
      FROM order_items 
      WHERE order_id = ?`, [req.params.id]);

    res.json({
      success: true,
      order: {
        id: orders[0].id,
        order_number: orders[0].order_number,
        order_type: orders[0].order_type,
        coffee_type: orders[0].coffee_type,
        priority_number: orders[0].priority_number,
        total_amount: orders[0].total_amount,
        payment_method: orders[0].payment_method,
        status: orders[0].status,
        order_time: orders[0].order_time,
        items: items || []
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error when fetching order' 
    });
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  const { order_type, coffee_type, items, total_amount, payment_method = 'Cash' } = req.body;

  // Validate required fields
  if (!order_type || !items || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res.status(400).json({
      success: false,
      message: 'Order type, items array, and total amount are required'
    });
  }

  try {
    await db.query('START TRANSACTION');

    // Generate order number (e.g., ORD-20230515-001)
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [lastOrder] = await db.query('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
    const sequence = lastOrder.length > 0 ? lastOrder[0].id + 1 : 1;
    const order_number = `ORD-${datePart}-${sequence.toString().padStart(3, '0')}`;
    
    // Generate priority number
    const [pendingOrders] = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE status IN ("Pending", "Preparing")'
    );
    const priority_number = pendingOrders[0].count + 1;

    // Create order
    const [result] = await db.query(
      `INSERT INTO orders 
        (order_number, order_type, coffee_type, priority_number, total_amount, payment_method) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_number, order_type, coffee_type, priority_number, total_amount, payment_method]
    );
    
    const orderId = result.insertId;

    // Add order items
    const itemPromises = items.map(item =>
      db.query(
        `INSERT INTO order_items 
          (order_id, product_name, quantity, unit_price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.name, item.quantity, item.price]
      )
    );
    await Promise.all(itemPromises);

    await db.query('COMMIT');

    // Get the created order with items
    const [orderData] = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.coffee_type,
        o.priority_number,
        o.total_amount,
        o.payment_method,
        o.status,
        o.created_at as order_time
      FROM orders o
      WHERE o.id = ?`, [orderId]);

    const [itemsData] = await db.query(`
      SELECT 
        product_name, 
        quantity, 
        unit_price as price
      FROM order_items 
      WHERE order_id = ?`, [orderId]);

    res.status(201).json({
      success: true,
      order: {
        id: orderData[0].id,
        order_number: orderData[0].order_number,
        order_type: orderData[0].order_type,
        coffee_type: orderData[0].coffee_type,
        priority_number: orderData[0].priority_number,
        total_amount: orderData[0].total_amount,
        payment_method: orderData[0].payment_method,
        status: orderData[0].status,
        order_time: orderData[0].order_time,
        items: itemsData || []
      }
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when creating order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status || !['Pending', 'Preparing', 'Ready', 'Completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status required (Pending, Preparing, Ready, Completed)'
    });
  }

  try {
    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?', 
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({ 
      success: true,
      message: 'Order status updated successfully',
      order_id: orderId,
      new_status: status
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error when updating order status' 
    });
  }
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
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully',
      order_id: req.params.id
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error when deleting order' 
    });
  }
};