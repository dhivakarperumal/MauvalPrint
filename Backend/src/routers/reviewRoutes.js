const express = require("express");
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleFeatured,
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/reviews", getReviews);
router.post("/reviews", createReview);
router.put("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);
router.patch("/reviews/:id/featured", toggleFeatured);

module.exports = router;
