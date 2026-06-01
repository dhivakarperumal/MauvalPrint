const express = require("express");
const router = express.Router();

const {
  addCart,
  getCart,
  removeCart
} = require("../controllers/cartController");

const { updateCart } = require("../controllers/cartController");

router.post("/add", addCart);

router.get("/:user_id", getCart);

router.delete("/:user_id/:product_id", removeCart);
router.patch('/update', updateCart);

module.exports = router;