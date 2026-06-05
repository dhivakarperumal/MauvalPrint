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
  updateUserAddress,
  deleteUserAddress,
} = require("../controllers/userController");

const router = express.Router();

router.get("/", getUsers);
router.put("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);
router.get("/:id/addresses", getUserAddresses);
router.post("/:id/addresses", addUserAddress);
router.put("/:id/addresses/:addressId", updateUserAddress);
router.delete("/:id/addresses/:addressId", deleteUserAddress);
router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);

module.exports = router;
