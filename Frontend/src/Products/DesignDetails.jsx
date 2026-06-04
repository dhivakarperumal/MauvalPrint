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
  const { user, designs = [], addToCart, addToWishlist, wishlist = [] } =
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
  const [imagesLoaded, setImagesLoaded] = useState({});

  // find design by productId
  const design = useMemo(() => 
    designs.find((d) => d.id === productId || d.product_id === productId || d.productId === productId),
    [designs, productId]
  );

  // safe defaults for destructuring
  const {
    name = "Product",
    rating = 0,
    description = "",
    images: designImages = [],
    reviews = [],
    color: designColors = [],
    mrp = 0,
    salePrice = 0,
    offer = 0,
    size: sizeArr = [],
    sizeChartImage = "",
    category = "",
    subcategory = "",
    fabricDetails = "N/A",
    washingDetails = [],
    notes = "",
  } = design || {};

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
  const colors = Array.isArray(designColors)
    ? designColors.map(normalizeColor)
    : [];
  const sizes = Array.isArray(sizeArr) ? sizeArr : [];

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
    if (sizes.length > 0) setSelectedSize(sizes[0]);
    if (colors.length > 0) setSelectedColor(colors[0].value);
  }, [productId, designs]);

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

    if (!selectedSize) return toast.warn("Please select a size");
    if (colors.length > 0 && !selectedColor) return toast.warn("Please select a color");

    const item = {
      ...design,
      id: design.id || design.product_id || design.productId,
      selectedSize,
      quantity,
      price: salePrice || mrp,
      selectedColor,
      color: selectedColor,
      image: images[selectedImageIndex] || images[0],
    };
    addToCart(item, quantity);
  };

  // --- Buy Now ---
  const handleBuyNow = () => {
    if (!user) {
      toast.warn("Please login to continue shopping");
      return;
    }

    if (!selectedSize) return toast.warn("Please select a size");
    if (colors.length > 0 && !selectedColor) return toast.warn("Please select a color");

    const productToBuy = {
      productId,
      name,
      price: salePrice || mrp,
      originalPrice: mrp,
      offer,
      image: images[selectedImageIndex] || images[0],
      selectedSize,
      selectedColor,
      quantity,
    };

    navigate("/checkout", {
      state: { buyNowProduct: productToBuy, fromCart: false },
    });
  };

  // --- Wishlist Logic (Same as SingleProductView) ---
  const isWishlisted = wishlist.some((item) => item.id === (design.id || design.product_id || design.productId));

  const handleWishlistToggle = () => {
    if (!user) {
      toast.warn("Please login to manage wishlist");
      navigate("/account", { state: { returnUrl: window.location.pathname } });
      return;
    }

    if (isWishlisted) {
      // Remove from wishlist
      addToWishlist({ ...design, id: design.id || design.product_id || design.productId }, true); // Pass true if your context uses it as "remove" flag
      toast.info("Removed from favorites");
    } else {
      // Add to wishlist
      const wishlistItem = {
        ...design,
        id: design.id || design.product_id || design.productId,
        selectedSize,
        color: selectedColor,
        image: images[selectedImageIndex] || images[0],
      };
      addToWishlist(wishlistItem);
    }
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
    <PageContainer>
        <div className="bg-white py-6 px-4 sm:px-8 lg:px-20">
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
                    className={`w-16 h-16 object-cover border rounded cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 ${
                      selectedImageIndex === index
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
              ₹{salePrice || mrp}{" "}
              <span className="line-through text-gray-500 text-sm ml-2">
                ₹{mrp}
              </span>{" "}
              <span className="text-green-600 font-medium text-sm ml-2">
                ({offer}% OFF)
              </span>
            </div>

            {/* Sizes */}
            <div className="mt-4 flex items-end gap-3">
              <div>
                <p className="font-medium mb-2">Sizes:</p>
                <div className="flex gap-3 flex-wrap">
                  {sizes.length > 0 ? (
                    (() => {
                      const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
                      const sortedSizes = [...sizes].sort((a, b) => {
                        const indexA = sizeOrder.indexOf(a);
                        const indexB = sizeOrder.indexOf(b);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                      });
                      return sortedSizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1 border rounded cursor-pointer hover:opacity-80 transition-all ${
                            selectedSize === s
                              ? "bg-gray-800 text-white"
                              : "bg-white border-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ));
                    })()
                  ) : (
                    <div className="text-sm text-gray-500">Single size</div>
                  )}
                </div>
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
                      {sizeChartImage ? (
                        <img
                          src={sizeChartImage}
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
                          className={`w-8 h-8 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${
                            selectedColor === c.value
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
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleAddToCart}
                className="w-full sm:w-auto bg-white border border-gray-900 cursor-pointer hover:bg-gray-50 text-gray-900 font-semibold px-6 py-2 rounded transition-all hover:shadow-md"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full sm:w-auto bg-gray-900 text-white font-semibold px-6 py-2 rounded cursor-pointer hover:bg-gray-800 transition-all hover:shadow-md"
              >
                Buy Now
              </button>
            </div>

            {/* Details */}
            <p className="mt-6 text-gray-700 leading-relaxed">
              {description || "No description available."}
            </p>

            <p className="mt-3">
              <strong>Fabric Details: </strong>
              {fabricDetails}
            </p>

            <div className="mt-5">
              <span className="font-bold mb-3">Washing Instructions:</span>
              <ul className="list-disc ml-5">
                {Array.isArray(washingDetails) && washingDetails.length ? (
                  washingDetails.map((info, i) => <li key={i}>{info}</li>)
                ) : (
                  <li>No washing instructions provided.</li>
                )}
              </ul>
            </div>

            <p className="mt-3">
              <strong>Note: </strong>
              <span className="text-red-500 font-semibold">{notes}</span>
            </p>
          </div>
        </div>

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
      </PageContainer>
      </div>
    
  );
};

export default DesignDetails;
