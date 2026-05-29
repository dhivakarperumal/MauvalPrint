import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaStar, FaHeart, FaShoppingCart, FaEye } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import AOS from "aos";
import "aos/dist/aos.css";
import { toast } from "react-toastify";
import Head from "../Components/Head";

function ProductCard({ product, index, addToCart, addToWishlist, cardSize, setCardSize }) {
  const [clickedProductId, setClickedProductId] = useState(null);

  if (!product || !product.stockByVariant) return null;

  const toggleBubble = (productId) => {
    setClickedProductId((prevId) => (prevId === productId ? null : productId));
  };

  return (
    <div
      key={product.id}
      onClick={() => toggleBubble(product.id)}
      data-aos="fade-up"
      data-aos-delay={index * 100}
      className="group relative bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 p-4"
    >
      <div className="relative w-full h-52 bg-primary/5 rounded-[30px] overflow-hidden shadow-lg transition-transform duration-700 ease-in-out hover:scale-105">
        {/* Cart button */}
        <div
          className={`absolute w-[70%] h-[70%] transition-all duration-400 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${
            clickedProductId === product.id
              ? "bottom-0 left-0"
              : "bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
          }`}
          style={{ borderTop: "2px solid white", borderRight: "1px solid white", backdropFilter: "blur(2px)" }}
        >
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const selectedSize = cardSize[product.id];
                const defaultColor = product?.color?.[0];

                if (!selectedSize) return toast.warn("Please select a size");
                if (!defaultColor) return toast.warn("No color available for this product");

                addToCart({ ...product, selectedSize, selectedColor: defaultColor });
              }}
              className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-white hover:text-primary transition"
              title="Add to Cart"
            >
              <FaShoppingCart size={16} />
            </button>
          </div>
        </div>

        {/* Wishlist button */}
        <div
          className={`absolute w-[50%] h-[50%] transition-all duration-700 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${
            clickedProductId === product.id
              ? "bottom-0 left-0"
              : "bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
          }`}
          style={{ borderTop: "2px solid white", borderRight: "1px solid white", backdropFilter: "blur(2px)" }}
        >
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToWishlist(product);
              }}
              className="text-white cursor-pointer bg-white/20 p-2 rounded-full hover:bg-white hover:text-primary transition"
              title="Add to Wishlist"
            >
              <FaHeart size={16} />
            </button>
          </div>
        </div>

        {/* View Details button */}
        <div
          className={`absolute w-[32%] h-[32%] transition-all duration-1000 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${
            clickedProductId === product.id
              ? "bottom-0 left-0"
              : " bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
          }`}
          style={{ borderTop: "2px solid white", borderRight: "1px solid white", backdropFilter: "blur(2px)" }}
        >
          <div className="absolute top-2 right-2">
            <Link to={`/productdetails/${product.productId}`}>
              <button
                className="text-white cursor-pointer bg-white/20 p-2 rounded-full hover:bg-white hover:text-primary transition"
                title="View Details"
              >
                <FaEye size={16} />
              </button>
            </Link>
          </div>
        </div>

        <img
          src={product?.images?.[0] || product?.image?.[0] || "/placeholder.jpg"}
          alt={product.name}
          className="relative z-5 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-800 truncate mt-3 text-center">{product.name}</h3>

      {/* Rating */}
      <div className="flex items-center justify-center text-yellow-500 text-sm my-1 gap-1">
        {[...Array(5)].map((_, i) => (
          <FaStar key={i} className={i < Math.round(product?.rating || 0) ? "" : "text-gray-300"} />
        ))}
      </div>

      <p className="text-md font-bold text-primary mt-2 text-center">
        MRP: <del>₹{product?.mrp || 0}</del> ₹{product?.salePrice || 0}
      </p>

      {/* Sizes */}
      <div className="mt-2 mb-3 flex flex-wrap items-center justify-center gap-2">
        {(product?.size || []).map((sz) => {
          const selectedColor = product.color?.[0];
          const variantKey = `${selectedColor}-${sz}`;
          const isAvailable = product.stockByVariant?.[variantKey] > 0;

          return (
            <button
              key={sz}
              onClick={() => isAvailable && setCardSize((prev) => ({ ...prev, [product.id]: sz }))}
              className={`px-2 py-0.5 rounded-full text-xs border ${
                cardSize[product.id] === sz
                  ? "bg-primary text-white border-primary"
                  : isAvailable
                  ? "bg-white text-gray-700 border-gray-300 cursor-pointer"
                  : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
              }`}
              disabled={!isAvailable}
            >
              {sz}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Products() {
  const { products: contextProducts, addToCart, addToWishlist } = useContext(AuthContext);
  const location = useLocation();

  const [category, setCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState(2000);
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [cardSize, setCardSize] = useState({});

  const products = Array.isArray(contextProducts) ? contextProducts : [];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subcatParam = params.get("subcategory") || "all";
    setSelectedSubcategory(subcatParam.toLowerCase());
    setCurrentPage(1);
  }, [location.search]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const categories = ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];
  const sizes = ["all", ...new Set(products.flatMap((p) => p.size || []))];
  const colors = [
    "all",
    ...new Set(products.flatMap((p) => Object.keys(p.stockByVariant || {}).map((key) => key.split("-")[0]))),
  ];

  const allPrices = products.map((p) => p.salePrice || 0);
  const priceRangeMin = Math.min(...allPrices, 0);
  const priceRangeMax = Math.max(...allPrices, 2000);

  useEffect(() => {
    setPriceRange(priceRangeMax);
  }, [priceRangeMax]);

  // Memoized filtered & paginated products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = category === "all" || product.category === category;
      const matchPrice = product.salePrice <= priceRange;
      const matchRating = (product.rating || 0) >= minRating;
      const matchSize = selectedSize === "all" || (product.size || []).includes(selectedSize);
      const matchColor =
        selectedColor === "all" ||
        Object.keys(product.stockByVariant || {}).some((variantKey) =>
          variantKey.startsWith(`${selectedColor}-`)
        );
      const matchSubcategory =
        selectedSubcategory === "all" || product.subcategory?.toLowerCase() === selectedSubcategory;

      return matchCategory && matchSubcategory && matchPrice && matchRating && matchSize && matchColor;
    });
  }, [products, category, priceRange, minRating, selectedSize, selectedColor, selectedSubcategory]);

  const productsPerPage = 6;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage]);

  // Debounced price change
  const handlePriceChange = (value) => {
    clearTimeout(window.priceTimeout);
    window.priceTimeout = setTimeout(() => {
      setPriceRange(value);
      setCurrentPage(1);
    }, 150);
  };

  // Loading state when products haven't loaded yet
  if (!products || products.length === 0) {
    return (
      <div className="mt-18">
        <Head title="Our Products" subtitle="Products" />
        <section className="p-4 md:p-8 bg-white">
          <div className="flex justify-center items-center mt-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mt-18">
      <Head title="Our Products" subtitle="Products" />

      {/* Mobile Filter Dropdown */}
      <div className="md:hidden p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-2 bg-primary text-white rounded-md"
        >
          Customize Filters
          <IoIosArrowDown className={`transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      <section className="p-4 md:p-8 bg-white">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          {(showFilters || window.innerWidth >= 768) && (
            <div className="w-full md:w-1/4 h-full border border-gray-200 rounded-xl p-4 shadow-sm bg-primary/5">
              <h3 className="text-lg font-semibold mb-4">Filter By</h3>

              {/* Category */}
              <div className="mb-4">
                <p className="font-medium mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-full border text-sm cursor-pointer ${
                        category === cat ? "bg-primary text-white border-primary" : "bg-white text-gray-700"
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="font-medium mb-2">Price Under: ₹{priceRange}</p>
                <input
                  type="range"
                  min={priceRangeMin}
                  max={priceRangeMax}
                  value={priceRange}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Size */}
              <div className="mb-4">
                <p className="font-medium mb-2">Size</p>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedSize(size);
                        setCurrentPage(1);
                      }}
                      className={`w-9 h-9 border rounded-full text-sm cursor-pointer ${
                        selectedSize === size ? "bg-primary text-white border-primary" : "bg-white text-gray-700"
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="mb-4">
                <p className="font-medium mb-2">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {["Navy", "Red", "Black", "White"]
                    .filter((clr) => colors.includes(clr))
                    .map((clr, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedColor(clr);
                          setCurrentPage(1);
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                          selectedColor === clr ? "ring-2 ring-primary border-primary" : "border-gray-300"
                        }`}
                        style={{
                          backgroundColor:
                            clr.toLowerCase() === "white"
                              ? "#ffffff"
                              : clr.toLowerCase() === "navy"
                              ? "#000080"
                              : clr.toLowerCase(),
                        }}
                        title={clr}
                      />
                    ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <p className="font-medium mb-2">Minimum Rating</p>
                <div className="flex flex-col gap-1">
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === r}
                        onChange={() => {
                          setMinRating(r);
                          setCurrentPage(1);
                        }}
                        className="accent-primary"
                      />
                      <span>{r} & UP</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setCategory("all");
                    setPriceRange(priceRangeMax);
                    setSelectedSize("all");
                    setSelectedColor("all");
                    setMinRating(0);
                    setCurrentPage(1);
                  }}
                  className="w-full py-2 text-sm bg-primary text-white border transition-all duration-500 border-primary hover:bg-white hover:text-primary"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="w-full md:w-3/4">
            {paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id || index}
                    product={product}
                    index={index}
                    addToCart={addToCart}
                    addToWishlist={addToWishlist}
                    cardSize={cardSize}
                    setCardSize={setCardSize}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-10">No products found for selected filters.</p>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center gap-2">
                <span className="font-medium text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-8 w-8 rounded-full border text-sm ${
                        currentPage === i + 1
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Products;
