// import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
// import { FaArrowRightLong } from "react-icons/fa6";

// const images = [

//   '/Image/hero3.png',
//   '/Image/hero4.png',
//   '/Image/hero2.png',
//    '/Image/hero1.png',

// ];

// const colorOptions = [

//   { colorName: 'Black', className: 'bg-black', border: 'border-black' },
//   { colorName: 'Orange', className: 'bg-yellow-500', border: 'border-yellow-500' },
//    { colorName: 'White', className: 'bg-white', border: 'border-white' },
//   { colorName: 'Primary', className: 'bg-primary', border: 'border-primary' },

// ];

// export default function Hero() {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [prevIndex, setPrevIndex] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const timeoutRef = useRef(null);

//   useEffect(() => {
//     startAutoRotation();
//     return () => clearTimeout(timeoutRef.current);
//   }, [currentIndex]);

//   const startAutoRotation = () => {
//     timeoutRef.current = setTimeout(() => {
//       triggerRotation((currentIndex + 1) % images.length);
//     }, 4000);
//   };

//   const triggerRotation = (newIndex) => {
//     if (newIndex === currentIndex) return;
//     setPrevIndex(currentIndex);
//     setCurrentIndex(newIndex);
//     setIsAnimating(true);

//     setTimeout(() => {
//       setIsAnimating(false);
//     }, 600);
//   };

//   const handleColorSelect = (index) => {
//     clearTimeout(timeoutRef.current);
//     triggerRotation(index);
//   };

//   return (
//     <section className="flex flex-col md:flex-row h-auto  md:h-[90vh] items-center justify-between p-8 bg-primary/10 relative">

//       {/* Image Section */}
//       <div className="order-1 md:order-2 w-full md:w-1/2 relative h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden perspective-1000">
//         {isAnimating && (
//           <img
//             src={images[prevIndex]}
//             alt="Previous"
//             className="absolute w-full h-full object-contain rotate-out z-0"
//           />
//         )}
//         <img
//           src={images[currentIndex]}
//           alt="Current"
//           className={`absolute w-full h-full object-contain z-10 ${
//             isAnimating ? 'rotate-in' : 'fade-in'
//           }`}
//         />
//       </div>

//       {/* Text & Color Section */}
//       <div className="order-2 md:order-1 w-full md:w-1/2 space-y-5 z-10 flex flex-col items-center md:items-start text-left mt-6 md:mt-0">

//         {/* Color Buttons */}
//         <div className="order-2 md:order-3 flex items-center justify-center gap-4 mt-2 md:mt-4">
//           {colorOptions.map((option, index) => (
//             <button
//               key={index}
//               onClick={() => handleColorSelect(index)}
//               className={` w-8 h-8 sm:w-10 md:h-10 rounded-full border-4  cursor-pointer transition-transform duration-300
//                 ${option.className}
//                 ${index === currentIndex ? 'scale-100 ring-2 ring-offset-2 ring-primary' : ''}
//                 ${option.border}`}
//               title={option.colorName}
//             />
//           ))}
//         </div>

//         {/* Heading */}
//         <h1 className="order-3 md:order-1 text-2xl sm:text-2xl md:text-5xl font-bold text-left text-primary leading-tight">
//           Redefine Your Style with Premium T-Shirts
//         </h1>

//         {/* Description */}
//         <p className="hidden md:block md:order-2 text-base sm:text-lg text-gray-700  text-justify md:text-left">
//           Discover our exclusive collection of high-quality, comfortable, and trend-forward T-shirts tailored for every occasion. Elevate your wardrobe effortlessly.
//         </p>

//         {/* Explore More */}
//         <p className="order-5 md:order-4 text-primary text-sm w-full">
//   <Link className="flex gap-1 items-center justify-start w-full md:w-auto transition-all duration-300 ease-in-out hover:scale-105 hover:translate-x-2">
//     Explore More <FaArrowRightLong className="text-xs" />
//   </Link>
// </p>
//       </div>
//     </section>
//   );
// }

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaStar, FaShieldAlt, FaTruck } from "react-icons/fa";
import hero1 from "/Image/hero1.png";
import hero2 from "/Image/hero2.png";
import hero3 from "/Image/hero3.png";
import hero4 from "/Image/hero4.png";

const slides = [
  {
    src: hero1,
    alt: "Colorful custom tee",
    label: "Bold Statement",
    subtext: "Stand out with vibrant prints.",
  },
  {
    src: hero2,
    alt: "Minimalist custom tee",
    label: "Clean Comfort",
    subtext: "Timeless style in every stitch.",
  },
  {
    src: hero3,
    alt: "Graphic print tee",
    label: "Graphic Fresh",
    subtext: "Designs designed to turn heads.",
  },
  {
    src: hero4,
    alt: "Lifestyle print tee",
    label: "Everyday Premium",
    subtext: "Premium fabrics, perfect fit.",
  },
];

const stats = [
  { icon: FaStar, value: "500+", label: "Happy Customers" },
  { icon: FaShieldAlt, value: "100%", label: "Quality Assured" },
  { icon: FaTruck, value: "Fast", label: "Pan India Delivery" },
];

const Hero = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const rotate = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(rotate);
  }, []);

  return (
    <section className="hidden lg:block relative w-full min-h-[70vh] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-20 top-10 w-96 h-96 rounded-full bg-yellow-400/20 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute right-0 bottom-12 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl animate-[float_14s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-10 md:px-12 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-8 transition duration-700 ease-out">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/10 text-sm text-white/80 rounded-full px-4 py-2 backdrop-blur-md shadow-lg shadow-black/20">
              <FaStar className="text-yellow-300" />
              Premium prints, fast delivery.
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
                MAUVAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-primary">PRINT</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white/90 max-w-2xl">
                Design your custom apparel with premium prints, bold colors, and comfort that lasts all day.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/products" className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 font-semibold text-slate-900 shadow-2xl shadow-yellow-500/30 transition-transform duration-300 hover:-translate-y-1">
                Shop Now
                <FaArrowRight />
              </Link>
              <Link to="/products" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-white font-semibold transition hover:bg-white/10">
                Customize Now
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map(({ icon, value, label }, index) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-xl shadow-black/20">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-yellow-300">
                    {React.createElement(icon, { className: "text-yellow-300" })}
                  </div>
                  <p className="mt-4 text-2xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-sm text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:flex items-stretch justify-center">
            <div className="relative w-full rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.45)] p-6">
              <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-yellow-400/15 blur-2xl" />
              <div className="absolute -right-8 bottom-10 h-32 w-32 rounded-full bg-cyan-500/15 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 min-h-[470px]">
                <img
                  src={slides[activeIndex].src}
                  alt={slides[activeIndex].alt}
                  className="h-full w-full object-cover transition-all duration-700 ease-out"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-6 py-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Featured design</p>
                  <p className="mt-2 text-3xl font-bold text-white">{slides[activeIndex].label}</p>
                  <p className="mt-2 text-sm text-white/70 max-w-xs">{slides[activeIndex].subtext}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
