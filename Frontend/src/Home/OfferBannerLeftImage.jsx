import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const OfferBannerLeftImage = () => {
  const offerEndDate = new Date();
  offerEndDate.setDate(offerEndDate.getDate() + 1);
  offerEndDate.setHours(23, 59, 59, 999);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const distance = offerEndDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({});
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / 1000 / 60) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [offerEndDate]);

  return (
    <div className="group relative rounded-2xl shadow-lg overflow-hidden flex flex-col-reverse lg:flex-row items-center justify-between px-6 md:px-12 py-5 my-12 bg-gradient-to-r from-gray-100 via-gray-500 to-primary">
      {/* Left Image Area */}
      <div className="relative ml-0 lg:ml-20 w-[300px] h-[300px] lg:w-[450px] lg:h-[450px]">
        <img
          src="/Image/Designs/t2.png"
          alt="Main T-Shirt"
          className="w-full h-full object-contain drop-shadow-xl relative z-10 transition-transform duration-300 group-hover:scale-105"
        />

        <img
          src="/Image/Designs/t3.png"
          alt="Side T-Shirt Left"
          className="absolute top-1/2 left-0 w-28 md:w-50 transform -translate-y-1/2 -rotate-[25deg] opacity-0 group-hover:opacity-100 group-hover:-translate-x-14 transition-all duration-500"
        />

        <img
          src="/Image/Designs/t4.png"
          alt="Side T-Shirt Right"
          className="absolute top-1/2 right-0 w-28 md:w-50 transform -translate-y-1/2 rotate-[25deg] opacity-0 group-hover:opacity-100 group-hover:translate-x-14 transition-all duration-500"
        />
      </div>

      {/* Right Content */}
      <div className="text-center lg:text-left max-w-xl space-y-6 text-white">
        <span className="inline-block bg-red-600 text-white text-sm md:text-base px-4 py-1 rounded-full uppercase tracking-wider">
          Hot Deal
        </span>

        <h2 className="text-4xl md:text-7xl font-bold leading-tight">
          Style it Your Way!
        </h2>

        <p className="text-2xl md:text-3xl font-medium">
          Flat <span className="text-yellow-300 font-bold">35% OFF</span> on all
          designer tees.
        </p>

        {timeLeft.days !== undefined && (
          <p className="text-xl md:text-2xl font-semibold mt-2">
            Offer ends in:{" "}
            <span className="font-bold text-4xl">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
              {timeLeft.seconds}s
            </span>
          </p>
        )}

        <Link
          to="/designs"
          className="inline-block mt-6 bg-white text-primary text-lg font-semibold px-8 py-3 rounded-full shadow transition hover:bg-gray-100"
        >
          Grab the Deal
        </Link>
      </div>
    </div>
  );
};

export default OfferBannerLeftImage;
