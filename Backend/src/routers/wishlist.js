const express = require("express");
const router = express.Router();

const {
  addWishlist,
  getWishlist,
  removeWishlist,
  clearWishlist,
} = require("../controllers/wishlistController");

router.post("/add", addWishlist);

router.get("/:user_id", getWishlist);

router.delete("/:user_id/:product_id", removeWishlist);

router.delete("/clear/:user_id", clearWishlist);

module.exports = router;