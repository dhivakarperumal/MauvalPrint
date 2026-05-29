const express = require("express");
const {
  getDealers,
  createDealer,
  updateDealer,
  deleteDealer,
  getInvoicesOptions,
} = require("../controllers/dealerController");

const router = express.Router();

router.get("/dealers", getDealers);
router.post("/dealers", createDealer);
router.put("/dealers/:id", updateDealer);
router.delete("/dealers/:id", deleteDealer);
router.get("/dealers/invoices/options", getInvoicesOptions);

module.exports = router;
