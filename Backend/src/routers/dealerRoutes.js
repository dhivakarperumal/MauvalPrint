const express = require("express");
const {
  getDealers,
  createDealer,
  updateDealer,
  deleteDealer,
  getInvoicesOptions,
} = require("../controllers/dealerController");

const router = express.Router();

router.get("/", getDealers);
router.post("/", createDealer);
router.put("/:id", updateDealer);
router.delete("/:id", deleteDealer);
router.get("/invoices/options", getInvoicesOptions);

module.exports = router;
