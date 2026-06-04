import React, { useEffect, useState } from "react";
import Navbar from "./Components/Navbar.jsx";
import Footer from "./Components/Footer.jsx";
import { Outlet } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop.jsx";
import { ToastContainer } from "react-toastify";
import ScrollNavigator from "./Components/ScrollNavigator.jsx";

const App = () => {
  const [loading, setLoading] = useState(() => !sessionStorage.getItem("appLoaded"));

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("appLoaded", "true");
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        {/* Dot Circular Loader */}
        <div className="relative w-16 h-16">
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            const delay = (i * 0.1).toFixed(1);
            const style = {
              top: `${50 - 40 * Math.cos((angle * Math.PI) / 180)}%`,
              left: `${50 + 40 * Math.sin((angle * Math.PI) / 180)}%`,
              animationDelay: `${delay}s`,
            };
            return (
              <span
                key={i}
                style={style}
                className="absolute w-2 h-2 bg-primary rounded-full animate-dot-spin"
              ></span>
            );
          })}
        </div>
        <p className="mt-4 text-gray-600 text-sm animate-pulse">
          Loading, please wait...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-800">
      <Navbar />
      <ScrollToTop />
      <ScrollNavigator />
      <div className="min-h-screen">
        <Outlet />
      </div>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={1000}
        className="z-[1000]"
      />
    </div>
  );
};

export default App;
