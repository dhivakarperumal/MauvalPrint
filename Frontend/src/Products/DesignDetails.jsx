import React, { useEffect, useState, useContext, useMemo, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import { AuthContext } from "../Context/AuthContext";
import Head from "../Components/Head";
import Review from "./Review";
import { toast } from "react-toastify";
import RelatedProducts from "./RelatedProducts";
import PageContainer from "../Components/PageContainer";
// Image optimization utility
const optimizeImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('firebaseapp.com')) {
    return `${url}&w=800&q=85`;
  }
  return url;
};

const DesignDetails = () => {
  const { productId } = useParams();
  const { user, designs = [], addToCart, addToWishlist } =
    useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showDescription, setShowDescription] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showSize, setShowSize] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [selectedVariant, setSelectedVariant] = useState("regular");

  // find design by productId
  const design = useMemo(() =>
    designs.find((d) => d.id === productId || d.product_id === productId || d.productId === productId),
    [designs, productId]
  );

  // safe defaults for destructuring
  const {
    name = "Product",
    rating = 0,
    description: descriptionValue = "",
    images: designImages = [],
    reviews = [],
    color: designColors = [],
    mrp = 0,
    salePrice = 0,
    offer = 0,
    sizeChartImage = "",
    category = "",
    subcategory = "",
    fabricDetails: fabricDetailsValue = "",
    notes = "",
    ourDesign = false,
    price_by_type = {},
    size_charts = {},
  } = design || {};

  // Calculate the effective price based on variant
  const getVariantPrice = () => {
    if (ourDesign && price_by_type && price_by_type[selectedVariant]) {
      return price_by_type[selectedVariant];
    }
    return salePrice || mrp;
  };

  const getVariantSizeChart = () => {
    if (ourDesign && size_charts && size_charts[selectedVariant]) {
      return size_charts[selectedVariant];
    }
    return sizeChartImage;
  };

  const displayPrice = getVariantPrice();
  const displaySizeChart = getVariantSizeChart();
  const normalizedSelectedSize = selectedSize.trim();

  // Helper: normalize a color item
  const normalizeColor = (clr) => {
    if (!clr && clr !== "") return { label: "", value: "" };
    if (typeof clr === "string") return { label: clr, value: clr };
    const label =
      clr.name || clr.label || clr.title || clr.hex || clr.value || JSON.stringify(clr);
    const value = clr.hex || clr.value || clr.color || label;
    return { label, value };
  };

  const images =
    Array.isArray(designImages) && designImages.length
      ? designImages
      : ["/placeholder.png"];
  const colors = useMemo(
    () => (Array.isArray(designColors) ? designColors.map(normalizeColor) : []),
    [designColors]
  );
  // Color map
  const colorMap = {
    navy: "#001f54",
    navyblue: "#001f54",
    "navy-blue": "#001f54",
    red: "#ff0000",
    black: "#000000",
    white: "#ffffff",
  };
  const getColorCode = (c) => {
    if (!c) return c;
    const key = c.toString().toLowerCase();
    return colorMap[key] || c;
  };

  // reset on product change
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImageIndex(0);
    setQuantity(1);
    setZoomVisible(false);
    setSelectedSize("");
    setSizeError("");
    if (colors.length > 0) setSelectedColor(colors[0].value);
  }, [productId, designs, colors]);

  useEffect(() => {
    if (ourDesign) setSelectedSize("");
  }, [selectedVariant, ourDesign]);

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Design not found</p>
      </div>
    );
  }

  // --- Add to Cart ---
  const handleAddToCart = () => {
    if (!user) {
      toast.warn("Please login to add items to cart");
      navigate("/account", { state: { returnUrl: window.location.pathname } });
      return;
    }

    if (!normalizedSelectedSize) {
      setSizeError("Please enter your size before adding this product to the cart.");
      return;
    }
    setSizeError("");
    if (colors.length > 0 && !selectedColor) return toast.warn("Please select a color");

    const item = {
      ...design,
      id: design.id || design.product_id || design.productId,
      selectedSize: normalizedSelectedSize,
      quantity,
      price: displayPrice,
      selectedColor,
      color: selectedColor,
      image: images[selectedImageIndex] || images[0],
      selectedVariant: ourDesign ? selectedVariant : undefined,
      variant: ourDesign ? selectedVariant : undefined,
    };
    addToCart(item, quantity);
  };

  // --- Buy Now ---
  const handleBuyNow = () => {
    if (!user) {
      toast.warn("Please login to continue shopping");
      return;
    }

    if (!normalizedSelectedSize) {
      setSizeError("Please enter your size before buying this product.");
      return;
    }
    setSizeError("");
    if (colors.length > 0 && !selectedColor) return toast.warn("Please select a color");

    const productToBuy = {
      productId,
      name,
      price: displayPrice,
      originalPrice: mrp,
      offer,
      image: images[selectedImageIndex] || images[0],
      selectedSize: normalizedSelectedSize,
      selectedColor,
      quantity,
      selectedVariant: ourDesign ? selectedVariant : undefined,
      variant: ourDesign ? selectedVariant : undefined,
    };

    navigate("/checkout", {
      state: { buyNowProduct: productToBuy, fromCart: false },
    });
  };

  // --- Star Renderer ---
  const renderStars = (r) => {
    const ratingNum = typeof r === "number" ? r : parseFloat(r) || 0;
    const stars = [];
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum - fullStars >= 0.5;
    for (let i = 0; i < fullStars; i++)
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-500" />);
    if (hasHalfStar)
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
    for (let i = stars.length; i < 5; i++)
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-500" />);
    return stars;
  };

  return (

    <div className="mt-18">
      <Head title="Design Details" subtitle={name} />
      <div className="bg-white py-6 ">
        <PageContainer>
          <div className="grid lg:grid-cols-2 gap-10 mt-8">
            {/* Left Image Section */}
            <div className="flex flex-col items-center">
              <div
                className="relative rounded-lg shadow p-6 w-full h-[500px] flex flex-col"
                onMouseLeave={() => setZoomVisible(false)}
              >
                <div
                  className="relative w-full h-full overflow-hidden bg-gray-100"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomVisible(true);
                    setZoomPosition({ x, y });
                  }}
                >
                  <img
                    src={optimizeImageUrl(images[selectedImageIndex])}
                    alt={name}
                    className="w-full h-full object-contain hover:cursor-crosshair transition-opacity duration-300"
                    loading="eager"
                    decoding="async"
                    width={800}
                    height={600}
                    onLoad={() => setImagesLoaded(prev => ({ ...prev, [selectedImageIndex]: true }))}
                  />
                </div>

                <div className="flex items-center justify-center gap-4 mt-4 overflow-auto">
                  {images.map((img, index) => (
                    <img
                      key={index}
                      src={optimizeImageUrl(img)}
                      alt={`Thumbnail ${index}`}
                      className={`w-16 h-16 object-cover border rounded cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 ${selectedImageIndex === index
                        ? "border-primary ring-2 ring-primary"
                        : "border-gray-300"
                        }`}
                      onClick={() => setSelectedImageIndex(index)}
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                    />
                  ))}
                </div>

                {zoomVisible && (
                  <div className="absolute left-full top-0 ml-4 w-72 h-full bg-white z-40 rounded-lg overflow-hidden shadow-lg">
                    <div
                      className="w-full h-full bg-no-repeat bg-contain"
                      style={{
                        backgroundImage: `url(${optimizeImageUrl(images[selectedImageIndex])})`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundSize: "200%",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Details Section */}
            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-3xl font-bold text-gray-900">{name}</h2>
                {/* <button
                onClick={handleWishlistToggle}
                className="text-2xl cursor-pointer"
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {isWishlisted ? (
                  <IoMdHeart className="text-red-500" />
                ) : (
                  <IoMdHeartEmpty />
                )}
              </button> */}
              </div>

              <div className="mt-2 flex items-center gap-2">
                {renderStars(rating)}
                <span className="text-gray-600 text-sm">
                  ({reviews.length} Reviews)
                </span>
              </div>

              <div className="mt-4 text-xl font-semibold text-gray-800">
                ₹{displayPrice} {" "}
                <span className="line-through text-gray-500 text-sm ml-2">
                  ₹{mrp}
                </span>{" "}
                <span className="text-green-600 font-medium text-sm ml-2">
                  ({offer}% OFF)
                </span>
              </div>

              {/* Variant Selection for Our Design Products */}
              {ourDesign && (
                <div className="mt-6 border-t pt-6">
                  <div className="mb-4">
                    <p className="font-bold text-lg text-gray-900">Choose Your Fit:</p>
                    <p className="text-xs text-gray-500 mt-1">Select the perfect type for your style</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { key: 'regular', label: 'Regular', price: price_by_type?.regular || 0, desc: '190 GSM Regular Fit', icon: '👕' },
                      { key: 'oversize', label: 'Oversize', price: price_by_type?.oversize || 0, desc: '240 GSM Oversized', icon: '🛍️' },
                      { key: 'kids', label: 'Kids', price: price_by_type?.kids || 0, desc: 'Perfect for Kids', icon: '👶' },
                    ].map(({ key, label, price, desc, icon }) => (
                      <button
                        key={key}
                        onClick={() => setSelectedVariant(key)}
                        className={`group relative min-w-0 p-2 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          selectedVariant === key
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                            : 'bg-white border-gray-200 text-gray-800 hover:border-blue-400 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Corner Badge */}
                        {selectedVariant === key && (
                          <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full">
                              <span className="text-blue-600 text-xs sm:text-sm">✓</span>
                            </span>
                          </div>
                        )}
                        
                        {/* Icon */}
                        <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
                        
                        {/* Label */}
                        <div className="font-bold text-sm sm:text-base mb-1">{label}</div>
                        
                        {/* Description */}
                        <div className={`text-[10px] sm:text-xs mb-3 ${selectedVariant === key ? 'text-blue-100' : 'text-gray-500'}`}>
                          {desc}
                        </div>
                        
                        {/* Price Tag */}
                        <div className={`inline-block px-2 sm:px-3 py-1 rounded-full font-semibold text-xs sm:text-sm ${
                          selectedVariant === key
                            ? 'bg-white text-blue-600'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          ₹{price}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Selected Type Info */}
                  <div className={`mt-4 p-3 rounded-lg text-sm transition-all ${
                    selectedVariant === 'regular' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    selectedVariant === 'oversize' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    ✨ <span className="font-semibold">{
                      selectedVariant === 'regular' ? 'Regular Fit' :
                      selectedVariant === 'oversize' ? 'Premium Oversize' :
                      'Kids Size'
                    }</span> selected - Quality product for you!
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-col items-start gap-3">
                <div className="w-full max-w-md">
                  <label htmlFor="manual-size" className="font-medium mb-2 block">
                    Enter your size
                  </label>
                  <input
                    id="manual-size"
                    type="text"
                    value={selectedSize}
                    onChange={(event) => {
                      setSelectedSize(event.target.value);
                      if (event.target.value.trim()) setSizeError("");
                    }}
                    placeholder="Enter size (for example: 42 or XL)"
                    className={`w-full border rounded px-3 py-2 focus:border-gray-800 focus:outline-none ${sizeError ? "border-red-500" : "border-gray-400"}`}
                    aria-describedby="size-help size-error"
                    aria-invalid={Boolean(sizeError)}
                  />
                  <p id="size-help" className="text-xs text-gray-500 mt-1">
                    Enter the size for the selected {selectedVariant} fit.
                  </p>
                </div>
                <p
                  className="text-sm text-primary underline cursor-pointer mt-1"
                  onClick={() => setShowSize(!showSize)}
                >
                  View Size Chart
                </p>
                {showSize && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
                    <div className="relative bg-white rounded-lg p-7 md:p-4 max-w-3xl w-full shadow-lg">
                      <button
                        onClick={() => setShowSize(!showSize)}
                        className="absolute top-0 md:top-2 right-2 text-3xl font-bold text-gray-700 hover:text-red-500"
                      >
                        ×
                      </button>
                      <div className="md:flex gap-4 items-center justify-center">
                        {displaySizeChart ? (
                          <img
                            src={displaySizeChart}
                            alt="Size Chart"
                            className="w-full max-w-xs object-contain"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            Size chart not available.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Colors */}
              <div>
                <p className="font-semibold text-gray-700 mb-1 mt-4">Colors:</p>
                <div className="flex gap-2 flex-wrap">
                  {colors.length > 0 ? (
                    colors
                      .filter((c) => {
                        if (!c || !c.value) return false;
                        const key = c.value
                          .toString()
                          .toLowerCase()
                          .replace(/[-\s]/g, "");
                        return key !== "blue";
                      })
                      .map((c, idx) => {
                        const bg = getColorCode(c.value);
                        return (
                          <div
                            key={`${c.value}-${idx}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedColor(c.value)}
                            title={c.label}
                            className={`w-8 h-8 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${selectedColor === c.value
                              ? "border-black scale-110 ring-2 ring-offset-1"
                              : "border-gray-300 hover:border-gray-400"
                              }`}
                            style={{ backgroundColor: bg }}
                          />
                        );
                      })
                  ) : (
                    <div className="text-sm text-gray-500">No color options</div>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex border rounded overflow-hidden">
                  <button
                    className="px-3 py-1 text-lg font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-lg">{quantity}</span>
                  <button
                    className="px-3 py-1 text-lg font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buttons */}
              {sizeError && (
                <p
                  id="size-error"
                  role="alert"
                  className="mt-4 w-full max-w-md rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {sizeError}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleAddToCart}
                  className="w-full sm:w-auto bg-white border border-gray-900 text-gray-900 font-semibold px-6 py-2 rounded transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full sm:w-auto bg-gray-900 text-white font-semibold px-6 py-2 rounded cursor-pointer hover:bg-gray-800 transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>

              {/* Details */}
              {(descriptionValue || design?.product_description || design?.details || design?.description_text) && (
                <p className="mt-6 text-gray-700 leading-relaxed">
                  {descriptionValue || design?.product_description || design?.details || design?.description_text}
                </p>
              )}

              <p className="mt-3">
                <strong>Fabric Details: </strong>
                {fabricDetailsValue || design?.fabric_details || "N/A"}
              </p>

              <div className="mt-5">
                <span className="font-bold mb-3">Wash Care:</span>
                <ul className="mt-2 space-y-1 text-gray-700">
                  <li>✅ Machine wash cold, inside out</li>
                  <li>✅ Tumble dry low heat</li>
                  <li>❌ Do not bleach</li>
                  <li>❌ Do not iron directly on the print</li>
                  <li>✅ Iron inside out if needed</li>
                </ul>
              </div>

              <p className="mt-3">
                <strong>Note: </strong>
                <span className="text-red-500 font-semibold">{notes}</span>
              </p>
            </div>
          </div>
        </PageContainer>

        <RelatedProducts
          category={category}
          subcategory={subcategory}
          currentId={design.id || design.product_id || design.productId}
          addToCart={addToCart}
          addToWishlist={addToWishlist}
        />

        <div className="mt-12 border-t pt-10">
          <Review
            reviews={reviews}
            uname={user?.username || user?.email}
            productname={name}
            productId={productId}
          />
        </div>
      </div>

    </div>

  );
};

export default DesignDetails;
