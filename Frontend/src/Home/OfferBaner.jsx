import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";

const OfferBanner = () => {
  const [timeLeft, setTimeLeft] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const images = [
    "/Image/Designs/bs1.png",
    "/Image/Designs/csk2.png",
    "/Image/Designs/w3.png",
  ];

  const offerEndDate = new Date();
  offerEndDate.setDate(offerEndDate.getDate() + 1);
  offerEndDate.setHours(23, 59, 59, 999); 

  useEffect(() => {
    let intervalCountdown;

    const updateCountdown = () => {
      const now = new Date();
      const distance = offerEndDate - now;

      if (distance <= 0) {
        clearInterval(intervalCountdown);
        setTimeLeft({});
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / 1000 / 60) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      });
    };

    updateCountdown(); // ✅ Call after declaration

    intervalCountdown = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalCountdown);
  }, []);

  useEffect(() => {
    const intervalImage = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(intervalImage);
  }, [images.length]);

  return (
    <div className="relative bg-primary rounded-xl px-6 md:px-20 flex flex-col-reverse lg:flex-row items-center justify-between gap-10 my-20 min-h-[420px]">
      {/* Left Section */}
      <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left space-y-2 w-full lg:w-[80%]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-12 bg-orange-400 rounded-full rotate-45 shadow-md"></div>
          <span className="text-sm uppercase tracking-widest text-white">
            Mauval Print
          </span>
        </div>

        <h2 className="text-4xl md:text-7xl font-bold text-white leading-tight">
          T-Shirt Mauval Design
        </h2>

        <p className="text-gray-300 text-lg max-w-md">
          Simple and elegant presentation for your custom apparel.
        </p>

        {timeLeft.days !== undefined && (
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-primary text-xl md:text-2xl font-bold mt-4">
            {["days", "hours", "minutes", "seconds"].map((unit, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-white rounded-lg text-center min-w-[70px]"
              >
                {timeLeft[unit]} <br />
                <span className="text-sm font-normal capitalize">{unit}</span>
              </div>
            ))}
          </div>
        )}

        <Link
          to="/designs"
          className="flex items-center gap-3 text-gray-200 font-semibold hover:tracking-widest transition-all duration-300"
        >
          View Designs <FaArrowRightLong />
        </Link>
      </div>

      {/* Right Section */}
      <div className="lg:absolute pt-10 lg:pt-0 right-0 -top-15 w-full lg:w-[40%] flex justify-center items-center">
        <img
          src={images[currentImageIndex]}
          alt="T-Shirt"
          className={`w-48 md:w-72 lg:w-100 -rotate-[25deg] transition-all duration-500 ease-in-out
            ${
              isAnimating
                ? "opacity-0 -translate-x-10"
                : "opacity-100 translate-x-0"
            }
          `}
        />
      </div>
    </div>
  );
};

export default OfferBanner;
