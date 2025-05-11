const db = require('../config/database');

// Get all menu items
exports.getAllItems = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items ORDER BY category, name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error when fetching menu items' });
  }
};

// Get menu items by category (hot/cold)
exports.getItemsByCategory = async (req, res) => {
  const category = req.params.category;
  
  if (!category || !['hot', 'cold'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category. Use "hot" or "cold".' });
  }
  
  try {
    const [rows] = await db.query('SELECT * FROM menu_items WHERE category = ? ORDER BY name', [category]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ message: 'Server error when fetching menu items by category' });
  }
};

// Get a single menu item
exports.getItemById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    
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
  const { name, description, price, category, image_url } = req.body;
  
  if (!name || !price || !category || !['hot', 'cold'].includes(category)) {
    return res.status(400).json({ 
      message: 'Name, price and valid category (hot/cold) are required' 
    });
  }
  
  try {
    const [result] = await db.query(
      'INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, category, image_url]
    );
    
    const [newItem] = await db.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error when creating menu item' });
  }
};

// Update menu item
exports.updateItem = async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  const id = req.params.id;
  
  try {
    if (category && !['hot', 'cold'].includes(category)) {
      return res.status(400).json({ message: 'Category must be either "hot" or "cold"' });
    }
    
    const [result] = await db.query(
      'UPDATE menu_items SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price), category = COALESCE(?, category), image_url = COALESCE(?, image_url) WHERE id = ?',
      [name || null, description || null, price || null, category || null, image_url || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    const [updatedItem] = await db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    
    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error when updating menu item' });
  }
};

// Delete menu item
exports.deleteItem = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error when deleting menu item' });
  }
};