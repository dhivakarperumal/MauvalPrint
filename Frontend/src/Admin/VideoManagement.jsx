import React, { useState,useRef ,useEffect } from "react";
import {
  FaPlay,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaTimes,
  FaCheck,
  FaUpload,
  FaLink,
  FaFilm,
  FaSpinner,
  FaCloudUploadAlt,
  FaYoutube,
  FaVideo,
  FaInstagram,
  FaEye,
  FaFileVideo,
  FaList,
  FaTh
} from "react-icons/fa";
import api from "../api";
import toast from "react-hot-toast";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract YouTube video ID from any YouTube URL */
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  try {
    // Already embed
    const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    // youtu.be/<id>
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    // /shorts/<id>
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    // watch?v=<id>
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
  } catch (_) {}
  return null;
};

/** Convert any YouTube URL to a clean embed URL */
const getYouTubeEmbedUrl = (url) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url;
};

/** Auto-generate YouTube thumbnail URL from video URL */
const getYouTubeThumbnail = (url) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

/** Check if URL is a YouTube URL */
const isYouTubeUrl = (url) =>
  url && (url.includes("youtube.com") || url.includes("youtu.be"));

/** Check if URL is a Vimeo URL */
const isVimeoUrl = (url) => url && url.includes("vimeo.com");

/** Check if URL is an Instagram URL */
const isInstagramUrl = (url) => url && url.includes("instagram.com");

/** Convert Instagram URL to embed URL */
const getInstagramEmbedUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Remove query params like ?igsh=...
    let cleanPath = urlObj.pathname;
    
    // Instagram iframe embeds officially require /p/ format.
    // If it's a /reel/ or /tv/, we must convert it to /p/ for the iframe to work.
    cleanPath = cleanPath.replace(/^\/(?:reel|tv|reels)\//, '/p/');
    
    if (!cleanPath.endsWith('/')) cleanPath += '/';
    return `https://www.instagram.com${cleanPath}embed/`;
  } catch (e) {
    return url;
  }
};

/** Placeholder SVG for missing thumbnails */
const PLACEHOLDER_THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23374151' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239CA3AF'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";

/**
 * Convert a backend /uploads/ URL to use the streaming endpoint.
 * The /api/stream/* endpoint on the backend sends proper HTTP 206
 * Partial Content responses so the browser can seek/scrub video.
 *
 * http://localhost:5000/uploads/videos/file.mp4
 *   → /api/stream/videos/file.mp4   (goes through Vite /api proxy)
 *
 * Already a stream URL or non-upload URL → left unchanged.
 */
const toStreamUrl = (url) => {
  if (!url) return url;
  // Already a stream URL
  if (url.startsWith('/api/stream/')) return url;
  // Absolute URL: http(s)://host/uploads/<rest>
  const absMatch = url.match(/^https?:\/\/[^/]+\/uploads\/(.+)$/);
  if (absMatch) return `/api/stream/${absMatch[1]}`;
  // Relative proxy path: /proxy-uploads/<rest>
  const proxyMatch = url.match(/^\/proxy-uploads\/(.+)$/);
  if (proxyMatch) return `/api/stream/${proxyMatch[1]}`;
  return url;
};

/**
 * Convert a backend /uploads/ URL to use the streaming endpoint.
 * (Used for thumbnails/images too, because the stream endpoint has
 * the directory-fallback logic for legacy records).
 */
const toProxyUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/api/stream/')) return url;
  const absMatch = url.match(/^https?:\/\/[^/]+\/uploads\/(.+)$/);
  if (absMatch) return `/api/stream/${absMatch[1]}`;
  const proxyMatch = url.match(/^\/proxy-uploads\/(.+)$/);
  if (proxyMatch) return `/api/stream/${proxyMatch[1]}`;
  return url;
};

