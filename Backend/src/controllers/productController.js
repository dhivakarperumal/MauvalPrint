const { randomUUID } = require("crypto");

const generateNextProductId = async (pool) => {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(product_id, 3) AS UNSIGNED)) AS max_id FROM products WHERE product_id LIKE 'MP%'"
  );
  const nextNumber = (rows?.[0]?.max_id || 0) + 1;
  return `MP${String(nextNumber).padStart(3, "0")}`;
};

const getProducts = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [products] = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({
      success: false,
      message: "Could not fetch products.",
    });
  }
};

const addProduct = async (req, res) => {
  const {
    id,
    title,
    name,
    category,
    subcategory,
    color,
    size,
    offer,
    rating,
    mrp,
    sale_price,
    stock,
    description,
    fabric_details,
    fabric_gsm,
    images,
    our_design,
    keyword,
    washing_details,
    notes,
    stock_by_variant,
    size_chart_image,
  } = req.body;

  if (!title || !name || !category) {
    return res.status(400).json({
      success: false,
      message: "Title, name, and category are required.",
    });
  }

  try {
    const pool = req.app.locals.pool;
    const productId = await generateNextProductId(pool);
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      `INSERT INTO products (
        product_id, title, name, category, subcategory, color, size, 
        offer, rating, mrp, sale_price, stock, description, fabric_details, 
        fabric_gsm, images, our_design, keyword, washing_details, notes, 
        stock_by_variant, size_chart_image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        title,
        name,
        category,
        subcategory || null,
        JSON.stringify(color || []),
        JSON.stringify(size || []),
        offer || 0,
        rating || 0,
        mrp || 0,
        sale_price || 0,
        stock || 0,
        description || null,
        fabric_details || null,
        JSON.stringify(fabric_gsm || []),
        JSON.stringify(images || []),
        our_design ? 1 : 0,
        keyword || null,
        JSON.stringify(washing_details || []),
        notes || null,
        JSON.stringify(stock_by_variant || {}),
        size_chart_image || null,
        timestamp,
        timestamp,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully.",
      product_id: productId,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({
      success: false,
      message: "Could not add product.",
    });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    name,
    category,
    subcategory,
    color,
    size,
    offer,
    rating,
    mrp,
    sale_price,
    stock,
    description,
    fabric_details,
    fabric_gsm,
    images,
    our_design,
    keyword,
    washing_details,
    notes,
    stock_by_variant,
    size_chart_image,
  } = req.body;

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    let query = "UPDATE products SET ";
    let values = [];
    let fields = [];

    if (title !== undefined) {
      fields.push("title = ?");
      values.push(title);
    }
    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (category !== undefined) {
      fields.push("category = ?");
      values.push(category);
    }
    if (subcategory !== undefined) {
      fields.push("subcategory = ?");
      values.push(subcategory);
    }
    if (color !== undefined) {
      fields.push("color = ?");
      values.push(JSON.stringify(color));
    }
    if (size !== undefined) {
      fields.push("size = ?");
      values.push(JSON.stringify(size));
    }
    if (offer !== undefined) {
      fields.push("offer = ?");
      values.push(offer);
    }
    if (rating !== undefined) {
      fields.push("rating = ?");
      values.push(rating);
    }
    if (mrp !== undefined) {
      fields.push("mrp = ?");
      values.push(mrp);
    }
    if (sale_price !== undefined) {
      fields.push("sale_price = ?");
      values.push(sale_price);
    }
    if (stock !== undefined) {
      fields.push("stock = ?");
      values.push(stock);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }
    if (fabric_details !== undefined) {
      fields.push("fabric_details = ?");
      values.push(fabric_details);
    }
    if (fabric_gsm !== undefined) {
      fields.push("fabric_gsm = ?");
      values.push(JSON.stringify(fabric_gsm));
    }
    if (images !== undefined) {
      fields.push("images = ?");
      values.push(JSON.stringify(images));
    }
    if (our_design !== undefined) {
      fields.push("our_design = ?");
      values.push(our_design ? 1 : 0);
    }
    if (keyword !== undefined) {
      fields.push("keyword = ?");
      values.push(keyword);
    }
    if (washing_details !== undefined) {
      fields.push("washing_details = ?");
      values.push(JSON.stringify(washing_details));
    }
    if (notes !== undefined) {
      fields.push("notes = ?");
      values.push(notes);
    }
    if (stock_by_variant !== undefined) {
      fields.push("stock_by_variant = ?");
      values.push(JSON.stringify(stock_by_variant));
    }
    if (size_chart_image !== undefined) {
      fields.push("size_chart_image = ?");
      values.push(size_chart_image);
    }

    fields.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    query += fields.join(", ") + " WHERE product_id = ?";

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Could not update product.",
    });
  }
};

const parseJSON = (value, fallback = []) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getCategories = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [categories] = await pool.query(
      "SELECT * FROM categories ORDER BY name ASC"
    );

    const parsed = categories.map((c) => ({
      ...c,
      images: parseJSON(c.images, []),
      subcategories: parseJSON(c.subcategories, []),
    }));

    res.status(200).json({
      success: true,
      categories: parsed,
    });
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({
      success: false,
      message: "Could not fetch categories.",
    });
  }
};

const addCategory = async (req, res) => {
  const { category_id, name, description, images, subcategories } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: "Category name is required." });
  }

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const newCategoryId = category_id || randomUUID();

    await pool.query(
      `INSERT INTO categories (category_id, name, description, images, subcategories, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newCategoryId,
        name,
        description || null,
        JSON.stringify(images || []),
        JSON.stringify(subcategories || []),
        timestamp,
        timestamp,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Category added successfully.",
      category_id: newCategoryId,
    });
  } catch (error) {
    console.error("Add category error:", error);
    res.status(500).json({ success: false, message: "Could not add category." });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, images, subcategories } = req.body;

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (images !== undefined) { fields.push("images = ?"); values.push(JSON.stringify(images)); }
    if (subcategories !== undefined) { fields.push("subcategories = ?"); values.push(JSON.stringify(subcategories)); }

    fields.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    const [result] = await pool.query(
      `UPDATE categories SET ${fields.join(", ")} WHERE category_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    res.status(200).json({ success: true, message: "Category updated successfully." });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ success: false, message: "Could not update category." });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query(
      "DELETE FROM categories WHERE category_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    res.status(200).json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ success: false, message: "Could not delete category." });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.status(200).json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: "Could not delete product." });
  }
};

const updateStock = async (req, res) => {
  const { id } = req.params; // product_id e.g. "MP001"
  const { color, size, quantity } = req.body;

  const added = Number(quantity);
  if (!color || !size || isNaN(added) || added <= 0) {
    return res.status(400).json({
      success: false,
      message: "Color, size, and a valid quantity are required.",
    });
  }

  try {
    const pool = req.app.locals.pool;

    const [rows] = await pool.query(
      "SELECT stock, stock_by_variant FROM products WHERE product_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const product = rows[0];
    let stockByVariant = {};
    try {
      stockByVariant =
        typeof product.stock_by_variant === "string"
          ? JSON.parse(product.stock_by_variant)
          : product.stock_by_variant || {};
    } catch {
      stockByVariant = {};
    }

    const key = `${color}-${size}`;
    const currentQty = Number(stockByVariant[key] || 0);
    stockByVariant[key] = currentQty + added;

    const updatedTotalStock = Number(product.stock || 0) + added;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      "UPDATE products SET stock = ?, stock_by_variant = ?, updated_at = ? WHERE product_id = ?",
      [updatedTotalStock, JSON.stringify(stockByVariant), timestamp, id]
    );

    res.status(200).json({
      success: true,
      message: `Stock updated: ${key} = ${stockByVariant[key]}`,
      stock: updatedTotalStock,
      stock_by_variant: stockByVariant,
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({ success: false, message: "Could not update stock." });
  }
};

const fixProductDesignFlag = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    
    // Set all products with our_design=1 to our_design=0 (make them regular products)
    const [result] = await pool.query(
      "UPDATE products SET our_design = 0 WHERE our_design = 1"
    );

    res.status(200).json({
      success: true,
      message: `Fixed ${result.affectedRows} products - set our_design to 0`,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Fix product design flag error:", error);
    res.status(500).json({
      success: false,
      message: "Could not fix product design flags.",
    });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  fixProductDesignFlag,
};
