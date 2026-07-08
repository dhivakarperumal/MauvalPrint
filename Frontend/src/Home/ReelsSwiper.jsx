import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import {
  FaPlay, FaPause, FaInstagram, FaVolumeMute, FaVolumeUp,
  FaHeart, FaComment, FaShare, FaChevronLeft, FaChevronRight
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
const ReelCard = ({ reel, active }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };

    const onEnded = () => {
      setPlaying(false);
      if (active) {
        video.currentTime = 0;
        video.play().catch(() => {});
        setPlaying(true);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [active]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reel.isExternal) return;
    video.muted = muted;

    if (active && !userPaused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [active, muted, userPaused, reel.isExternal]);

  useEffect(() => {
    if (!reel.isExternal) return;
    if (active) {
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  }, [active, reel.isExternal]);

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (reel.isExternal) {
      setPlaying(!playing);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
      setPlaying(false);
      setUserPaused(true);
    } else {
      video.play().catch(() => {});
      setPlaying(true);
      setUserPaused(false);
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
      className={`relative w-full h-full rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(15,23,42,0.35)] cursor-pointer select-none bg-slate-950 ${
        active ? "ring-2 ring-pink-400/40" : ""
      }`}
      onClick={togglePlay}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80 opacity-80" />

      {reel.isExternal ? (
        playing ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            {(() => {
              const url = reel.videoUrl;
              let embedUrl = url;
              if (url.includes("instagram.com")) {
                try {
                  const urlObj = new URL(url);
                  let cleanPath = urlObj.pathname.replace(/^\/(?:reel|tv|reels)\//, '/p/');
                  if (!cleanPath.endsWith('/')) cleanPath += '/';
                  embedUrl = `https://www.instagram.com${cleanPath}embed/`;
                } catch {
                  // Ignore invalid Instagram embed URL
                }
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
                } catch {
                  // Ignore invalid YouTube embed URL
                }
              }
              return (
                <iframe
                  src={embedUrl}
                  title="Video player"
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency="true"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              );
            })()}
          </div>
        ) : (
          <img src={reel.thumbnail} className="w-full h-full object-cover" alt="Thumbnail" />
        )
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
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <button
          type="button"
          onClick={togglePlay}
          className="pointer-events-auto w-14 h-14 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition hover:bg-black/80"
        >
          {playing ? <FaPause size={18} /> : <FaPlay size={18} />}
        </button>
      </div>

      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-md">
          {reel.tag}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-3">
        <button
          onClick={toggleMute}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition hover:bg-white/20"
        >
          {muted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition hover:bg-white/20 ${
            liked ? "text-pink-400" : "text-white"
          }`}
        >
          <FaHeart size={14} />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-5">
        <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-yellow-400 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="rounded-[1.75rem] bg-black/40 p-4 backdrop-blur-xl border border-white/10">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">{reel.tag}</p>
          <h3 className="mt-2 text-lg font-semibold text-white leading-6 line-clamp-2">{reel.caption}</h3>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-white/90 text-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <FaHeart size={14} className="text-pink-400" />
                {reel.likes}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <FaComment size={14} />
                {reel.comments}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-white transition hover:bg-white/20">
                <FaShare size={14} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Section ───────────────────────────────────────────────────────────
const ReelsSwiper = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
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

        {/* Swiper layout */}
        <style>{`
          .reels-swiper .swiper-slide { height: 300px; }
          @media (min-width: 640px) {
            .reels-swiper .swiper-slide { height: 350px; }
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
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex);
          }}
          onSwiper={(swiper) => {
            setActiveIndex(swiper.realIndex);
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
            480:  { slidesPerView: 3, spaceBetween: 12 },
            640:  { slidesPerView: 4, spaceBetween: 16, centeredSlides: false },
            768:  { slidesPerView: 5, spaceBetween: 16, centeredSlides: false },
            1024: { slidesPerView: 5, spaceBetween: 20, centeredSlides: false },
          }}
        >
          {reels.map((reel, index) => (
            <SwiperSlide key={reel.id}>
              <ReelCard reel={reel} active={index === activeIndex} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ReelsSwiper;
