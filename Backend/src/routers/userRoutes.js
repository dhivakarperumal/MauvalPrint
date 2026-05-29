const express = require("express");
const {
  register,
  login,
  getUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.post("/register", register);
router.post("/login", login);

module.exports = router;
