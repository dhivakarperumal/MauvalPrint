import React, { useEffect, useState, useRef, useContext, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { AuthContext } from "../Context/AuthContext";
import Head from "../Components/Head";
import Review from "./Review";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ZoomImage from "./ZoomImage";
import Login from "../Components/Login";
import RegisterPage from "../Components/Register";
import ProductCustomizer from "./ProductCustomizer";
import RelatedProducts from "./RelatedProducts";

// Image optimization utility
const optimizeImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('firebaseapp.com')) {
    return `${url}&w=800&q=85`;
  }
  return url;
};

const SingleProductView = () => {
  const { id, category } = useParams();

  const navigate = useNavigate();
  const previewImageRef = useRef();

  const {
    products,
    addToCart,
    addToWishlist,
    wishlist = [],
    user,
  } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [showSize, setShowSize] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});

  const [overlayImage, setOverlayImage] = useState(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 50 });
  const [overlaySize, setOverlaySize] = useState(100);
  const [text, setText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [textPosition, setTextPosition] = useState({ x: 10, y: 10 });
  const [textSize, setTextSize] = useState(24);

  const memoizedProducts = useMemo(() => products, [products]);

  useEffect(() => {
    const found = memoizedProducts.find((p) => `${p.product_id || p.productId || p.id}` === id);

    if (found) {
      // Coerce numeric fields to numbers to avoid `.toFixed` errors
      const normalized = {
        ...found,
        salePrice: Number(found.salePrice) || 0,
        mrp: Number(found.mrp) || 0,
        rating: Number(found.rating) || 0,
      };

      setProduct(normalized);
      const sizes = new Set();
      const colors = new Set();

      for (const key in normalized.stockByVariant || {}) {
        if (normalized.stockByVariant[key] > 0) {
          const [color, size] = key.split("-");
          sizes.add(size);
          colors.add(color);
        }
      }

      const sizeArray = Array.from(sizes);
      const colorArray = Array.from(colors);

      setAvailableSizes(sizeArray);
      setAvailableColors(colorArray);

      // ✅ Set default selections only after setting options
      if (sizeArray.length > 0) {
        setSelectedSize(sizeArray[0]);
      }
      if (colorArray.length > 0) {
        setSelectedColor(colorArray[0]);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, memoizedProducts]);

  // Map known color names/variants to exact color codes.
  // This ensures values like "navyblue" or "Navy" render as the intended hex.
  const colorMap = useMemo(() => ({
    navy: "#001f54",
    navyblue: "#001f54",
    "navy-blue": "#001f54",
    red: "#ff0000",
    black: "#000000",
    white: "#ffffff",
  }), []);

  const getColorCode = useCallback((c) => {
    if (!c) return c;
    const key = c.toString().toLowerCase();
    return colorMap[key] || c; // fallback to the original value if not in the map
  }, [colorMap]);

  const handleAddToCart = useCallback(() => {
    if (!selectedSize || !selectedColor)
      return toast.warn("Please select size and color");
    addToCart({ ...product, selectedSize, selectedColor }, quantity);
  }, [selectedSize, selectedColor, product, quantity, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!user) {
      toast.warn("Please login to continue shopping");

      return;
    }

    if (!selectedSize) {
      toast.warn("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.warn("Please select a color");
      return;
    }

    const finalPrice = product.salePrice;
    const originalPrice = product.mrp;
    const discount = Math.round(
      ((originalPrice - finalPrice) / originalPrice) * 100
    );

    const productToBuy = {
      id: product.id || product.productId,
      name: product.name,
      price: finalPrice,
      originalPrice,
      discount,
      image: product.images[selectedImageIndex],
      selectedSize: selectedSize,
      selectedColor: selectedColor,
      quantity,
    };

    navigate("/checkout", {
      state: { buyNowProduct: productToBuy, fromCart: false },
    });
  }, [user, selectedSize, selectedColor, product, selectedImageIndex, navigate, quantity]);

  const handleOverlayMove = (e) => {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const parent = e.target.parentElement.getBoundingClientRect();
    setOverlayPosition({
      x: clientX - parent.left - overlaySize / 2,
      y: clientY - parent.top - overlaySize / 2,
    });
  };
  const handleOverlayTouchStart = () => setIsDraggingOverlay(true);
  const handleOverlayTouchEnd = () => setIsDraggingOverlay(false);

  const handleOverlayTouchMove = (e) => {
    if (!isDraggingOverlay) return;
    const touch = e.touches[0];
    const parent = e.target.parentElement.getBoundingClientRect();
    setOverlayPosition({
      x: touch.clientX - parent.left - overlaySize / 2,
      y: touch.clientY - parent.top - overlaySize / 2,
    });
  };

  const handleTextMove = (e) => {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const parent = e.target.parentElement.getBoundingClientRect();
    setTextPosition({
      x: clientX - parent.left - 20,
      y: clientY - parent.top - 10,
    });
  };
  const handleTextTouchStart = () => setIsDraggingText(true);
  const handleTextTouchEnd = () => setIsDraggingText(false);

  const handleTextTouchMove = (e) => {
    if (!isDraggingText) return;
    const touch = e.touches[0];
    const parent = e.target.parentElement.getBoundingClientRect();
    setTextPosition({
      x: touch.clientX - parent.left - 20,
      y: touch.clientY - parent.top - 10,
    });
  };

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const preview = previewImageRef.current;
    const previewBox = preview.parentElement;
    canvas.width = previewBox.offsetWidth;
    canvas.height = previewBox.offsetHeight;
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    const drawFinal = () => {
      if (text) {
        ctx.fillStyle = textColor;
        ctx.font = `${textSize}px Arial`;
        ctx.fillText(text, textPosition.x, textPosition.y + textSize);
      }
      const link = document.createElement("a");
      link.download = "customized-product.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    if (overlayImage) {
      const overlay = new Image();
      overlay.crossOrigin = "anonymous";
      overlay.src = overlayImage;
      overlay.onload = () => {
        ctx.drawImage(
          overlay,
          overlayPosition.x,
          overlayPosition.y,
          overlaySize,
          overlaySize
        );
        drawFinal();
      };
    } else {
      drawFinal();
    }
  };

  const handlePlaceCustomizedOrder = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const preview = previewImageRef.current;
    const previewBox = preview.parentElement;
    canvas.width = previewBox.offsetWidth;
    canvas.height = previewBox.offsetHeight;
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    const drawAndNavigate = () => {
      if (text) {
        ctx.fillStyle = textColor;
        ctx.font = `${textSize}px Arial`;
        ctx.fillText(text, textPosition.x, textPosition.y + textSize);
      }

      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const customizedImage = reader.result;
            const finalPrice = product.salePrice;
            const originalPrice = product.mrp;
            const discount = Math.round(
              ((originalPrice - finalPrice) / originalPrice) * 100
            );

            const customizedProduct = {
              id: product.id || product.productId,
              name: product.name,
              price: finalPrice,
              originalPrice,
              discount,
              customizedImage,
              size: selectedSize,
              color: selectedColor,
              quantity,
              isCustomized: true,
            };

            navigate("/checkout", {
              state: { buyNowProduct: customizedProduct, fromCart: false },
            });
          };
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.7
      );
    };

    if (overlayImage) {
      const overlay = new Image();
      overlay.crossOrigin = "anonymous";
      overlay.src = overlayImage;
      overlay.onload = () => {
        ctx.drawImage(
          overlay,
          overlayPosition.x,
          overlayPosition.y,
          overlaySize,
          overlaySize
        );
        drawAndNavigate();
      };
    } else {
      drawAndNavigate();
    }
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => {
      if (rating >= i + 1)
        return <FaStar key={i} className="text-yellow-500" />;
      else if (rating >= i + 0.5)
        return <FaStarHalfAlt key={i} className="text-yellow-500" />;
      else return <FaRegStar key={i} className="text-yellow-500" />;
    });

  // Use safe numeric variables for rendering & handlers
  if (!product) return <div className="p-6 text-center">Loading...</div>;
  const isWishlisted = wishlist.some((p) => p.id === product.id);

  // Ensure numeric values
  const salePrice = Number(product.salePrice) || 0;
  const mrp = Number(product.mrp) || 0;
  const discountPercent =
    mrp > 0 ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;

  return (
    <div className="mt-20">
      <Head title={product.name} subtitle={product.name} />

      <div className="px-4 md:px-20">
        <div className="grid lg:grid-cols-2 gap-10 border-b border-primary py-10">
          <div className="z-10">
            {/* ✅ Zoom Image Component */}
            <ZoomImage
              imageSrc={product.images[selectedImageIndex]}
              thumbnails={product.images}
              selectedImageIndex={selectedImageIndex}
              onImageSelect={setSelectedImageIndex}
            />
          </div>
          {/* Info */}
          <div className="space-y-5 relative mt-5">
            <h2 className="text-3xl font-bold text-gray-900">{product.name}</h2>

            <div className="flex items-center gap-2">
              {renderStars(product.rating || 0)}
              <span className="text-gray-500 text-sm">
                ({product.reviews?.length || 0} Reviews)
              </span>
            </div>

            <div className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              ₹{salePrice.toFixed(2)}
              {mrp > 0 && (
                <>
                  <span className="text-gray-400 line-through text-base font-normal">
                    ₹{mrp}
                  </span>
                  <span className="text-green-600 text-sm font-medium">
                    ({discountPercent}% OFF)
                  </span>
                </>
              )}
            </div>

            {/* Sizes */}
            <div>
              <p className="font-semibold text-gray-700 mb-1">Sizes:</p>
              <div className="flex items-end gap-5">
                <div className="flex gap-2 flex-wrap">
                  {["XS", "S", "M", "L", "XL", "XXL"].map((s) => {
                    const variantKey = `${selectedColor}-${s}`;
                    const stock =
                      product?.stockByVariant && product.stockByVariant[variantKey];

                    const isAvailable = stock > 0;

                    return (
                      <button
                        key={s}
                        onClick={() => isAvailable && setSelectedSize(s)}
                        className={`border px-4 py-1 rounded transition-all ${
                          selectedSize === s
                            ? "bg-black text-white cursor-pointer hover:bg-gray-800"
                            : isAvailable
                            ? "bg-white text-black cursor-pointer hover:bg-gray-100"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!isAvailable}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <p
                  className="text-sm text-primary underline cursor-pointer mt-1"
                  onClick={() => setShowSize(!showSize)}
                >
                  View Size Chart
                </p>
                {showSize && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
                    <div className="relative bg-white rounded-lg p-7 md:p-4 max-w-3xl w-50 md:w-full shadow-lg">
                      {/* Close Button */}
                      <button
                        onClick={() => setShowSize(!showSize)}
                        className="absolute top-0 md:top-2 right-2 text-3xl font-bold text-gray-700 hover:text-red-500 cursor-pointer transition-colors"
                      >
                        ×
                      </button>

                      {/* Images */}
                      <div className="md:flex gap-4 items-center justify-center">
                        <img
                          src={optimizeImageUrl(product.sizeChartImage || product.sizeChartImag)}
                          alt="Size Chart"
                          className="w-full max-w-xs object-contain"
                          loading="lazy"
                          decoding="async"
                          width={400}
                          height={500}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Colors */}
            <div>
              <p className="font-semibold text-gray-700 mb-1 mt-4">Colors:</p>
              <div className="flex gap-2 flex-wrap">
                {(availableColors || [])
                  .filter((c) => {
                    // hide plain "blue" entries but keep variants like "navy" or "navyblue"
                    if (!c) return false;
                    const key = c.toString().toLowerCase().replace(/[-\s]/g, "");
                    return key !== "blue";
                  })
                  .map((color) => {
                    const bg = getColorCode(color);
                    return (
                      <div
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all hover:scale-110 ${
                          selectedColor === color
                            ? "border-black scale-110 ring-2 ring-offset-1"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: bg }}
                        title={color}
                      />
                    );
                  })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 border rounded text-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                -
              </button>
              <span className="text-lg font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-12 h-12 border rounded text-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAddToCart}
                className="border px-6 py-3 rounded text-black hover:bg-gray-100 cursor-pointer transition-all hover:shadow-md"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 cursor-pointer transition-all hover:shadow-md"
              >
                Buy Now
              </button>
              {product.customizable && (
                <button
                  onClick={() => {
                    if (!user) {
                      setShowLogin(true);
                    } else {
                      navigate(`/customizer/${product.id || product.productId}`);
                    }
                  }}
                  className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-all cursor-pointer hover:shadow-md"
                >
                  Customize
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addToWishlist(product)}
                className="border px-6 py-3 rounded flex items-center gap-2 text-black cursor-pointer hover:bg-gray-50 transition-all hover:shadow-md"
              >
                {isWishlisted ? (
                  <IoMdHeart className="text-red-500" />
                ) : (
                  <IoMdHeartEmpty />
                )}
                Add to Favorites
              </button>
            </div>

            <>
              <span className="font-bold">Description:</span>
              <p className="ml-0 mt-2">{product.description}</p>
            </>

            <div>
              <span className="font-bold">Washing Informations:</span>
              <ul className="list-disc ml-5">
                {product.washingDetails?.map((info, i) => (
                  <li key={i}>{info}</li>
                ))}
              </ul>
            </div>

            <p>
              <strong>Note: </strong>{" "}
              <span className="text-red-500 font-semibold"> {product.notes}</span>
            </p>
          </div>
        </div>
        {category && (
          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4">Related Products</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products
                .filter(
                  (p) =>
                    p.category?.toLowerCase() === category.toLowerCase() &&
                    (p.id || p.productId) !== id
                )
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id || p.productId} product={p} />
                ))}
            </div>
          </div>
        )}

        <RelatedProducts
          category={product.category}
          subcategory={product.subcategory}
          currentId={product.id}
          addToCart={addToCart}
          addToWishlist={addToWishlist}
        />

        <Review
          reviews={product.reviews || []}
          uname={user?.username || user?.email}
          productname={product.name}
          productId={product.productId}
        />

        {showPopup && (
          <ProductCustomizer
            product={product}
            previewImageRef={previewImageRef}
            selectedImageIndex={selectedImageIndex}
            setSelectedImageIndex={setSelectedImageIndex}
            overlayImage={overlayImage}
            setOverlayImage={setOverlayImage}
            overlaySize={overlaySize}
            setOverlaySize={setOverlaySize}
            overlayPosition={overlayPosition}
            setOverlayPosition={setOverlayPosition}
            handleOverlayMove={handleOverlayMove}
            handleOverlayTouchStart={handleOverlayTouchStart}
            handleOverlayTouchMove={handleOverlayTouchMove}
            handleOverlayTouchEnd={handleOverlayTouchEnd}
            text={text}
            setText={setText}
            textColor={textColor}
            setTextColor={setTextColor}
            textSize={textSize}
            setTextSize={setTextSize}
            textPosition={textPosition}
            setTextPosition={setTextPosition}
            handleTextMove={handleTextMove}
            handleTextTouchStart={handleTextTouchStart}
            handleTextTouchMove={handleTextTouchMove}
            handleTextTouchEnd={handleTextTouchEnd}
            handleDownload={handleDownload}
            handlePlaceCustomizedOrder={handlePlaceCustomizedOrder}
            onClose={() => setShowPopup(false)}
          />
        )}
      </div>
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
    </div>
  );
};

export default SingleProductView;
