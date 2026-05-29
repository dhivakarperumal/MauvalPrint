const express = require("express");
const {
  createPrintOrder,
  getPrintOrders,
  updatePrintOrder,
  deletePrintOrder,
} = require("../controllers/printOrderController");

const router = express.Router();

router.post("/", createPrintOrder);
router.get("/", getPrintOrders);
router.put("/:id", updatePrintOrder);
router.delete("/:id", deletePrintOrder);

module.exports = router;
