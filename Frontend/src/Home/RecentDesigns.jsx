import React, { useContext, useState, useMemo, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import api from "../api";
import PageContainer from "../Components/PageContainer";
import Select from "react-select";
import { FaFilter } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

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
          className={`
      absolute inset-0
      w-full h-full
      object-contain p-4
      transition-opacity duration-300
      z-10
      ${hovered ? "opacity-0" : "opacity-100"}
    `}
          width={400}
          height={350}
        />

        {hoverImageLoaded && (
          <OptimizedImage
            src={hoverImage}
            alt={`${name} hover`}
            onClick={() => navigate(`/designdetails/${id}`)}
            className={`
        absolute inset-0
        w-full h-full
        object-contain p-4
        transition-opacity duration-300
        z-20
        ${hovered ? "opacity-100" : "opacity-0"}
      `}
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


  const fitOptions = fits.map((f) => ({
    value: f,
    label: f,
  }));

  const designOptions = [
    { value: "All", label: "All Designs" },
    ...homeKeywords.map((kw) => ({
      value: kw.keyword_name,
      label: kw.keyword_name,
    })),
  ];


  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "56px",
      borderRadius: "18px",
      border: "2px solid #f472b6",
      background: "linear-gradient(135deg,#ffffff,#f8fafc,#f1f5f9)",
      boxShadow: state.isFocused
        ? "0 0 0 4px rgba(244,114,182,0.15)"
        : "0 8px 25px rgba(0,0,0,0.08)",
      cursor: "pointer",
      transition: "all 0.3s ease",
    }),

    valueContainer: (base) => ({
      ...base,
      padding: "0 14px",
    }),

    placeholder: (base) => ({
      ...base,
      color: "#374151",
      fontWeight: 600,
    }),

    singleValue: (base) => ({
      ...base,
      color: "#1f2937",
      fontWeight: 600,
    }),

    indicatorSeparator: () => ({
      display: "none",
    }),

    dropdownIndicator: (base) => ({
      ...base,
      color: "#374151",
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    }),

    menu: (base) => ({
      ...base,
      zIndex: 99999,
      borderRadius: "18px",
      overflow: "hidden",
      boxShadow: "0 15px 40px rgba(0,0,0,0.18)",
      border: "1px solid #e5e7eb",
    }),

    menuList: (base) => ({
      ...base,
      padding: "6px",
    }),

    option: (base, state) => ({
      ...base,
      borderRadius: "12px",
      marginBottom: "4px",
      padding: "14px 16px",
      backgroundColor: state.isSelected
        ? "#243B55"
        : state.isFocused
          ? "#f3f4f6"
          : "#ffffff",
      color: state.isSelected ? "#ffffff" : "#374151",
      cursor: "pointer",
      fontWeight: 500,
    }),
  };

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

        <div className="flex justify-end mb-4">
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              className="
        flex
        items-center
        gap-2
        px-3
        py-2
        rounded-xl
        bg-white
        shadow-md
        border
        border-gray-200
        hover:shadow-lg
        transition-all
        duration-300
      "
            >
              <FaFilter className="text-lg text-primary" />
              <span className="text-sm font-medium text-gray-700">
                Filters
              </span>
            </button>
          )}
        </div>
        {/* Filters */}
        {showFilters && (
          <div className="w-full mb-12">
            <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 border border-pink-100 rounded-3xl px-6 md:px-10 py-6 shadow-md">

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">

                {/* Left Side Hide Button */}
                <button
                  onClick={() => setShowFilters(false)}
                  className="
            flex
            items-center
            gap-2
            px-4
            py-3
            rounded-xl
            bg-white
            shadow-md
            border
            border-gray-200
            hover:shadow-lg
            transition-all
            duration-300
            w-fit
          "
                >
                  <IoClose className="text-primary text-lg" />
                  <span className="font-medium text-gray-700">
                    Hide Filters
                  </span>
                </button>

                {/* Right Side Filters */}
                <div className="flex flex-col md:flex-row items-center gap-5">

                  {/* Size Filter */}
                  <div>


                    <Select
                      className="w-[240px]"
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      options={fitOptions}
                      value={fitOptions.find((o) => o.value === fit)}
                      onChange={(selected) => setFit(selected.value)}
                    />
                  </div>

                  {/* Design Filter */}
                  <div>

                    <Select
                      className="w-[320px]"
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      options={designOptions}
                      value={designOptions.find(
                        (o) => o.value === selectedSubcategory
                      )}
                      onChange={(selected) =>
                        setSelectedSubcategory(selected.value)
                      }
                    />
                  </div>

                </div>

              </div>

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
                spaceBetween={16}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                  1280: { slidesPerView: 5 },
                }}
                modules={[Autoplay, Navigation]}
                navigation
                autoplay={{
                  delay: 2800,
                  disableOnInteraction: true,
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
    </div>

  );
};

export default RecentDesigns;