/** Normalize a video row from the API */
const normalizeVideo = (video) => {
  let thumbnailUrl = video.thumbnail || "";

  // Thumbnail: use proxy (images don't need range support)
  if (thumbnailUrl && !thumbnailUrl.startsWith('data:')) {
    thumbnailUrl = toProxyUrl(thumbnailUrl);
  }

  let videoUrl = video.video_url || video.videoUrl || "";
  // Video: use the /api/stream/ endpoint for proper range support
  videoUrl = toStreamUrl(videoUrl);

  // Auto YouTube thumbnail
  if (!thumbnailUrl && isYouTubeUrl(videoUrl)) {
    thumbnailUrl = getYouTubeThumbnail(videoUrl) || PLACEHOLDER_THUMB;
  }
  if (!thumbnailUrl) thumbnailUrl = PLACEHOLDER_THUMB;

  return {
    id: video.id,
    _id: video.id || video.video_id,
    video_id: video.video_id,
    title: video.title || "",
    description: video.description || "",
    videoUrl,
    thumbnail: thumbnailUrl,
    category: video.category || "Other",
    isActive: video.is_active !== undefined ? video.is_active : true,
    createdAt: video.created_at || new Date().toISOString(),
  };
};

// ─── UploadedVideoPlayer ──────────────────────────────────────────────────────
// Defined at MODULE level — never inside a component — so React never
// sees a new component type on parent re-renders (which would cause
// constant unmount → remount → video resets).
//
// The key={src} on the <video> tag forces a clean remount when the
// video source changes, which is all we need.
const UploadedVideoPlayer = ({ src }) => (
  <video
    key={src}
    src={src}
    controls
    playsInline
    preload="auto"
    style={{ width: '100%', maxHeight: 450, background: '#000', borderRadius: 8, display: 'block' }}
    onError={(e) => console.error('Video error:', e.target.error?.code, e.target.error?.message)}
  />
);

