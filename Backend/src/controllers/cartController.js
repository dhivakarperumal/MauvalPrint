const db = require("../config/db");

exports.addCart = async (req, res) => {
  try {
    const pool = db.pool();

    const {
      user_id,
      product_id,
      quantity,
      selectedSize,
      selected_size: requestSelectedSize,
      item_data
    } = req.body;

    const [productRows] = await pool.execute(
      `SELECT product_id, name, title, mrp, sale_price, images
       FROM products
       WHERE product_id = ? OR CAST(id AS CHAR) = ?
       LIMIT 1`,
      [String(product_id), String(product_id)]
    );
    const product = productRows[0] || {};
    const incomingItem = item_data && typeof item_data === 'object' && !Array.isArray(item_data)
      ? item_data
      : {};
    let productImages = product.images || [];
    if (typeof productImages === 'string') {
      try {
        productImages = JSON.parse(productImages);
      } catch (error) {
        productImages = [];
      }
    }
    if (!Array.isArray(productImages)) productImages = [];

    let itemImages = incomingItem.images || incomingItem.images_final || [];
    if (typeof itemImages === 'string') {
      try {
        itemImages = JSON.parse(itemImages);
      } catch (error) {
        itemImages = [itemImages];
      }
    }
    if (!Array.isArray(itemImages)) itemImages = itemImages ? [itemImages] : [];
    if (itemImages.length === 0) {
      itemImages = [incomingItem.image, incomingItem.product_image].filter(Boolean);
    }

    const prices = [
      incomingItem.price,
      incomingItem.salePrice,
      incomingItem.sale_price,
      product.sale_price,
      incomingItem.mrp,
      product.mrp,
    ].map(Number).filter(Number.isFinite);
    const price = prices.find((value) => value > 0) ?? prices[0] ?? 0;
    const itemSize = incomingItem.selectedSize ||
      incomingItem.selected_size ||
      selectedSize ||
      requestSelectedSize ||
      '';
    const cartItemData = {
      ...incomingItem,
      id: product.product_id || incomingItem.id || product_id,
      name: incomingItem.name || incomingItem.title || incomingItem.product_name || product.name || product.title || '',
      images: itemImages.length > 0 ? itemImages : productImages,
      price,
      mrp: Number(incomingItem.mrp) || Number(product.mrp) || price,
      selectedSize: itemSize,
    };

    const selected_size = cartItemData.selectedSize || cartItemData.selected_size || '';
    const selected_color = cartItemData.selectedColor || cartItemData.selected_color || '';
    const selected_variant = cartItemData.selectedVariant || cartItemData.variant || cartItemData.selected_variant || '';

    const [existing] = await pool.execute(
      `SELECT id, quantity, item_data
       FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    let matchId = null;
    let matchQuantity = 0;

    for (const row of existing) {
      let parsed = {};
      try {
        parsed = JSON.parse(row.item_data || "{}");
      } catch (e) {}

      const rowSize = parsed.selectedSize || parsed.selected_size || "";
      const rowColor = parsed.selectedColor || parsed.selected_color || "";
      const rowVariant = parsed.selectedVariant || parsed.variant || parsed.selected_variant || "";

      if (rowSize === selected_size && rowColor === selected_color && rowVariant === selected_variant) {
        matchId = row.id;
        matchQuantity = row.quantity;
        break;
      }
    }

    if (matchId) {
      await pool.execute(
        `UPDATE user_cart
         SET quantity = quantity + ?, item_data = ?, updated_at = ?
         WHERE id=?`,
        [quantity, JSON.stringify(cartItemData), new Date(), matchId]
      );

      return res.json({ success: true, message: "Cart updated" });
    }

    await pool.execute(
      `INSERT INTO user_cart
      (
        user_id,
        product_id,
        quantity,
        item_data,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        user_id,
        product_id,
        quantity,
        JSON.stringify(cartItemData),
        new Date()
      ]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const pool = db.pool();

    const { user_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT c.*, p.name AS catalog_name, p.title AS catalog_title,
              p.mrp AS catalog_mrp, p.sale_price AS catalog_sale_price,
              p.images AS catalog_images
       FROM user_cart c
       LEFT JOIN products p
         ON p.product_id = c.product_id OR CAST(p.id AS CHAR) = c.product_id
       WHERE c.user_id=?`,
      [user_id]
    );

    const cart = rows.map(item => {
      let parsed = {};
      try {
        parsed = JSON.parse(item.item_data || "{}");
      } catch (e) {
        parsed = {};
      }

      let catalogImages = item.catalog_images || [];
      if (typeof catalogImages === 'string') {
        try {
          catalogImages = JSON.parse(catalogImages);
        } catch (e) {
          catalogImages = [];
        }
      }
      if (!Array.isArray(catalogImages)) catalogImages = [];
      const images = Array.isArray(parsed.images) && parsed.images.length > 0
        ? parsed.images
        : catalogImages;
      const prices = [
        parsed.price,
        parsed.salePrice,
        parsed.sale_price,
        item.catalog_sale_price,
        parsed.mrp,
        item.catalog_mrp,
      ].map(Number).filter(Number.isFinite);
      const price = prices.find((value) => value > 0) ?? prices[0] ?? 0;
      const name = parsed.name || parsed.title || item.catalog_name || item.catalog_title || '';
      const mrp = Number(parsed.mrp) || Number(item.catalog_mrp) || price;

      return {
        id: item.product_id,
        name,
        price,
        mrp,
        image: images[0] || parsed.product_image || parsed.image || "",
        images,
        quantity: item.quantity,
        selectedSize: parsed.selectedSize || parsed.selected_size || "",
        selectedColor: parsed.selectedColor || parsed.selected_color || "",
        selectedVariant: parsed.selectedVariant || parsed.variant || parsed.selected_variant || "",
        variant: parsed.selectedVariant || parsed.variant || parsed.selected_variant || "",
        item_data: { ...parsed, name, price, mrp, images },
      };
    });

    res.json({
      success: true,
      cart
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false
    });
  }
};

exports.removeCart = async (req, res) => {
  try {
    const pool = db.pool();


    const { user_id, product_id } = req.params;
    const selected_size = req.query.size || req.query.selectedSize || req.query.selected_size || '';
    const selected_color = req.query.color || req.query.selectedColor || req.query.selected_color || '';
    const selected_variant = req.query.variant || req.query.selectedVariant || req.query.selected_variant || '';

    const [existing] = await pool.execute(
      `SELECT id, item_data
       FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    let matchId = null;
    for (const row of existing) {
      let parsed = {};
      try {
        parsed = JSON.parse(row.item_data || "{}");
      } catch (e) {}

      const rowSize = parsed.selectedSize || parsed.selected_size || "";
      const rowColor = parsed.selectedColor || parsed.selected_color || "";
      const rowVariant = parsed.selectedVariant || parsed.variant || parsed.selected_variant || "";

      if (rowSize === selected_size && rowColor === selected_color && rowVariant === selected_variant) {
        matchId = row.id;
        break;
      }
    }

    if (matchId) {
      await pool.execute(
        `DELETE FROM user_cart
         WHERE id=?`,
        [matchId]
      );
    }

    res.json({
      success: true
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false
    });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const pool = db.pool();

    const { user_id, product_id, selectedSize, selected_color, selectedColor, selectedVariant, variant, quantity } = req.body;
    const selected_size = selectedSize || '';
    const selected_variant = selectedVariant || variant || '';

    const [existing] = await pool.execute(
      `SELECT id, item_data
       FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    let matchId = null;
    for (const row of existing) {
      let parsed = {};
      try {
        parsed = JSON.parse(row.item_data || "{}");
      } catch (e) {}

      const rowSize = parsed.selectedSize || parsed.selected_size || "";
      const rowColor = parsed.selectedColor || parsed.selected_color || "";
      const rowVariant = parsed.selectedVariant || parsed.variant || parsed.selected_variant || "";

      if (rowSize === selected_size && rowColor === (selectedColor || selected_color || '') && rowVariant === selected_variant) {
        matchId = row.id;
        break;
      }
    }

    if (matchId) {
      await pool.execute(
        `UPDATE user_cart SET quantity = ?, updated_at = ? WHERE id=?`,
        [quantity, new Date(), matchId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};