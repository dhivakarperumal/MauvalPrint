import React, { useContext, useState, useMemo, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import api from "../api";
import PageContainer from "../Components/PageContainer";
const toRoman = (num) => {
  const lookup = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let roman = "";
  for (const [value, symbol] of lookup) {
    while (num >= value) { roman += symbol; num -= value; }
  }
  return roman;
};

// Image optimization utility
const optimizeImageUrl = (url) => {
  if (!url) return url;
  // Add quality and size parameters for Firebase Storage URLs - VERY SMALL FOR SPEED
  if (url.includes('firebaseapp.com')) {
    return `${url}&w=400&q=60`; // Reduced quality for speed
  }
  return url;
};

// Optimized Image Component with error handling
const OptimizedImage = memo(({ src, alt, ...props }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={optimizeImageUrl(src)}
      alt={alt}
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Memoized Single Design Card Component
const DesignCard = memo(({ id, name, rating, images, mrp, salePrice, size = [] }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [hoverImageLoaded, setHoverImageLoaded] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  const sizeOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
  const sortedSizes = useMemo(() => 
    [...size].sort((a, b) => sizeOrder.indexOf(a.toLowerCase()) - sizeOrder.indexOf(b.toLowerCase())),
    [size]
  );

  const handleBuyNow = useCallback(() => {
    navigate(`/designdetails/${id}`, {
      state: { selectedSize: null },
    });
  }, [id, navigate]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if (!hoverImageLoaded) {
      setHoverImageLoaded(true);
    }
  }, [hoverImageLoaded]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const mainImage = useMemo(() => optimizeImageUrl(images?.[0]), [images]);
  const hoverImage = useMemo(() => optimizeImageUrl(images?.[1] || images?.[0]), [images]);

  return (
    <div
      className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg group relative bg-white cursor-pointer h-[420px] flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <div className="w-full h-[300px] relative overflow-hidden bg-primary/10 flex items-center justify-center">
        <OptimizedImage
          src={mainImage}
          alt={name}
          onClick={() => navigate(`/designdetails/${id}`)}
          onLoad={() => setMainImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-200 opacity-100 ${hovered ? "opacity-0" : "opacity-100"}`}
          width={400}
          height={350}
        />
        {hoverImageLoaded && (
          <OptimizedImage
            src={hoverImage}
            alt={`${name} hover`}
            onClick={() => navigate(`/designdetails/${id}`)}
            className={`absolute inset-0 w-full h-full object-contain p-4 transition-all duration-300 ${
              hovered ? "opacity-100 scale-110" : "opacity-0 scale-100"
            }`}
            width={400}
            height={350}
          />
        )}
      </div>

      {/* Sizes */}
      {sortedSizes && sortedSizes.length > 0 && (
        <div className="mt-3 mb-2 text-sm text-gray-600 flex flex-wrap items-center justify-center gap-2">
          {sortedSizes.map((sz, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-xs border bg-white text-gray-700 border-gray-300"
            >
              {sz}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Info Bar */}
      <div className="bg-primary text-white flex flex-col items-center px-4 py-3 mt-auto sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-sm sm:text-lg truncate">{name}</h3>
          <h4 className="font-bold text-sm sm:text-lg">
            MRP : <del>{mrp}</del> {salePrice}
          </h4>
          <p className="text-xs sm:text-sm">⭐ {rating || "0.0"}</p>
        </div>
        <button
          onClick={handleBuyNow}
          className="bg-white border border-white text-primary font-semibold text-xs px-4 py-2 rounded-full shadow hover:bg-primary hover:text-white transition mt-2 sm:mt-0"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo to prevent unnecessary re-renders
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.rating === nextProps.rating &&
    JSON.stringify(prevProps.images) === JSON.stringify(nextProps.images) &&
    prevProps.mrp === nextProps.mrp &&
    prevProps.salePrice === nextProps.salePrice &&
    JSON.stringify(prevProps.size) === JSON.stringify(nextProps.size)
  );
});

DesignCard.displayName = 'DesignCard';

// -----------------------------
// 🧩 Loading Spinner Component
// -----------------------------
const Spinner = () => (
  <div className="flex justify-center items-center mt-20">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// -----------------------------
// 🧩 Recent Designs Component
// 🚀 SUPER OPTIMIZED FOR SPEED
const RecentDesigns = () => {
  const { designs } = useContext(AuthContext);
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [fit, setFit] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [homeKeywords, setHomeKeywords] = useState([]);
  const [keywordsLoaded, setKeywordsLoaded] = useState(false);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const { data } = await api.get('/keywords/home');
        if (data.success) {
          setHomeKeywords(data.keywords);
        }
      } catch (error) {
        console.error("Failed to fetch home keywords", error);
      } finally {
        setKeywordsLoaded(true);
      }
    };
    fetchKeywords();
  }, []);

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Show filters if desktop or toggled
  const shouldShowFilters = isDesktop || showFilters;

  // Predefined fits
  const fits = useMemo(
    () => ["All", ...new Set(designs?.map((d) => d.subcategory).filter(Boolean))],
    [designs]
  );

  // Filter designs by fit
  const filteredDesigns = useMemo(() => {
    if (!designs) return [];
    let filtered = designs;
    if (fit !== "All") {
      filtered = filtered.filter((d) => d.subcategory?.toLowerCase() === fit.toLowerCase());
    }
    return filtered;
  }, [designs, fit]);

  // Group by keyword
  const groupedByKeyword = useMemo(() => {
    const groups = {};
    filteredDesigns.forEach((design) => {
      const kw = design.keyword || "Other";
      if (!groups[kw]) groups[kw] = [];
      groups[kw].push(design);
    });
    return groups;
  }, [filteredDesigns]);

  return (
    
      <div className="min-h-screen bg-[#fef4f3] py-10 px-4">
        <PageContainer>
        {/* Filter Toggle Button for Mobile */}
      {!isDesktop && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-primary text-white rounded-full font-medium shadow hover:bg-primary/90 transition flex items-center gap-2"
          >
            <i className="fa-solid fa-filter"></i> Filters
          </button>
        </div>
      )}

      {/* Filters */}
      {shouldShowFilters && (
        <div className="mb-8 flex flex-row flex-wrap justify-center items-center gap-6">
        <div className="flex flex-col items-center">
          <label className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">Size</label>
          <select
            value={fit}
            onChange={(e) => setFit(e.target.value)}
            className="px-6 py-3 border-2 border-primary/20 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-gray-800 font-medium focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {fits.map((f) => (
              <option key={f} value={f} className="bg-white text-gray-800">
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center">
          <label className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">Design</label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="px-6 py-3 border-2 border-primary/20 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-gray-800 font-medium focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <option value="All" className="bg-white text-gray-800">All Keywords</option>
            {homeKeywords.map((kw, index) => (
              <option key={kw.keyword_id} value={kw.keyword_name} className="bg-white text-gray-800">
                {toRoman(index + 1)}. {kw.keyword_name}
              </option>
            ))}
          </select>
        </div>
    </div>
      )}

      {/* Sections */}
      {!keywordsLoaded ? (
        <Spinner />
      ) : (
        <>
          {homeKeywords.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No categories configured for the home page. Please enable keywords to show on home from the Admin Panel.
            </div>
          )}
          {homeKeywords.map((kw, index) => {
            const items = (groupedByKeyword[kw.keyword_name] || []).slice(0, 6); // Show only 6 items per category for speed
            if (selectedSubcategory !== "All" && selectedSubcategory !== kw.keyword_name) return null;
            if (items.length === 0) return null;
            return (
              <div key={kw.keyword_id} className="mb-14">
                <div className="text-left mb-8">
                  <h2 className="text-2xl font-bold text-primary inline-block relative pb-2 after:content-[''] after:absolute after:left-1/2 after:-bottom-1 after:-translate-x-1/2 after:w-20 after:h-[3px] after:bg-primary">
                    {toRoman(index + 1)}. {kw.keyword_name}
                  </h2>
                </div>

              <Swiper
                spaceBetween={10}
                slidesPerView={2}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 5 },
                }}
                modules={[Autoplay]}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                loop={true}
                className="w-full"
              >
                {items.map((design) => (
                  <SwiperSlide key={design.id}>
                    <DesignCard
                      id={design.product_id}
                      name={design.name}
                      rating={design.rating}
                      images={design.images || [design.image]}
                      mrp={design.mrp}
                      salePrice={design.salePrice}
                      size={design.size || []}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            );
          })}
        </>
      )}
      </PageContainer>
    </div>
   
  );
};

export default RecentDesigns;
