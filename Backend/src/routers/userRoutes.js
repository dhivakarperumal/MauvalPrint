const express = require("express");
const {
  register,
  login,
  googleLogin,
  getUsers,
  getUser,
  updateUser,
  updateUserPassword,
  updateUserStatus,
  deleteUser,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} = require("../controllers/userController");

const router = express.Router();

// Auth routes first (must come before /:id catch-all)
router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);

// User routes
router.get("/", getUsers);
router.get("/:id", getUser);
router.get("/:id/addresses", getUserAddresses);
router.post("/:id/addresses", addUserAddress);
router.put("/:id/addresses/:addressId", updateUserAddress);
router.delete("/:id/addresses/:addressId", deleteUserAddress);
router.put("/:id/password", updateUserPassword);
router.put("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

module.exports = router;
