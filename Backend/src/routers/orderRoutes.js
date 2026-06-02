const express = require("express");
const {
  createOrder,
  createWebOrder,
  getOrders,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", createOrder);
router.post("/web-checkout", createWebOrder);
router.get("/", getOrders);
router.get("/user/:userId", getOrdersByUser);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

module.exports = router;
