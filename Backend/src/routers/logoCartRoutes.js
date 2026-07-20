const express = require("express");
const router = express.Router();

const {
  addLogoCart,
  getLogoCart,
  removeLogoCart,
  updateLogoCart,
} = require("../controllers/logoCartController");

router.post("/add", addLogoCart);
router.get("/:user_id", getLogoCart);
router.delete("/:user_id/:logo_id", removeLogoCart);
router.patch("/update", updateLogoCart);

module.exports = router;
