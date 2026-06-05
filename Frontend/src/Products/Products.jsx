import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaStar, FaHeart, FaShoppingCart, FaEye } from "react-icons/fa";
import { IoIosArrowDown, IoMdOptions } from "react-icons/io";
import AOS from "aos";
import PageContainer from "../Components/PageContainer";
import "aos/dist/aos.css";
import { toast } from "react-toastify";
import Head from "../Components/Head";
import api from "../api";
import { isValidImageSrc, pickPrimaryImage, flattenVariantImages } from "./helpers";

function ProductCard({ product, index, addToCart, addToWishlist, cardSize, setCardSize }) {
  const [clickedProductId, setClickedProductId] = useState(null);
  const stockByVariant = product?.stockByVariant || {};

  if (!product) return null;

  const toggleBubble = (productId) => {
    setClickedProductId((prevId) => (prevId === productId ? null : productId));
  };

  return (
    <div
      key={product.id}
      onClick={() => toggleBubble(product.id)}
      data-aos="fade-up"
      data-aos-delay={index * 100}
      className="group relative bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 p-3"
    >
      <div className="relative w-full h-52 bg-primary/5 rounded-[30px] overflow-hidden shadow-lg transition-transform duration-700 ease-in-out hover:scale-105">
        {/* Cart button */}
        <div
          className={`absolute w-[65%] h-[65%] transition-all duration-400 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedProductId === product.id
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
              className="text-white bg-white/20 p-1.5 cursor-pointer rounded-full hover:bg-white hover:text-primary transition"
              title="Add to Cart"
            >
              <FaShoppingCart size={15} />
            </button>
          </div>
        </div>

        {/* Wishlist button */}
        <div
          className={`absolute w-[47%] h-[47%] transition-all duration-700 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedProductId === product.id
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
              className="text-white cursor-pointer bg-white/20 p-1.5 rounded-full hover:bg-white hover:text-primary transition"
              title="Add to Wishlist"
            >
              <FaHeart size={15} />
            </button>
          </div>
        </div>

        {/* View Details button */}
        <div
          className={`absolute w-[29%] h-[29%] transition-all duration-1000 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedProductId === product.id
            ? "bottom-0 left-0"
            : " bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
            }`}
          style={{ borderTop: "2px solid white", borderRight: "1px solid white", backdropFilter: "blur(2px)" }}
        >
          <div className="absolute top-2 right-2">
            <Link to={`/productdetails/${product.product_id}`}>
              <button
                className="text-white cursor-pointer bg-white/20 p-1.5 rounded-full hover:bg-white hover:text-primary transition"
                title="View Details"
              >
                <FaEye size={15} />
              </button>
            </Link>
          </div>
        </div>

        <img
          src={pickPrimaryImage(product) || (product?.images_final?.[0]) || product?.image?.[0] || "/placeholder.jpg"}
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
          const selectedColor = product.color?.[0] || "";
          const variantKey = `${selectedColor}-${sz}`;
          const variantQuantity = stockByVariant[variantKey];
          const isAvailable = variantQuantity > 0 || product.stock > 0;

          return (
            <button
              key={sz}
              onClick={() => isAvailable && setCardSize((prev) => ({ ...prev, [product.id]: sz }))}
              className={`px-2 py-0.5 rounded-full text-xs border ${cardSize[product.id] === sz
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
  const { products: contextProducts, designs: contextDesigns, addToCart, addToWishlist } = useContext(AuthContext);
  const location = useLocation();

  const [pageProducts, setPageProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState(2000);
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [cardSize, setCardSize] = useState({});

  const allContextProducts = useMemo(() => {
    return [...(contextProducts || []), ...(contextDesigns || [])];
  }, [contextProducts, contextDesigns]);

  const products =
    Array.isArray(allContextProducts) && allContextProducts.length > 0 ? allContextProducts : pageProducts;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subcatParam = params.get("subcategory") || "all";
    setSelectedSubcategory(subcatParam.toLowerCase());
    setCurrentPage(1);
  }, [location.search]);

  useEffect(() => {
    console.log("Products useEffect triggered");
    console.log("allContextProducts:", allContextProducts);

    let isMounted = true;

    const loadProducts = async () => {
      console.log("loadProducts called");

      if (Array.isArray(allContextProducts) && allContextProducts.length > 0) {
        console.log("Using context products:", allContextProducts);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        console.log("Calling /products API...");

        const response = await api.get("/products");

        console.log("Full API Response:", response);
        console.log("Response Data:", response.data);

        const { data } = response;

        if (!isMounted) return;

        if (data?.success && Array.isArray(data.products)) {
          console.log("Raw Products:", data.products);

          const normalized = data.products.map((product) => ({
            ...product,
            id:
              product.product_id ||
              product.id ||
              product.productId ||
              `${product.product_id}`,

            productId:
              product.product_id ||
              product.productId ||
              product.id,

            salePrice: Number(
              product.sale_price ??
              product.salePrice ??
              0
            ),

            mrp: Number(product.mrp ?? 0),
            // normalize images to images_final
            images: (product.images_final && product.images_final.length > 0) ? product.images_final : (Array.isArray(product.images) ? product.images : []),
            images_by_variant: (product.images_by_variant && typeof product.images_by_variant === 'object') ? product.images_by_variant : {},

            color:
              typeof product.color === "string"
                ? product.color.startsWith("[")
                  ? JSON.parse(product.color)
                  : product.color
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                : Array.isArray(product.color)
                  ? product.color
                  : [],

            size:
              typeof product.size === "string"
                ? product.size.startsWith("[")
                  ? JSON.parse(product.size)
                  : product.size
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                : Array.isArray(product.size)
                  ? product.size
                  : [],

            // if images empty, flatten variant images
            images_final: (function () {
              const imgs = (typeof product.images === 'string')
                ? (product.images.startsWith('[') ? JSON.parse(product.images) : product.images.split(',').map(s => s.trim()).filter(Boolean))
                : (Array.isArray(product.images) ? product.images : []);
              if (imgs.length > 0) return imgs;
              const byVar = (typeof product.images_by_variant === 'string')
                ? (product.images_by_variant.startsWith('{') ? JSON.parse(product.images_by_variant) : {})
                : (typeof product.images_by_variant === 'object' ? product.images_by_variant : {});
              return Object.values(byVar).flat().filter(Boolean);
            })(),

            stockByVariant:
              typeof product.stock_by_variant === "string"
                ? product.stock_by_variant.startsWith("{")
                  ? JSON.parse(product.stock_by_variant)
                  : {}
                : product.stock_by_variant || {},

            ourDesign:
              product.our_design === 1 ||
              product.our_design === "1" ||
              product.ourDesign === true,
          }));

          console.log("Normalized Products:", normalized);

          setPageProducts(normalized);

          console.log("Page Products Set:", normalized);
        } else {
          console.log("No products found in API response");
          setPageProducts([]);
        }
      } catch (error) {
        console.error("Products API Error:", error);
        console.error("Error Response:", error?.response);
        setPageProducts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [allContextProducts]);

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
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Debounced price change
  const handlePriceChange = (value) => {
    clearTimeout(window.priceTimeout);
    window.priceTimeout = setTimeout(() => {
      setPriceRange(value);
      setCurrentPage(1);
    }, 150);
  };

  if (loading) {
    return (

      <div className="mt-18">
        <PageContainer>
          <Head title="Our Products" subtitle="Products" />
          <section className="p-4 md:p-8 bg-white">
            <div className="flex justify-center items-center mt-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </section>
        </PageContainer>
      </div>

    );
  }

  if (!products || products.length === 0) {
    return (

      <div className="mt-18">

        <Head title="Our Products" subtitle="Products" />
        <PageContainer>
          <section className="p-4 md:p-8 bg-white">
            <p className="text-center text-gray-500 py-20">No products found.</p>
          </section>
        </PageContainer>
      </div >

    );
  }

  return (

    <div className="mt-18">

      <Head title="Our Products" subtitle="Products" />
      <PageContainer>
         <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:opacity-90"
            >
              <IoMdOptions size={18} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            
          </div>
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

        <section className="py-4 md:py-8 bg-white">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters */}
            {showFilters && (
              <div className="w-[280px] flex-shrink-0 h-full border border-gray-200 rounded-xl p-4 shadow-sm bg-primary/5">
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
                        className={`px-3 py-1 rounded-full border text-sm cursor-pointer ${category === cat ? "bg-primary text-white border-primary" : "bg-white text-gray-700"
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
                        className={`w-9 h-9 border rounded-full text-sm cursor-pointer ${selectedSize === size ? "bg-primary text-white border-primary" : "bg-white text-gray-700"
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
                          className={`w-7 h-7 rounded-full border-2 transition-all duration-300 cursor-pointer ${selectedColor === clr ? "ring-2 ring-primary border-primary" : "border-gray-300"
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
            <div
              className={`min-w-0 transition-all duration-300 ${showFilters ? "flex-1" : "w-full"
                }`}
            >
              {paginatedProducts.length > 0 ? (
                <div
                  className={`grid gap-4 ${showFilters
                      ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-2 md:grid-cols-4 xl:grid-cols-5"
                    }`}
                >
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
                <div className="mt-10 flex flex-col items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-full px-3 py-1 border bg-white text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      const shouldShow =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2;

                      if (!shouldShow) {
                        if (
                          page === 2 && currentPage > 4 ||
                          page === totalPages - 1 && currentPage < totalPages - 3
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`h-9 min-w-[2.25rem] rounded-full border text-sm ${currentPage === page
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-full px-3 py-1 border bg-white text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    Showing page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </PageContainer>
    </div>

  );
}

export default Products;
