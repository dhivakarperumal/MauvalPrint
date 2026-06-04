import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link } from "react-router-dom";
import PageContainer from "../Components/PageContainer";
import { FaStar, FaHeart, FaShoppingCart, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import Slider from "react-slick";
import AOS from "aos";
import "aos/dist/aos.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import api from "../api";
import { pickPrimaryImage, flattenVariantImages, isValidImageSrc } from "../Products/helpers";

function Product() {
  const { addToCart, addToWishlist } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clickedProductId, setClickedProductId] = useState(null);
  const [cardSize, setCardSize] = useState({});

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const { data } = await api.get("/products");

        if (data?.success && Array.isArray(data.products)) {
          const normalized = data.products.map((product) => {
            let parsedImagesByVariant = product.images_by_variant;
            if (typeof parsedImagesByVariant === "string") {
              try {
                parsedImagesByVariant = JSON.parse(parsedImagesByVariant);
              } catch (e) {
                parsedImagesByVariant = {};
              }
            }
            if (typeof parsedImagesByVariant !== "object" || !parsedImagesByVariant) {
              parsedImagesByVariant = {};
            }

            const images =
              typeof product.images === "string"
                ? JSON.parse(product.images || "[]")
                : product.images || [];

            const finalImages =
              Array.isArray(images) && images.length > 0
                ? images
                : flattenVariantImages(parsedImagesByVariant);

            return {
              ...product,
              id:
                product.product_id ||
                product.id ||
                product.productId,

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

              color:
                typeof product.color === "string"
                  ? JSON.parse(product.color || "[]")
                  : product.color || [],

              size:
                typeof product.size === "string"
                  ? JSON.parse(product.size || "[]")
                  : product.size || [],

              images: finalImages,
              images_by_variant: parsedImagesByVariant,

              stockByVariant:
                typeof product.stock_by_variant === "string"
                  ? JSON.parse(product.stock_by_variant || "{}")
                  : product.stock_by_variant || {},
            };
          });

          setProducts(normalized);
          console.log("Total Products:", normalized.length);
          console.log(normalized);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const toggleBubble = (productId) => {
    setClickedProductId((prevId) => (prevId === productId ? null : productId));
  };

  // ✅ Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || "Others";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  // ✅ Slider settings
  const sliderSettings = {
    infinite: false,
    speed: 600,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    dots: false,
    adaptiveHeight: true,
    autoplay: false,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  const getHeaderTitle = (category) => {
    const lower = category.toLowerCase();
    if (lower.includes("customize t-shirt mens")) return "Customize T-Shirt";
    if (lower === "other" || lower === "others") return "Other Products";
    return category;
  };

  // Loading state when products haven't loaded yet
  if (loading) {
    return (
      <section className="p-6 md:p-10 bg-white">
        <div className="flex justify-center items-center mt-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <section className="p-6 md:p-10 bg-white">
        <p className="text-center py-10">
          No products found
        </p>
      </section>
    );
  }

  return (

    <section className="py-5 bg-white">
      <PageContainer>
        {Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="mb-14" data-aos="fade-up">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              {getHeaderTitle(category)}
            </h3>

            <Slider {...sliderSettings}>
              {items.map((product) => (
                <div key={product.id} className="px-3">
                  <div
                    onClick={() => toggleBubble(product.id)}
                    className="group relative bg-white border text-center border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 p-4"
                  >
                    {/* ─────── Image with Bubble Effects ─────── */}
                    <div className="relative w-full h-52 bg-primary/5 rounded-[30px] overflow-hidden shadow-lg transition-transform duration-1000 ease-in-out hover:scale-105 group">
                      {/* Cart Bubble */}
                      <div
                        className={`absolute w-[70%] h-[70%] transition-all duration-400 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedProductId === product.id
                          ? "bottom-0 left-0"
                          : "bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
                          }`}
                        style={{
                          borderTop: "2px solid white",
                          borderRight: "1px solid white",
                          backdropFilter: "blur(2px)",
                        }}
                      >
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const selectedSize = cardSize[product.id];
                              const defaultColor = product?.color?.[0];

                              if (!selectedSize)
                                return toast.warn("Please select a size");
                              if (!defaultColor)
                                return toast.warn("No color available");

                              addToCart({
                                ...product,
                                selectedSize,
                                selectedColor: defaultColor,
                              });

                            }}
                            className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-white hover:text-primary transition"
                            title="Add to Cart"
                          >
                            <FaShoppingCart size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Wishlist Bubble */}
                      <div
                        className={`absolute w-[50%] h-[50%] transition-all duration-700 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedProductId === product.id
                          ? "bottom-0 left-0"
                          : "bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
                          }`}
                        style={{
                          borderTop: "2px solid white",
                          borderRight: "1px solid white",
                          backdropFilter: "blur(2px)",
                        }}
                      >
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToWishlist(product);
                            }}
                            className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-white hover:text-primary transition"
                            title="Add to Wishlist"
                          >
                            <FaHeart size={16} />
                          </button>
                        </div>
                      </div>

                      {/* View Details Bubble */}
                      <div
                        className={`absolute w-[32%] h-[32%] transition-all duration-1000 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedProductId === product.id
                          ? "bottom-0 left-0"
                          : "bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
                          }`}
                        style={{
                          borderTop: "2px solid white",
                          borderRight: "1px solid white",
                          backdropFilter: "blur(2px)",
                        }}
                      >
                        <div className="absolute top-2 right-2">
                          <Link
                            to={`/productdetails/${product.product_id}`}
                            state={{ product }}
                          >
                            <button
                              // onClick={(e) => e.stopPropagation()}
                              className="text-white bg-white/20 p-2 rounded-full cursor-pointer hover:bg-white hover:text-primary transition"
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Product Image */}
                      <img
                        src={
                          pickPrimaryImage(product) ||
                          product?.images?.[0] ||
                          product?.image?.[0] ||
                          "/placeholder.jpg"
                        }
                        alt={product.name}
                        className="relative z-5 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* ─────── Product Info ─────── */}
                    <h3 className="text-lg font-semibold text-gray-800 truncate mt-3">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-center text-yellow-500 text-sm my-1 gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={
                            i < Math.round(product?.rating || 0)
                              ? ""
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>

                    <p className="text-md font-bold text-primary mt-2">
                      MRP: <del>₹{product?.mrp || 0}</del> ₹{product?.salePrice || 0}
                    </p>

                    {/* Sizes */}
                    <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center justify-center gap-1">
                      {(product?.size || []).map((sz) => {
                        const selectedColor = product.color?.[0];
                        const variantKey = `${selectedColor}-${sz}`;
                        const isAvailable =
                          product.stockByVariant?.[variantKey] > 0;

                        return (
                          <button
                            key={sz}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAvailable)
                                setCardSize((prev) => ({
                                  ...prev,
                                  [product.id]: sz,
                                }));
                            }}
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
                </div>
              ))}
            </Slider>
          </div>
        ))}
      </PageContainer>
    </section>
  );
}

export default Product;
