const express = require("express");
const {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  reduceStock,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.put("/:id/stock", updateStock);
router.put("/:id/reduce-stock", reduceStock);
router.delete("/:id", deleteProduct);

module.exports = router;