// ─── Component ───────────────────────────────────────────────────────────────

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => window.innerWidth < 768 ? "card" : "table"); // auto card on mobile
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [videoUploadMode, setVideoUploadMode] = useState("link"); // "upload" | "link"

  const videoFileInputRef = useRef(null);

  // Auto-switch to card on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("card");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [form, setForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    videoFile: null,
    thumbnail: "",
    thumbnailFile: null,
    category: "",
    isActive: true,
  });

  // ── Fetch videos ────────────────────────────────────────────────────────
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/videos");
      const normalizedVideos = (data.videos || []).map(normalizeVideo);
      setVideos(normalizedVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error(error.response?.data?.message || "Failed to load videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // ── Form helpers ────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }
    const maxMB = 500;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Video file must be under ${maxMB} MB`);
      return;
    }
    setForm((prev) => ({ ...prev, videoFile: file }));
    toast.success(`Selected: ${file.name}`);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        thumbnail: reader.result,
        thumbnailFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  // ── Upload helpers ──────────────────────────────────────────────────────
  const uploadFile = async (file, category, onProgress) => {
    const formData = new FormData();
    formData.append("files[]", file);
    formData.append("category", category);

    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total) {
          const pct = Math.round((e.loaded * 100) / e.total);
          onProgress?.(pct);
        }
      },
    });

    if (res.data.success && res.data.urls.length > 0) {
      return res.data.urls[0];
    }
    throw new Error("Upload failed – no URL returned");
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.category) {
      toast.error("Please fill all required fields");
      return;
    }
    if (videoUploadMode === "link" && !form.videoUrl) {
      toast.error("Please provide a video URL");
      return;
    }
    if (videoUploadMode === "upload" && !form.videoFile && !editingId) {
      toast.error("Please select a video file to upload");
      return;
    }

    try {
      setLoading(true);
      let videoUrl = form.videoUrl;
      let thumbnailUrl = form.thumbnail;

      // ── Upload video file ──────────────────────────────────────────
      if (form.videoFile) {
        setUploadingVideo(true);
        setUploadProgress(0);
        try {
          videoUrl = await uploadFile(form.videoFile, "videos", (pct) => {
            setUploadProgress(pct);
          });
        } finally {
          setUploadingVideo(false);
        }
      }

      // ── Upload thumbnail ───────────────────────────────────────────
      if (form.thumbnailFile) {
        setUploadingThumbnail(true);
        try {
          thumbnailUrl = await uploadFile(form.thumbnailFile, "videos", null);
        } finally {
          setUploadingThumbnail(false);
        }
      }

      // Auto YouTube thumbnail if still no thumb
      if (!thumbnailUrl && isYouTubeUrl(videoUrl)) {
        thumbnailUrl = getYouTubeThumbnail(videoUrl) || "";
      }

      const payload = {
        title: form.title,
        description: form.description,
        videoUrl,
        thumbnail: thumbnailUrl,
        category: form.category,
        isActive: form.isActive,
      };

      if (editingId) {
        const { data } = await api.put(`/videos/${editingId}`, payload);
        toast.success("Video updated successfully");
        const updated = normalizeVideo(data.video);
        setVideos((prev) =>
          prev.map((v) => (v.id === editingId || v.video_id === editingId ? updated : v))
        );
      } else {
        const { data } = await api.post("/videos", payload);
        toast.success("Video added successfully");
        setVideos((prev) => [normalizeVideo(data.video), ...prev]);
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving video:", error);
      toast.error(error.response?.data?.message || "Failed to save video");
    } finally {
      setLoading(false);
      setUploadingVideo(false);
      setUploadingThumbnail(false);
      setUploadProgress(0);
    }
  };

  // ── Edit / Play / Delete ────────────────────────────────────────────────
  const handleEdit = (video) => {
    setForm({
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      videoFile: null,
      thumbnail: video.thumbnail === PLACEHOLDER_THUMB ? "" : video.thumbnail,
      thumbnailFile: null,
      category: video.category,
      isActive: video.isActive,
    });
    setEditingId(video.id || video.video_id || video._id);
    setIsPlayerOpen(false);
    setIsModalOpen(true);
  };

  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleDelete = async (video) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      setLoading(true);
      const videoId = video.id || video.video_id || video._id;
      await api.delete(`/videos/${videoId}`);
      setVideos((prev) => prev.filter((v) => (v.id || v.video_id || v._id) !== videoId));
      toast.success("Video deleted successfully");
    } catch (error) {
      toast.error("Failed to delete video");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (video) => {
    const videoId = video.id || video.video_id || video._id;
    const newStatus = !video.isActive;
    // Optimistic update
    setVideos((prev) =>
      prev.map((v) =>
        (v.id || v.video_id || v._id) === videoId ? { ...v, isActive: newStatus } : v
      )
    );
    try {
      await api.put(`/videos/${videoId}`, {
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        category: video.category,
        isActive: newStatus,
      });
      toast.success(`Video ${newStatus ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      // Revert on failure
      setVideos((prev) =>
        prev.map((v) =>
          (v.id || v.video_id || v._id) === videoId ? { ...v, isActive: !newStatus } : v
        )
      );
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      videoUrl: "",
      videoFile: null,
      thumbnail: "",
      thumbnailFile: null,
      category: "",
      isActive: true,
    });
    setEditingId(null);
    setVideoUploadMode("link");
    setUploadProgress(0);
    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // ── Filter & Paginate ───────────────────────────────────────────────────
  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Thumbnail component ─────────────────────────────────────────────────
  const VideoThumbnail = ({ video, className = "" }) => {
    const [imgSrc, setImgSrc] = useState(video.thumbnail || PLACEHOLDER_THUMB);
    return (
      <img
        src={imgSrc}
        alt={video.title}
        className={className}
        onError={() => setImgSrc(PLACEHOLDER_THUMB)}
      />
    );
  };

  // ── Video player renderer ───────────────────────────────────────────────
  const renderPlayer = (video) => {
    const url = video.videoUrl;
    if (!url) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-500">
          <FaFilm size={40} className="mr-3" /> No video source
        </div>
      );
    }
    if (isYouTubeUrl(url)) {
      return (
        <iframe
          width="100%"
          height="450"
          src={getYouTubeEmbedUrl(url)}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="rounded-lg"
        />
      );
    }
    if (isVimeoUrl(url)) {
      return (
        <iframe
          width="100%"
          height="450"
          src={url}
          title={video.title}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      );
    }
    if (isInstagramUrl(url)) {
      return (
        <iframe
          width="100%"
          height="450"
          src={getInstagramEmbedUrl(url)}
          title={video.title}
          frameBorder="0"
          allowTransparency="true"
          allow="encrypted-media"
          className="rounded-lg bg-white"
        />
      );
    }
    // Uploaded / direct video file
    return <UploadedVideoPlayer src={url} />;
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">

        

        {/* Search & View Toggle */}
        <div className="mb-6 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos by title or category..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          
          <div className="flex bg-gray-100 border border-gray-200 rounded-lg p-1 self-end md:self-auto">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === "table" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-black"
              }`}
            >
              <FaList /> 
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === "card" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-black"
              }`}
            >
              <FaTh />
            </button>

                  
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/50"
          >
            <FaPlus /> Add Video
          </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
          <span>{videos.length} total videos</span>
          <span>•</span>
          <span>{videos.filter((v) => v.isActive).length} active</span>
          {searchQuery && (
            <>
              <span>•</span>
              <span>{filteredVideos.length} results</span>
            </>
          )}
        </div>

        {/* Videos Grid/Table */}
        {loading && paginatedVideos.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-cyan-400 text-4xl" />
          </div>
        ) : paginatedVideos.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <FaFilm className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No videos found</p>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors"
            >
              Add First Video
            </button>
          </div>
        ) : (
          <div className="mb-8">
            {viewMode === "table" ? (
             <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-800 text-white">
                 
                    <tr className=" capi tracking-wide text-white">
                      <th className="px-6 py-4 font-semibold">S No</th>
                      <th className="px-6 py-4 font-semibold">Video</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold">Source</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedVideos.map((video,ind) => (
                      <tr key={video._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          
                            {ind+1}
                          
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div 
                              className="relative w-24 h-16 bg-gray-800 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                              onClick={() => handlePlayVideo(video)}
                            >
                              <VideoThumbnail video={video} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <FaPlay className="text-white text-xs ml-0.5" />
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1 max-w-[200px]" title={video.title}>{video.title}</p>
                              <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{video.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-cyan-500/20 text-black px-2 py-1 rounded-full whitespace-nowrap">
                            {video.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isYouTubeUrl(video.videoUrl) ? (
                            <span className="flex items-center gap-1.5 text-gray-600 text-sm whitespace-nowrap"><FaYoutube className="text-red-500" /> YouTube</span>
                          ) : isVimeoUrl(video.videoUrl) ? (
                            <span className="flex items-center gap-1.5 text-gray-600 text-sm whitespace-nowrap"><FaVideo className="text-blue-500" /> Vimeo</span>
                          ) : video.videoUrl ? (
                            <span className="flex items-center gap-1.5 text-gray-600 text-sm whitespace-nowrap"><FaFilm className="text-green-500" /> File</span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(video)}
                            title="Click to toggle status"
                            className="cursor-pointer"
                          >
                            {video.isActive ? (
                              <span className="text-xs bg-green-500/20 text-black px-2 py-1 rounded-full flex items-center gap-1 w-max hover:bg-green-500/40 transition-colors">
                                <FaCheck size={8} /> Active
                              </span>
                            ) : (
                              <span className="text-xs bg-red-500/20 text-red-800 px-2 py-1 rounded-full w-max block hover:bg-red-500/40 transition-colors">Inactive</span>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => handlePlayVideo(video)} className="text-cyan-400 hover:text-cyan-300 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors" title="Play">
                              <FaPlay />
                            </button>
                            <button onClick={() => handleEdit(video)} className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/10 transition-colors" title="Edit">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDelete(video)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedVideos.map((video) => (
                  <div
                    key={video._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-cyan-500/50 hover:shadow-md transition-all group shadow-sm flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative h-44 bg-gray-800 overflow-hidden cursor-pointer shrink-0"
                      onClick={() => handlePlayVideo(video)}
                    >
                      <VideoThumbnail
                        video={video}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                          <FaPlay className="text-white text-xl ml-1" />
                        </div>
                      </div>
                      {/* Badge: YouTube / Vimeo / File */}
                      <div className="absolute top-2 left-2">
                        {isYouTubeUrl(video.videoUrl) ? (
                          <span className="flex items-center gap-1 bg-red-600/90 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            <FaYoutube size={10} /> YouTube
                          </span>
                        ) : isVimeoUrl(video.videoUrl) ? (
                          <span className="flex items-center gap-1 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            <FaVideo size={10} /> Vimeo
                          </span>
                        ) : video.videoUrl ? (
                          <span className="flex items-center gap-1 bg-green-600/90 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            <FaFilm size={10} /> File
                          </span>
                        ) : null}
                      </div>
                      {/* Active/inactive indicator */}
                      <div className="absolute top-2 right-2">
                        <span className={`w-2.5 h-2.5 rounded-full block shadow-md ${video.isActive ? "bg-green-400" : "bg-gray-500"}`} title={video.isActive ? "Active" : "Inactive"} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1" title={video.title}>{video.title}</h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">{video.description}</p>
                      <div className="flex items-center justify-between mb-4 mt-auto">
                        <span className="text-xs bg-cyan-500/20 text-black px-2 py-1 rounded-full">
                          {video.category}
                        </span>
                        <button
                          onClick={() => handleToggleActive(video)}
                          title="Click to toggle status"
                          className="cursor-pointer"
                        >
                          {video.isActive ? (
                            <span className="text-xs bg-green-500/20 text-black px-2 py-1 rounded-full flex items-center gap-1 hover:bg-green-500/40 transition-colors">
                              <FaCheck size={8} /> Active
                            </span>
                          ) : (
                            <span className="text-xs bg-red-500/20 text-red-800 px-2 py-1 rounded-full hover:bg-red-500/40 transition-colors block">Inactive</span>
                          )}
                        </button>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handlePlayVideo(video)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-600/80 hover:bg-cyan-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <FaPlay size={12} /> Play
                        </button>
                        <button
                          onClick={() => handleEdit(video)}
                          className="flex items-center justify-center gap-1.5 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(video)}
                          className="flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  currentPage === index + 1
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Add/Edit Video Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? "Edit Video" : "Add New Video"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingId ? "Update the video details below." : "Fill in the details to publish a new video."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Video Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="Enter video title"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Enter video description"
                    rows="3"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                    required
                  />
                </div>

                {/* Video Source */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Video Source *</label>
                  {/* Toggle buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => { setVideoUploadMode("link"); setForm((p) => ({ ...p, videoFile: null })); }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium transition-all ${
                        videoUploadMode === "link"
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-600"
                          : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <FaLink /> External Link
                    </button>
                    <button
                      type="button"
                      onClick={() => { setVideoUploadMode("upload"); setForm((p) => ({ ...p, videoUrl: "" })); }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium transition-all ${
                        videoUploadMode === "upload"
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-600"
                          : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <FaCloudUploadAlt /> Upload File
                    </button>
                  </div>

                  {/* Link input */}
                  {videoUploadMode === "link" ? (
                    <div>
                      <input
                        type="url"
                        name="videoUrl"
                        value={form.videoUrl}
                        onChange={handleInputChange}
                        placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                      {/* Live YouTube thumbnail preview */}
                      {form.videoUrl && isYouTubeUrl(form.videoUrl) && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <FaYoutube className="text-red-400 text-2xl shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">YouTube video detected</p>
                            <p className="text-xs text-green-600 mt-0.5">✓ Thumbnail will be auto-generated</p>
                          </div>
                          {getYouTubeThumbnail(form.videoUrl) && (
                            <img
                              src={getYouTubeThumbnail(form.videoUrl)}
                              alt="preview"
                              className="w-20 h-12 object-cover rounded shrink-0"
                              onError={(e) => e.target.style.display = "none"}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Upload area */
                    <div>
                      <label
                        htmlFor="video-file-input"
                        className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          form.videoFile
                            ? "border-green-500/60 bg-green-500/5"
                            : "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60 hover:bg-cyan-500/10"
                        }`}
                      >
                        {form.videoFile ? (
                          <>
                            <FaCheck className="text-green-500 text-3xl" />
                            <div className="text-center">
                              <p className="text-green-600 font-medium">{form.videoFile.name}</p>
                              <p className="text-gray-500 text-sm mt-1">
                                {(form.videoFile.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                              <p className="text-cyan-600 text-xs mt-1">Click to change</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <FaCloudUploadAlt className="text-cyan-500 text-4xl" />
                            <div className="text-center">
                              <p className="text-gray-700 font-medium">Click to select video file</p>
                              <p className="text-gray-400 text-sm mt-1">MP4, WebM, MOV up to 500 MB</p>
                            </div>
                          </>
                        )}
                        <input
                          id="video-file-input"
                          ref={videoFileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileChange}
                          className="hidden"
                        />
                      </label>

                      {/* Upload progress bar */}
                      {uploadingVideo && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Uploading video...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Product Demo">Product Demo</option>
                    <option value="How-to">How-to</option>
                    <option value="Testimonial">Testimonial</option>
                    <option value="Behind the Scenes">Behind the Scenes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thumbnail{" "}
                    <span className="text-gray-400 font-normal">
                      (optional – auto-generated for YouTube)
                    </span>
                  </label>
                  <div className="flex items-center gap-4">
                    {form.thumbnail && (
                      <div className="relative">
                        <img
                          src={form.thumbnail}
                          alt="Thumbnail Preview"
                          className="h-20 w-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, thumbnail: "", thumbnailFile: null }))}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                      {uploadingThumbnail ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaUpload />
                      )}
                      {form.thumbnail ? "Change Image" : "Choose Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-cyan-500"
                  />
                  <label htmlFor="isActive" className="text-gray-700 font-medium cursor-pointer">
                    Make this video active (visible to users)
                  </label>
                </div>

                {/* Footer */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading || uploadingVideo || uploadingThumbnail}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading || uploadingVideo ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        {uploadingVideo ? `Uploading ${uploadProgress}%...` : "Saving..."}
                      </>
                    ) : (
                      <>
                        <FaCheck /> {editingId ? "Update Video" : "Add Video"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={loading || uploadingVideo}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all border border-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Video Player Modal ─────────────────────────────────────────── */}
        {isPlayerOpen && selectedVideo && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setIsPlayerOpen(false)}
          >
            <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-white/10">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-slate-900 z-10 rounded-t-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  {isYouTubeUrl(selectedVideo.videoUrl) && (
                    <FaYoutube className="text-red-400 text-xl shrink-0" />
                  )}
                  {isVimeoUrl(selectedVideo.videoUrl) && (
                    <FaVideo className="text-blue-400 text-xl shrink-0" />
                  )}
                  {isInstagramUrl(selectedVideo.videoUrl) && (
                    <FaInstagram className="text-pink-500 text-xl shrink-0" />
                  )}
                  {!isYouTubeUrl(selectedVideo.videoUrl) && !isVimeoUrl(selectedVideo.videoUrl) && !isInstagramUrl(selectedVideo.videoUrl) && (
                    <FaFilm className="text-cyan-400 text-xl shrink-0" />
                  )}
                  <h2 className="text-xl font-bold text-white truncate">{selectedVideo.title}</h2>
                </div>
                <button
                  onClick={() => setIsPlayerOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors ml-4 shrink-0"
                >
                  <FaTimes size={22} />
                </button>
              </div>

              {/* Player */}
              <div className="p-5">
                <div className="bg-black rounded-xl overflow-hidden mb-5">
                  {renderPlayer(selectedVideo)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoManagement;
