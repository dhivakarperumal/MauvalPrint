import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { 
  FaPlay, FaPause, FaInstagram, FaVolumeMute, FaVolumeUp, 
  FaExpand, FaHeart, FaComment, FaShare, FaTimes, FaChevronLeft, FaChevronRight, FaArrowRight 
} from "react-icons/fa";
import api from "../api";
import "swiper/css";
import "swiper/css/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────
const toStreamUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/api/stream/')) return url;
  const absMatch = url.match(/^https?:\/\/[^/]+\/uploads\/(.+)$/);
  if (absMatch) return `/api/stream/${absMatch[1]}`;
  const proxyMatch = url.match(/^\/proxy-uploads\/(.+)$/);
  if (proxyMatch) return `/api/stream/${proxyMatch[1]}`;
  return url;
};

const toProxyUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/api/stream/')) return url;
  const absMatch = url.match(/^https?:\/\/[^/]+\/uploads\/(.+)$/);
  if (absMatch) return `/api/stream/${absMatch[1]}`;
  const proxyMatch = url.match(/^\/proxy-uploads\/(.+)$/);
  if (proxyMatch) return `/api/stream/${proxyMatch[1]}`;
  return url;
};

const PLACEHOLDER_THUMB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23f3f4f6' width='300' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";

const normalizeVideo = (video) => {
  let thumbnailUrl = video.thumbnail || "";
  if (thumbnailUrl && !thumbnailUrl.startsWith('data:')) {
    thumbnailUrl = toProxyUrl(thumbnailUrl);
  }
  let videoUrl = video.video_url || video.videoUrl || "";
  videoUrl = toStreamUrl(videoUrl);
  if (!thumbnailUrl) thumbnailUrl = PLACEHOLDER_THUMB;

  return {
    id: video.id || video.video_id || video._id,
    caption: video.description || video.title || "",
    videoUrl,
    thumbnail: thumbnailUrl,
    tag: video.category || "Reel",
    likes: Math.floor(Math.random() * 1000) + 50, // Mock data for UI
    comments: Math.floor(Math.random() * 100) + 5, // Mock data for UI
    instagramUrl: "#",
    isActive: video.is_active !== undefined ? video.is_active : true,
    isExternal: videoUrl.includes("youtube.com") || videoUrl.includes("vimeo.com") || videoUrl.includes("instagram.com")
  };
};

