const db = require("../config/db");

exports.addWishlist = async (req, res) => {
    try {
        const pool = db.pool();

        if (!pool) {
            return res.status(500).json({
                success: false,
                message: "Database pool not initialized",
            });
        }

        const {
            user_id,
            product_id,
            item_data,
            product_name,
            mrp,
            sale_price,
            offer,
            product_image,
        } = req.body;

        const wishlistItemData = item_data || {};

        const productName =
            product_name ||
            wishlistItemData.name ||
            wishlistItemData.title ||
            wishlistItemData.product_name ||
            null;
        const productMrp = mrp ?? wishlistItemData.mrp ?? wishlistItemData.price ?? 0;
        const productSalePrice =
            sale_price ?? wishlistItemData.sale_price ?? wishlistItemData.salePrice ?? 0;
        const productOffer =
            offer ?? wishlistItemData.offer ?? wishlistItemData.discount ?? 0;
        const productImage =
            product_image ||
            wishlistItemData.product_image ||
            wishlistItemData.image ||
            (Array.isArray(wishlistItemData.images) ? wishlistItemData.images[0] : null) ||
            null;

        console.log("Wishlist Item Data:");
        console.log(wishlistItemData);

        const [existing] = await pool.execute(
            `SELECT id
       FROM user_wishlist
       WHERE user_id = ? AND product_id = ?`,
            [user_id, product_id]
        );

        if (existing.length > 0) {
            return res.json({
                success: true,
                message: "Already in wishlist",
            });
        }

        await pool.execute(
            `INSERT INTO user_wishlist
  (
    user_id,
    product_id,
    product_name,
    mrp,
    sale_price,
    offer,
    product_image,
    item_data,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                product_id,
                productName,
                productMrp,
                productSalePrice,
                productOffer,
                productImage,
                JSON.stringify(wishlistItemData),
                new Date(),
            ]
        );

        res.json({
            success: true,
            message: "Wishlist added successfully",
        });
    } catch (error) {
        console.error("Add Wishlist Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const pool = db.pool();

        if (!pool) {
            return res.status(500).json({
                success: false,
                message: "Database pool not initialized",
            });
        }

        const { user_id } = req.params;

        const [rows] = await pool.execute(
            `SELECT *
       FROM user_wishlist
       WHERE user_id = ?`,
            [user_id]
        );

        const wishlist = rows.map((item) => {
            let data;
            try {
                data = JSON.parse(item.item_data);
            } catch {
                data = item.item_data;
            }

            return {
                ...(typeof data === "object" && data !== null ? data : { item_data: data }),
                product_name: item.product_name ?? data?.product_name,
                mrp: item.mrp ?? data?.mrp,
                sale_price: item.sale_price ?? data?.sale_price,
                offer: item.offer ?? data?.offer,
                product_image: item.product_image ?? data?.product_image,
                created_at: item.created_at,
            };
        });

        res.json({
            success: true,
            wishlist,
        });
    } catch (error) {
        console.error("Get Wishlist Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.removeWishlist = async (req, res) => {
    try {
        const pool = db.pool();

        if (!pool) {
            return res.status(500).json({
                success: false,
                message: "Database pool not initialized",
            });
        }

        const { user_id, product_id } = req.params;

        await pool.execute(
            `DELETE FROM user_wishlist
       WHERE user_id = ? AND product_id = ?`,
            [user_id, product_id]
        );

        res.json({
            success: true,
            message: "Wishlist item removed",
        });
    } catch (error) {
        console.error("Remove Wishlist Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.clearWishlist = async (req, res) => {
    try {
        const pool = db.pool();

        if (!pool) {
            return res.status(500).json({
                success: false,
                message: "Database pool not initialized",
            });
        }

        const { user_id } = req.params;

        await pool.execute(
            `DELETE FROM user_wishlist
       WHERE user_id = ?`,
            [user_id]
        );

        res.json({
            success: true,
            message: "Wishlist cleared",
        });
    } catch (error) {
        console.error("Clear Wishlist Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};