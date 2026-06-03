import React, { useContext, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Head from "../Components/Head";
import imageCompression from "browser-image-compression";
import Testimonial from "../Home/Testimonial";
import { motion } from "framer-motion";
import Login from "../Components/Login";
import RegisterPage from "../Components/Register";
import { AuthContext } from "../Context/AuthContext";

// Size options
const sizeOptions = [
  { label: "12x12 inches", price: 100 },
  { label: "18x18 inches", price: 150 },
  { label: "24x24 inches", price: 200 },
];

const FlimLogoPrint = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0].label);
  const [price, setPrice] = useState(sizeOptions[0].price);
  const [quantity, setQuantity] = useState(1);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const selected = sizeOptions.find((s) => s.label === selectedSize);
    if (selected) setPrice(selected.price);
  }, [selectedSize]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const base64 = await convertToBase64(compressedFile);
        setImageFile(compressedFile);
        setPreview(base64);
      } catch (error) {
        console.error("Image compression error:", error);
        alert("Failed to compress image.");
      }
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!preview || !selectedSize || quantity <= 0) {
      alert(
        "Please upload an image, select a size, and enter a valid quantity."
      );
      return;
    }

    navigate("/checkout", {
      state: {
        fromCart: false,
        buyNowProduct: {
          name: "Custom Logo Print",
          price,
          quantity: parseInt(quantity),
          selectedSize,
          customizedImage: preview,
        },
      },
    });
  };
  const handleMail = () => {
    const subject = encodeURIComponent("Image for Custom Print");
    const body = encodeURIComponent(
      "Hi, I'm sending you an image for custom print. Please find it attached."
    );
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=mauvalprint@gmail.com&su=${subject}&body=${body}`;

    window.open(gmailLink, "_blank");
  };

  return (
    <>
      <div className="mt-20">
        <Head title="Flim Printing" subtitle="Upload & Order Custom Print" />

        <div className="relative">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center text-3xl sm:text-4xl md:text-5xl mt-5 font-bold"
          >
            Flim Printing
          </motion.h1>

          {/* Decorative blobs - hidden on small devices */}
          <span className="hidden md:block absolute -top-20 -left-20 -z-10 w-40 h-40 bg-primary rounded-full"></span>
          <span className="hidden md:block absolute -top-20 -right-20 -z-10 w-40 h-40 bg-primary rounded-full"></span>
          <span className="hidden md:block absolute -bottom-20 -left-20 -z-10 w-40 h-40 bg-primary rounded-full"></span>
          <span className="hidden md:block absolute -bottom-20 -right-20 -z-10 w-40 h-40 bg-primary rounded-full"></span>

          {/* Content Container */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col lg:flex-row gap-8 my-6 px-4 sm:px-6 lg:px-20 max-w-7xl mx-auto"
          >
            {/* Image Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full lg:w-1/2 flex items-center justify-center border rounded-3xl min-h-[300px] bg-gray-100 shadow-inner hover:shadow-xl transition-shadow duration-300"
            >
              {preview ? (
                <motion.img
                  src={preview}
                  alt="Preview"
                  className="max-h-[400px] object-contain rounded-lg"
                  whileHover={{ scale: 1.03 }}
                />
              ) : (
                <span className="text-gray-400 text-lg text-center px-4">
                  Image preview will appear here
                </span>
              )}
            </motion.div>

            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-1/2 bg-white p-6 sm:p-8 shadow-xl rounded-3xl space-y-5 border border-gray-200"
            >
              {/* Upload */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Upload Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                />
              </div>

              {/* Size Selector */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Select Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                >
                  {sizeOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label} - ₹{option.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1 ">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value || 1)))
                  }
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              {/* Total Price */}
              <div className="text-xl font-bold text-slate-800">
                Total: ₹{price * quantity}
              </div>
              {/* Email Image Button */}
              <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  onClick={handleMail}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Add your image in this mail – Click to Compose
                </span>
              </label>

              {/* Buy Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={handleBuyNow}
                className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold text-lg hover:bg-slate-900 transition cursor-pointer  "
              >
                Buy Now
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Testimonial />
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitch={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterPage
          onClose={() => setShowRegister(false)}
          onSwitch={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
};

export default FlimLogoPrint;
