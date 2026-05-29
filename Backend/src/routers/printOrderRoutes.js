const express = require("express");
const {
  createPrintOrder,
  getPrintOrders,
  updatePrintOrder,
  deletePrintOrder,
} = require("../controllers/printOrderController");

const router = express.Router();

router.post("/print-orders", createPrintOrder);
router.get("/print-orders", getPrintOrders);
router.put("/print-orders/:id", updatePrintOrder);
router.delete("/print-orders/:id", deletePrintOrder);

module.exports = router;
