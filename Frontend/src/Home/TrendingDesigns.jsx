import React, { useContext, useState } from "react";
import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const DesignCard = ({ id, name, rating, images }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg group relative bg-white mx-auto"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Trending Label */}
      <span className="absolute top-4 left-0 bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-r-full z-30 shadow-md">
        Trending
      </span>

      {/* Image Container */}
      <div className="w-full h-[300px] relative overflow-hidden bg-primary/10">
        {/* First image */}
        <img
          src={images?.[0]}
          alt={name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500 ${
            hovered ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
          decoding="async"
        />

        {/* Second image on hover */}
        <img
          src={images?.[1] || images?.[0]}
          alt={name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transform transition-all duration-700 ${
            hovered ? "scale-110 opacity-100" : "scale-100 opacity-0"
          }`}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Info */}
      <div className="bg-primary text-white flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="font-bold text-lg">{name}</h3>
          <h4 className="font-bold text-lg">MRP : <del>  </del>   </h4>
          <p className="text-sm">⭐ {rating || "0.0"}</p>
        </div>
        <button
          onClick={() => navigate(`/designdetails/${id}`)}
          className="bg-white hover:border-white border text-primary font-semibold text-xs px-4 py-2 rounded-full shadow hover:bg-primary hover:text-white transition cursor-pointer"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

const TrendingDesigns = () => {
  const { designs } = useContext(AuthContext);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 2000,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  // Loading state when designs haven't loaded yet
  if (!designs || designs.length === 0) {
    return (
      <div className="bg-[#fff9f6] py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-10 text-primary">
          Trending Designs
        </h1>
        <div className="flex justify-center items-center mt-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fff9f6] py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-10 text-primary">
        Trending Designs
      </h1>
      <Slider {...settings} className="mx-5">
        {designs?.slice(0, 8).map((design) => (
          <div key={design.id} className="px-3">
            <DesignCard
              id={design.id}
              name={design.name}
              rating={design.rating}
              images={design.images || [design.image]}
              // mrp={design.mrp}
              // salePrice={design.salePrice}
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default TrendingDesigns;

