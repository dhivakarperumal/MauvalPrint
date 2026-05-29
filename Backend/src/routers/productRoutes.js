const express = require("express");
const {
  getProducts,
  addProduct,
  updateProduct,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/productController");

const router = express.Router();

router.get("/products", getProducts);
router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.get("/categories", getCategories);
router.post("/categories", addCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

module.exports = router;
