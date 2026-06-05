import React, { useContext } from "react";
import Slider from "react-slick";
import { FaStar, FaRegUser } from "react-icons/fa";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AuthContext } from "../Context/AuthContext";
import PageContainer from "../Components/PageContainer";

function Testimonial() {
  const { reviews } = useContext(AuthContext);

  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-center text-gray-500 py-10">
        Loading testimonials...
      </p>
    );
  }

  const topReviews = reviews.slice(0, 6);

  const settings = {
    infinite: true,
    autoplay: true,
    speed: 800,
    autoplaySpeed: 3500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16">
      <PageContainer>

        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">
            What Our Customers Say
          </h2>

          <p className="text-gray-500 mt-3">
            Real reviews from our happy customers
          </p>
        </div>

        {/* Slider */}
        <Slider {...settings}>
          {topReviews.map((review, i) => {
            const {
              name,
              comment,
              product,
              rating,
              image,
            } = review;

            return (
             <div key={i} className="px-3 py-10">
  <div
    className="
      relative
      h-[235px]
      rounded-[30px]
      bg-white/20
      backdrop-blur-2xl
      border
      border-primary/30
      shadow-[0_8px_32px_rgba(31,38,135,0.15)]
      overflow-visible
      text-center
      transition-all
      duration-300
      hover:-translate-y-2
      hover:shadow-[0_15px_40px_rgba(31,38,135,0.2)]
    "
  >
    {/* Glass Highlight */}
    <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />

    {/* Floating Image */}
    <div
      className="
        absolute
        left-1/2
        -top-10
        -translate-x-1/2
        w-20
        h-20
        rounded-full
        bg-white
        border-[4px]
        border-white/80
        shadow-xl
        overflow-hidden
        z-20
      "
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FaRegUser className="text-primary text-3xl" />
        </div>
      )}
    </div>

    {/* Content */}
    <div className="h-full px-5 pt-14 pb-4 flex flex-col justify-between relative z-10">

      {/* Rating */}
      <div className="flex justify-center">
        {[...Array(Math.round(rating || 5))].map((_, j) => (
          <FaStar
            key={j}
            className="text-yellow-400 text-xs mx-0.5"
          />
        ))}
      </div>

      {/* Comment */}
      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 px-1">
        "{comment}"
      </p>

      {/* User Info */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg truncate">
          {name}
        </h3>

        <p className="text-primary text-sm font-medium truncate">
          {product}
        </p>
      </div>

    </div>
  </div>
</div>
            );
          })}
        </Slider>

      </PageContainer>
    </section>
  );
}

export default Testimonial;