// ─── Reel Card (Inline Slide) ───────────────────────────────────────────────
const ReelCard = ({ reel, onExpand }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration)
        setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  const togglePlay = (e) => {
    if (reel.isExternal) return; // Cannot control iframes natively this way
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video.play().catch(() => {});
      setPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  return (
    <div
      className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer group select-none bg-black"
      onClick={togglePlay}
    >
      {/* Video element */}
      {reel.isExternal ? (
        <img src={reel.thumbnail} className="w-full h-full object-cover" alt="Thumbnail" />
      ) : (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.thumbnail}
          loop
          muted={muted}
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
        />
      )}

      {/* Dark overlay — lighter when playing */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          playing
            ? "bg-gradient-to-t from-black/70 via-transparent to-black/30"
            : "bg-gradient-to-t from-black/80 via-black/20 to-black/40"
        }`}
      />

      {/* ── Top bar ── */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5">
          <FaInstagram className="text-pink-400 text-sm" />
          <span className="text-white text-xs font-bold tracking-wide">
            @ozone.official
          </span>
        </div>
        {/* Expand / mute buttons */}
        <div className="flex items-center gap-2">
          {!reel.isExternal && (
            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
            >
              {muted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand(reel);
            }}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <FaExpand size={11} />
          </button>
        </div>
      </div>

      {/* ── Center play/pause indicator ── */}
      <div
        className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300 ${
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 backdrop-blur-sm flex items-center justify-center shadow-2xl">
          {playing ? (
            <FaPause className="text-white text-lg" />
          ) : (
            <FaPlay className="text-white text-lg ml-1" />
          )}
        </div>
      </div>

      {/* ── Right action buttons ── */}
      <div
        className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setLiked((v) => !v)}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
              liked
                ? "bg-red-500 scale-110"
                : "bg-white/20 border border-white/30 hover:bg-white/30"
            }`}
          >
            <FaHeart className="text-white text-sm" />
          </div>
          <span className="text-white text-[10px] font-bold">{reel.likes}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-all">
            <FaComment className="text-white text-sm" />
          </div>
          <span className="text-white text-[10px] font-bold">
            {reel.comments}
          </span>
        </button>

        <a
          href={reel.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-all">
            <FaShare className="text-white text-sm" />
          </div>
          <span className="text-white text-[10px] font-bold">Share</span>
        </a>
      </div>

      {/* ── Bottom caption ── */}
      <div className="absolute bottom-5 left-4 right-16 z-10">
        <span className="text-pink-400 text-[10px] font-bold tracking-widest uppercase block mb-1">
          {reel.tag}
        </span>
        <p className="text-white font-bold text-sm leading-tight drop-shadow-lg line-clamp-2">
          {reel.caption}
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-yellow-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// ─── Fullscreen Modal ───────────────────────────────────────────────────────
const ReelModal = ({ reel, onClose }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reel.isExternal) return;
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
    }
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, reel.isExternal]);

  useEffect(() => {
    if (reel.isExternal) return;
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration)
        setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [reel.isExternal]);

  const togglePlay = () => {
    if (reel.isExternal) return;
    const video = videoRef.current;
    if (!video) return;
    playing ? video.pause() : video.play();
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (reel.isExternal) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  // Convert external URLs to embed formats if necessary (simplified for the modal)
  const renderExternalVideo = (url) => {
    let embedUrl = url;
    if (url.includes("instagram.com")) {
      try {
        const urlObj = new URL(url);
        let cleanPath = urlObj.pathname.replace(/^\/(?:reel|tv|reels)\//, '/p/');
        if (!cleanPath.endsWith('/')) cleanPath += '/';
        embedUrl = `https://www.instagram.com${cleanPath}embed/`;
      } catch (e) {}
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      try {
        const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      } catch (e) {}
    }
    return (
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="Video player"
        frameBorder="0"
        scrolling="no"
        allowTransparency="true"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="bg-white w-full h-full object-cover"
      />
    );
  };

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition z-10"
      >
        <FaTimes size={20} />
      </button>

      {/* Modal card */}
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-black"
        style={{ height: "85vh", maxHeight: "700px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        {reel.isExternal ? (
          renderExternalVideo(reel.videoUrl)
        ) : (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.thumbnail}
            loop
            muted={muted}
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* Gradient */}
        {!reel.isExternal && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
        )}

        {/* Top */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 pointer-events-auto">
            <FaInstagram className="text-pink-400 text-sm" />
            <span className="text-white text-xs font-bold">@ozone.official</span>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            {!reel.isExternal && (
              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
              >
                {muted ? <FaVolumeMute size={13} /> : <FaVolumeUp size={13} />}
              </button>
            )}
          </div>
        </div>

        {/* Center play/pause */}
        {!reel.isExternal && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto"
          >
            <div
              className={`w-18 h-18 rounded-full bg-white/20 border-2 border-white/60 backdrop-blur-sm flex items-center justify-center shadow-2xl transition-opacity duration-300 ${
                playing ? "opacity-0 hover:opacity-100" : "opacity-100"
              }`}
              style={{ width: 72, height: 72 }}
            >
              {playing ? (
                <FaPause className="text-white text-2xl" />
              ) : (
                <FaPlay className="text-white text-2xl ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Right actions */}
        <div className="absolute right-4 bottom-28 flex flex-col items-center gap-5 z-10 pointer-events-auto">
          <div className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <FaHeart className="text-white" />
            </div>
            <span className="text-white text-xs font-bold">{reel.likes}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <FaComment className="text-white" />
            </div>
            <span className="text-white text-xs font-bold">{reel.comments}</span>
          </div>
          <a
            href={reel.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 hover:text-white"
          >
            <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors">
              <FaShare className="text-white" />
            </div>
            <span className="text-white text-xs font-bold">Share</span>
          </a>
        </div>

        {/* Bottom caption */}
        <div className="absolute bottom-8 left-4 right-16 z-10 pointer-events-none">
          <span className="text-pink-400 text-xs font-bold tracking-widest uppercase block mb-1">
            {reel.tag}
          </span>
          <p className="text-white font-bold text-base leading-snug drop-shadow-lg pointer-events-auto">
            {reel.caption}
          </p>
        </div>

        {/* Progress bar */}
        {!reel.isExternal && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-yellow-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Section ───────────────────────────────────────────────────────────
const ReelsSwiper = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [expandedReel, setExpandedReel] = useState(null);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await api.get("/videos");
        const normalized = (data.videos || [])
          .map(normalizeVideo)
          .filter(v => v.isActive);
        setReels(normalized);
      } catch (error) {
        console.error("Failed to load videos for reels", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading || reels.length === 0) return null;

  return (
    <section className="py-20 bg-[var(--primary)] relative overflow-hidden">
      {/* BG decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 shadow-lg mb-5">
              <FaInstagram className="text-white text-base" />
              <span className="text-white text-xs font-black tracking-widest uppercase">
                Instagram Reels
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
              Featured{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
                Videos
              </span>
            </h2>
            <p className="text-gray-600 font-medium text-base mt-3 max-w-md">
              Watch our latest videos, product highlights, and behind-the-scenes moments.
              Click any reel to expand!
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              ref={prevRef}
              className="w-11 h-11 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-600 hover:bg-pink-500 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <FaChevronLeft size={20} />
            </button>
            <button
              ref={nextRef}
              className="w-11 h-11 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-600 hover:bg-pink-500 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <FaChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Swiper */}
        <style>{`
          .reels-swiper .swiper-slide { height: 500px; }
          @media (min-width: 640px) {
            .reels-swiper .swiper-slide { height: 560px; }
          }
        `}</style>

        <Swiper
          className="reels-swiper"
          modules={[Navigation, Autoplay]}
          spaceBetween={20}
          slidesPerView={1.2}
          centeredSlides={true}
          loop={true}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onSwiper={(swiper) => {
            setTimeout(() => {
              if (swiper.params?.navigation) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.destroy();
                swiper.navigation.init();
                swiper.navigation.update();
              }
            }, 0);
          }}
          breakpoints={{
            480:  { slidesPerView: 1.8, spaceBetween: 16 },
            640:  { slidesPerView: 2.2, spaceBetween: 20, centeredSlides: true },
            1024: { slidesPerView: 3.2, spaceBetween: 24, centeredSlides: false },
            1280: { slidesPerView: 4,   spaceBetween: 24, centeredSlides: false },
          }}
        >
          {reels.map((reel) => (
            <SwiperSlide key={reel.id}>
              <ReelCard reel={reel} onExpand={setExpandedReel} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Bottom CTA strip */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 bg-white border border-gray-200 shadow-sm rounded-2xl px-8 py-5">
          <FaInstagram className="text-pink-500 text-2xl hidden sm:block" />
          <p className="text-gray-900 text-sm font-semibold text-center">
            Watch more content like this on our social media!
          </p>
        </div>
      </div>

      {/* Fullscreen modal */}
      {expandedReel && (
        <ReelModal reel={expandedReel} onClose={() => setExpandedReel(null)} />
      )}
    </section>
  );
};

export default ReelsSwiper;
