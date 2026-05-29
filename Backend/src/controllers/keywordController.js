const getKeywords = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [keywords] = await pool.query(
      "SELECT * FROM keyword_master ORDER BY display_order ASC, created_at DESC"
    );
    res.status(200).json({ success: true, keywords });
  } catch (error) {
    console.error("Get keywords error:", error);
    res.status(500).json({ success: false, message: "Could not fetch keywords." });
  }
};

const createKeyword = async (req, res) => {
  const { keywordName } = req.body;
  if (!keywordName) {
    return res.status(400).json({ success: false, message: "Keyword name is required." });
  }
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query(
      "INSERT INTO keyword_master (keyword_name) VALUES (?)",
      [keywordName]
    );
    res.status(201).json({ success: true, message: "Keyword added.", id: result.insertId });
  } catch (error) {
    console.error("Create keyword error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "Keyword already exists." });
    }
    res.status(500).json({ success: false, message: "Could not create keyword." });
  }
};

const updateKeyword = async (req, res) => {
  const { id } = req.params;
  const { keywordName, status, show_on_home, display_order } = req.body;

  try {
    const pool = req.app.locals.pool;
    const fields = [];
    const values = [];

    if (keywordName !== undefined) {
      fields.push("keyword_name = ?");
      values.push(keywordName);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }
    if (show_on_home !== undefined) {
      fields.push("show_on_home = ?");
      values.push(show_on_home ? 1 : 0);
    }
    if (display_order !== undefined) {
      fields.push("display_order = ?");
      values.push(display_order);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }
    values.push(id);

    const [result] = await pool.query(
      `UPDATE keyword_master SET ${fields.join(", ")} WHERE keyword_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Keyword not found." });
    }
    res.status(200).json({ success: true, message: "Keyword updated." });
  } catch (error) {
    console.error("Update keyword error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "Keyword already exists." });
    }
    res.status(500).json({ success: false, message: "Could not update keyword." });
  }
};

const deleteKeyword = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query("DELETE FROM keyword_master WHERE keyword_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Keyword not found." });
    }
    res.status(200).json({ success: true, message: "Keyword deleted." });
  } catch (error) {
    console.error("Delete keyword error:", error);
    res.status(500).json({ success: false, message: "Could not delete keyword." });
  }
};

const getKeywordStats = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [totalKeywordsResult] = await pool.query("SELECT COUNT(*) as count FROM keyword_master");
    const [activeKeywordsResult] = await pool.query("SELECT COUNT(*) as count FROM keyword_master WHERE status = 'active'");
    
    // Count products tagged by inspecting JSON array in products table where keywords IS NOT NULL
    const [productsWithKeywordsResult] = await pool.query("SELECT COUNT(*) as count FROM products WHERE keywords IS NOT NULL AND JSON_LENGTH(keywords) > 0");

    // Most used keyword (Extracting elements from JSON array is complex in pure MySQL without a JSON table function, 
    // we'll fetch all products' keywords and calculate in Node.js)
    const [allProducts] = await pool.query("SELECT keywords FROM products WHERE keywords IS NOT NULL");
    let keywordCounts = {};
    allProducts.forEach(row => {
      try {
        let kwArr = JSON.parse(row.keywords);
        if (Array.isArray(kwArr)) {
          kwArr.forEach(kw => {
            keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
          });
        }
      } catch(e) {}
    });

    let mostUsedKeyword = "N/A";
    let maxCount = 0;
    for (const [kw, count] of Object.entries(keywordCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedKeyword = kw;
      }
    }

    res.status(200).json({ 
      success: true, 
      stats: {
        totalKeywords: totalKeywordsResult[0].count,
        activeKeywords: activeKeywordsResult[0].count,
        productsTagged: productsWithKeywordsResult[0].count,
        mostUsedKeyword
      } 
    });
  } catch (error) {
    console.error("Get keyword stats error:", error);
    res.status(500).json({ success: false, message: "Could not fetch keyword statistics." });
  }
};

const bulkAssignKeywords = async (req, res) => {
  const { productIds, keywords } = req.body;
  if (!Array.isArray(productIds) || !Array.isArray(keywords)) {
    return res.status(400).json({ success: false, message: "Invalid payload." });
  }
  
  try {
    const pool = req.app.locals.pool;
    // Iterate and update each product
    for (const pid of productIds) {
      // First get existing keywords
      const [productRows] = await pool.query("SELECT keywords FROM products WHERE product_id = ?", [pid]);
      if (productRows.length > 0) {
        let existingKeywords = [];
        try {
          if (productRows[0].keywords) existingKeywords = JSON.parse(productRows[0].keywords);
        } catch(e) {}
        
        if (!Array.isArray(existingKeywords)) existingKeywords = [];
        
        // Merge and deduplicate
        const mergedKeywords = [...new Set([...existingKeywords, ...keywords])];
        
        await pool.query("UPDATE products SET keywords = ? WHERE product_id = ?", [JSON.stringify(mergedKeywords), pid]);
      }
    }
    res.status(200).json({ success: true, message: "Keywords assigned successfully." });
  } catch (error) {
    console.error("Bulk assign error:", error);
    res.status(500).json({ success: false, message: "Could not assign keywords." });
  }
};

const getHomeKeywords = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [keywords] = await pool.query(
      "SELECT * FROM keyword_master WHERE show_on_home = 1 AND status = 'active' ORDER BY display_order ASC"
    );
    res.status(200).json({ success: true, keywords });
  } catch (error) {
    console.error("Get home keywords error:", error);
    res.status(500).json({ success: false, message: "Could not fetch home keywords." });
  }
};

module.exports = { getKeywords, createKeyword, updateKeyword, deleteKeyword, getKeywordStats, bulkAssignKeywords, getHomeKeywords };
