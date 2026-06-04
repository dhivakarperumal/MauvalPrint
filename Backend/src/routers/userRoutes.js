const express = require("express");
const {
  register,
  login,
  googleLogin,
  getUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUserAddresses,
  addUserAddress,
} = require("../controllers/userController");

const router = express.Router();

router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/users/:id/addresses", getUserAddresses);
router.post("/users/:id/addresses", addUserAddress);
router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);

module.exports = router;
