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
const ReelCard = ({ reel }) => {
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
    if (reel.isExternal) {
      setPlaying(!playing);
      return;
    }
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
        <div className="w-full h-full bg-white flex items-center justify-center">
          {(() => {
            const url = reel.videoUrl;
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
                let id = null;
                const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
                const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                if (shortMatch) id = shortMatch[1];
                else if (shortsMatch) id = shortsMatch[1];
                else if (watchMatch) id = watchMatch[1];
                if (id) embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
              } catch (e) {}
            }
            return (
              <div className="w-full h-full relative overflow-hidden bg-black">
                <iframe
                  src={embedUrl}
                  title="Video player"
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency="true"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute left-0 w-full max-w-none"
                  style={{ top: "-65px", height: "calc(100% + 260px)" }}
                />
              </div>
            );
          })()}
        </div>
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
      {!reel.isExternal && (
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            playing
              ? "bg-gradient-to-t from-black/70 via-transparent to-black/30"
              : "bg-gradient-to-t from-black/80 via-black/20 to-black/40"
          }`}
        />
      )}

      {/* ── Top bar ── */}
      {!reel.isExternal && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div /> {/* Empty div to keep flex space-between if needed, or just remove */}
          {/* Expand / mute buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {!reel.isExternal && (
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
              >
                {muted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Center play/pause indicator ── */}
      {!reel.isExternal && (
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
      )}

      {/* ── Right action buttons ── */}
      {!reel.isExternal && (
        <div
          className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Likes */}
          <div className="flex flex-col items-center gap-1 group/btn cursor-pointer">
            <button
              onClick={() => setLiked(!liked)}
              className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-300 ${
                liked ? "text-pink-500 bg-pink-500/20" : "text-white group-hover/btn:bg-white/20"
              }`}
            >
              <FaHeart size={16} />
            </button>
            <span className="text-white text-[10px] font-bold drop-shadow-md">
              {reel.likes}
            </span>
          </div>
          {/* Comments */}
          <div className="flex flex-col items-center gap-1 group/btn cursor-pointer">
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover/btn:bg-white/20 transition-all duration-300">
              <FaComment size={16} />
            </button>
            <span className="text-white text-[10px] font-bold drop-shadow-md">
              {reel.comments}
            </span>
          </div>
          {/* Share */}
          <div className="flex flex-col items-center gap-1 group/btn cursor-pointer">
            <a
              href={reel.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover/btn:bg-white/20 transition-all duration-300"
            >
              <FaShare size={16} />
            </a>
            <span className="text-white text-[10px] font-bold drop-shadow-md">
              Share
            </span>
          </div>
        </div>
      )}

      {/* ── Bottom caption ── */}
      {!reel.isExternal && (
        <div
          className="absolute bottom-6 left-4 right-16 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-pink-400 text-[10px] font-bold tracking-widest uppercase block mb-1">
            {reel.tag}
          </span>
          <p className="text-white font-bold text-sm leading-snug drop-shadow-lg line-clamp-2">
            {reel.caption}
          </p>
        </div>
      )}

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

// ─── Main Section ───────────────────────────────────────────────────────────
const ReelsSwiper = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
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
          .reels-swiper .swiper-slide { height: 80vh; min-height: 500px; max-height: 850px; }
          @media (min-width: 640px) {
            .reels-swiper .swiper-slide { height: 85vh; min-height: 600px; max-height: 950px; }
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
              <ReelCard reel={reel} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ReelsSwiper;
