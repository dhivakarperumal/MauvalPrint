const express = require("express");
const {
  getVideos,
  addVideo,
  updateVideo,
  deleteVideo,
} = require("../controllers/videoController");

const router = express.Router();

router.get("/", getVideos);
router.post("/", addVideo);
router.put("/:id", updateVideo);
router.delete("/:id", deleteVideo);

module.exports = router;
