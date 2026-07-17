const { pool: getPool } = require('../config/db');

// Get all logos
exports.getLogos = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM logos ORDER BY created_at DESC');
    res.json({ success: true, logos: rows });
  } catch (error) {
    console.error('Error fetching logos:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// Add a new logo
exports.addLogo = async (req, res) => {
  try {
    const { name, image, type, width, height, mrp, offer, offer_price, status, is_default, description } = req.body;

    if (!name || !image || !width || !height) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const pool = getPool();

    const [result] = await pool.query(
      `INSERT INTO logos (name, image, type, width, height, mrp, offer, offer_price, status, is_default, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        image,
        type || 'Header',
        width,
        height,
        parseFloat(mrp) || 0,
        parseFloat(offer) || 0,
        parseFloat(offer_price) || 0,
        status === undefined ? 1 : status,
        is_default ? 1 : 0,
        description || ''
      ]
    );

    res.status(201).json({ success: true, message: 'Logo added successfully', logoId: result.insertId });
  } catch (error) {
    console.error('Error adding logo:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// Update an existing logo
exports.updateLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, type, width, height, mrp, offer, offer_price, status, is_default, description } = req.body;

    if (!id || !name || !image || !width || !height) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const pool = getPool();
    
    await pool.query(
      `UPDATE logos 
       SET name=?, image=?, type=?, width=?, height=?, mrp=?, offer=?, offer_price=?, status=?, is_default=?, description=?
       WHERE id=?`,
      [
        name,
        image,
        type || 'Header',
        width,
        height,
        parseFloat(mrp) || 0,
        parseFloat(offer) || 0,
        parseFloat(offer_price) || 0,
        status === undefined ? 1 : status,
        is_default ? 1 : 0,
        description || '',
        id
      ]
    );

    res.json({ success: true, message: 'Logo updated successfully' });
  } catch (error) {
    console.error('Error updating logo:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// Delete a logo
exports.deleteLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    await pool.query('DELETE FROM logos WHERE id = ?', [id]);
    res.json({ success: true, message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
