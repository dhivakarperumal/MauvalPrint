import React, { useContext } from "react";
import Slider from "react-slick";
import { FaQuoteLeft, FaQuoteRight, FaStar, FaRegUser } from "react-icons/fa";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AuthContext } from "../Context/AuthContext";

function Testimonial() {
  const { reviews } = useContext(AuthContext);

  if (!reviews || reviews.length === 0) {
    return <p className="text-center text-gray-500">Loading testimonials...</p>;
  }

  const topreviews = reviews.slice(0, 6);

  const settings = {
    infinite: true,
    autoplay: true,
    speed: 1000,
    autoplaySpeed: 3000,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="bg-[#e5e8f0] py-14 px-4">
      <h2 className="text-3xl font-bold text-center mb-10">
        OUR CLIENT
        <span className="block text-primary text-xl italic font-signature mt-1">
          Testimonials
        </span>
      </h2>

      <Slider {...settings}>
        {topreviews.map((review, i) => {
          const { name, comment, product, rating, image } = review;
          const imagePath = image || false;

          return (
            <div key={i} className="px-0 md:px-3">
              <div className="relative group text-white px-3 md:px-4 pt-15 pb-8 text-center flex flex-col justify-between">
                {/* Image */}
                <div className="absolute left-1/2 top-18 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 p-2 rounded-full border-[5px] border-primary/90 bg-white overflow-hidden shadow-lg z-20">
                  {imagePath ? (
                    <img
                      src={imagePath}
                      alt="client"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FaRegUser className="text-primary p-2 w-full h-full" />
                  )}
                </div>

                {/* Review box */}
                <div className="relative bg-primary mt-6 rounded-tl-[50px] rounded-tr-[30px] rounded-bl-[30px] rounded-br-[50px] px-6 pt-10 pb-10 shadow-xl">
                  <FaQuoteLeft className="absolute top-4 left-4 text-xl text-white" />
                  <FaQuoteRight className="absolute bottom-4 right-4 text-xl text-white" />
                  <div className="mt-4">
                    <h3 className="font-bold text-white text-lg">{name}</h3>
                    <p className="text-sm">{product}</p>

                    <p className="text-[15px] mt-2 leading-relaxed line-clamp-2">
                      {comment}
                    </p>
                    <div className="flex justify-center mt-2 text-yellow-500">
                      {[...Array(Math.round(rating || 5))].map((_, j) => (
                        <FaStar key={j} className="mx-0.5 text-xs" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </Slider>
    </div>
  );
}

export default Testimonial;
