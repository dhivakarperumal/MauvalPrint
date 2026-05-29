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

import React from "react";
import home from '/Image/Home.png'
import { motion } from "framer-motion";


const Hero = () => {
  return (
    <section className=" bg-gradient-to-b md:bg-gradient-to-l  from-gray-300 via-gray-400 md:via-gray-500 to-primary flex flex-col md:flex-row items-center justify-between w-full h-auto md:h-[66vh] overflow-hidden">
      {/* Left Section */}
      <div className=" order-2 md:order-1 w-full md:w-1/2 px-6 md:px-12 lg:px-16 py-10 md:py-0 flex flex-col justify-center relative text-center md:text-left">
        {/* Background Text */}
        <h1 className="text-[2.8rem] sm:text-[3.5rem]  font-bold text-[#e6e2e0] leading-tight tracking-tight drop-shadow-md">
          MAUVAL PRINT
        </h1>

        {/* Paragraph */}
        <p className="text-white font-bold mt-4 text-2xl">
          PRINT YOUR HAPPINESS
        </p>

        {/* Button */}
        <button className="mt-6 bg-white text-primary px-6 py-3 cursor-pointer rounded-full text-sm sm:text-base font-semibold shadow-md hover:bg-gray-100 transition-all duration-300 w-fit mx-auto md:mx-0">
          SHOP NOW
        </button>
      </div>

      

       <div className="order-1 md:order-2 w-full md:w-1/2 flex justify-center items-center mt-6 md:mt-0">
      <motion.img
        src={home}
        alt="Mauval Print T-shirt"
        className="w-52 sm:w-68 object-cover overflow-hidden"
        animate={{
          y: [0, -10, 0],       // float up and down
          opacity: [1, 0.85, 1], // slight fade for smoothness
          scale: [1, 1.05, 1],   // subtle zoom in/out
        }}
        transition={{
          duration: 4,           // full cycle duration
          ease: "easeInOut",     // smooth easing
          repeat: Infinity,      // loop forever
          repeatType: "loop",    // seamless repeat
        }}
      />
    </div>
    </section>
  );
};

export default Hero;
