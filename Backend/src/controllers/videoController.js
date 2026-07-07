const { randomUUID } = require("crypto");

const getVideos = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [videos] = await pool.query(
      "SELECT * FROM videos ORDER BY created_at DESC"
    );

    res.status(200).json({
      success: true,
      videos: videos,
    });
  } catch (error) {
    console.error("Fetch videos error:", error);
    res.status(500).json({
      success: false,
      message: "Could not fetch videos.",
    });
  }
};

const addVideo = async (req, res) => {
  const { title, description, videoUrl, thumbnail, category, isActive } = req.body;

  try {
    if (!title || !description || !videoUrl || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, videoUrl, and category are required.",
      });
    }

    const pool = req.app.locals.pool;
    const video_id = randomUUID();
    const now = new Date();

    // Process thumbnail - if it's a full URL from upload, keep it; if base64, store as-is
    let thumbnailToStore = thumbnail;
    if (thumbnail && thumbnail.startsWith("data:image")) {
      // Base64 thumbnail - it will be stored as-is
      thumbnailToStore = thumbnail;
    }

    await pool.query(
      `INSERT INTO videos (video_id, title, description, video_url, thumbnail, category, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [video_id, title, description, videoUrl, thumbnailToStore || null, category, isActive ? 1 : 0, now, now]
    );

    const [newVideo] = await pool.query(
      "SELECT * FROM videos WHERE video_id = ?",
      [video_id]
    );

    res.status(201).json({
      success: true,
      message: "Video added successfully.",
      video: newVideo[0],
    });
  } catch (error) {
    console.error("Add video error:", error);
    res.status(500).json({
      success: false,
      message: "Could not add video.",
      error: error.message,
    });
  }
};

const updateVideo = async (req, res) => {
  const { id } = req.params;
  const { title, description, videoUrl, thumbnail, category, isActive } = req.body;

  try {
    const pool = req.app.locals.pool;
    const now = new Date();

    // Check if video exists (try both video_id and id)
    let [existingVideo] = await pool.query(
      "SELECT * FROM videos WHERE video_id = ?",
      [id]
    );

    if (existingVideo.length === 0) {
      [existingVideo] = await pool.query(
        "SELECT * FROM videos WHERE id = ?",
        [id]
      );
    }

    if (existingVideo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    const video = existingVideo[0];
    
    // Build update query - use proper WHERE clause
    const whereClause = video.video_id ? "video_id = ?" : "id = ?";
    const whereValue = video.video_id || video.id;

    const updateQuery = `
      UPDATE videos 
      SET title = ?, description = ?, video_url = ?, thumbnail = ?, category = ?, is_active = ?, updated_at = ?
      WHERE ${whereClause}
    `;

    await pool.query(updateQuery, [
      title || video.title,
      description || video.description,
      videoUrl || video.video_url,
      thumbnail || video.thumbnail,
      category || video.category,
      isActive !== undefined ? (isActive ? 1 : 0) : video.is_active,
      now,
      whereValue,
    ]);

    const [updatedVideo] = await pool.query(
      whereClause === "video_id = ?" ? "SELECT * FROM videos WHERE video_id = ?" : "SELECT * FROM videos WHERE id = ?",
      [whereValue]
    );

    res.status(200).json({
      success: true,
      message: "Video updated successfully.",
      video: updatedVideo[0],
    });
  } catch (error) {
    console.error("Update video error:", error);
    res.status(500).json({
      success: false,
      message: "Could not update video.",
      error: error.message,
    });
  }
};

const deleteVideo = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = req.app.locals.pool;

    // Check if video exists (try both video_id and id)
    let [existingVideo] = await pool.query(
      "SELECT * FROM videos WHERE video_id = ?",
      [id]
    );

    if (existingVideo.length === 0) {
      [existingVideo] = await pool.query(
        "SELECT * FROM videos WHERE id = ?",
        [id]
      );
    }

    if (existingVideo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    const video = existingVideo[0];
    const whereClause = video.video_id ? "video_id = ?" : "id = ?";
    const whereValue = video.video_id || video.id;

    await pool.query(
      `DELETE FROM videos WHERE ${whereClause}`,
      [whereValue]
    );

    res.status(200).json({
      success: true,
      message: "Video deleted successfully.",
    });
  } catch (error) {
    console.error("Delete video error:", error);
    res.status(500).json({
      success: false,
      message: "Could not delete video.",
      error: error.message,
    });
  }
};

module.exports = {
  getVideos,
  addVideo,
  updateVideo,
  deleteVideo,
};
