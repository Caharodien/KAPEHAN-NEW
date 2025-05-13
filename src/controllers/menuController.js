const db = require('../config/database');

// Helper function to check if column exists
async function columnExists(columnName) {
  const [check] = await db.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = ?
  `, [process.env.DB_NAME, columnName]);
  return check.length > 0;
}

// Get all menu items (with dynamic column checking)
exports.getAllItems = async (req, res) => {
  try {
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'menu_items'
    `, [process.env.DB_NAME]);

    const availableColumns = columns.map(col => col.COLUMN_NAME);

    const selectFields = [
      availableColumns.includes('id') ? 'id' : null,
      availableColumns.includes('name') ? 'name' : null,
      availableColumns.includes('description') ? 'description' : null,
      availableColumns.includes('price') ? 'FORMAT(price, 2) as price' : null,
      availableColumns.includes('is_available') ? 'is_available' : null,
      availableColumns.includes('category') ? 'category' : null,
      availableColumns.includes('image_url') ? 'image_url' : null,
      availableColumns.includes('created_at') ? "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.0002') as created_at" : null
    ].filter(Boolean);

    if (selectFields.length === 0) {
      return res.status(200).json([]);
    }

    const orderBy = [];
    if (availableColumns.includes('category')) orderBy.push('category');
    if (availableColumns.includes('name')) orderBy.push('name');
    const orderByClause = orderBy.length > 0 ? `ORDER BY ${orderBy.join(', ')}` : '';

    const [rows] = await db.query(`
      SELECT ${selectFields.join(', ')}
      FROM menu_items
      ${orderByClause}
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error when fetching menu items' });
  }
};

// Get menu items by category
exports.getItemsByCategory = async (req, res) => {
  const category = req.params.category;

  if (!category || !['hot', 'cold'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category. Use "hot" or "cold".' });
  }

  try {
    if (!(await columnExists('category'))) {
      return res.status(400).json({ message: 'Category filtering not available' });
    }

    const [rows] = await db.query(`
      SELECT 
        id,
        name,
        description,
        FORMAT(price, 2) as price,
        ${await columnExists('is_available') ? 'is_available,' : ''}
        category,
        ${await columnExists('image_url') ? 'image_url,' : ''}
        ${await columnExists('created_at') ? "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.0002') as created_at" : ''}
      FROM menu_items 
      WHERE category = ? 
      ORDER BY name
    `, [category]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ message: 'Server error when fetching menu items by category' });
  }
};

// Get a single menu item
exports.getItemById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        name,
        description,
        FORMAT(price, 2) as price,
        ${await columnExists('is_available') ? 'is_available,' : ''}
        ${await columnExists('category') ? 'category,' : ''}
        ${await columnExists('image_url') ? 'image_url,' : ''}
        ${await columnExists('created_at') ? "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.0002') as created_at" : ''}
      FROM menu_items 
      WHERE id = ?`, 
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Server error when fetching menu item' });
  }
};

// Add new menu item
exports.createItem = async (req, res) => {
  const { name, description, price, is_available, category, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  try {
    const columns = ['name', 'description', 'price'];
    const values = [name, description || null, price];

    if (await columnExists('is_available')) {
      columns.push('is_available');
      values.push(is_available !== undefined ? is_available : true);
    }

    if (await columnExists('category')) {
      if (category && !['hot', 'cold'].includes(category)) {
        return res.status(400).json({ message: 'Category must be either "hot" or "cold"' });
      }
      columns.push('category');
      values.push(category || 'hot');
    }

    if (await columnExists('image_url')) {
      columns.push('image_url');
      values.push(image_url || null);
    }

    const [result] = await db.query(
      `INSERT INTO menu_items (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values
    );

    const [newItem] = await db.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error when creating menu item', error: error.message });
  }
};

// Update menu item
exports.updateItem = async (req, res) => {
  const { name, description, price, is_available, category, image_url } = req.body;
  const id = req.params.id;

  try {
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }

    if (await columnExists('is_available') && is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(is_available);
    }

    if (await columnExists('category') && category !== undefined) {
      if (!['hot', 'cold'].includes(category)) {
        return res.status(400).json({ message: 'Category must be either "hot" or "cold"' });
      }
      updates.push('category = ?');
      values.push(category);
    }

    if (await columnExists('image_url') && image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(id);

    const [result] = await db.query(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const [updatedItem] = await db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error when updating menu item', error: error.message });
  }
};

// Delete menu item
exports.deleteItem = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error when deleting menu item', error: error.message });
  }
};
