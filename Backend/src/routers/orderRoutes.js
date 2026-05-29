const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

module.exports = router;
