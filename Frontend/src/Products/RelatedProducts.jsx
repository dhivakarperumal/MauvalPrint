import { useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import api from "../api";
import { FaStar, FaHeart, FaShoppingCart, FaEye } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { toast } from "react-toastify";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import PageContainer from "../Components/PageContainer";

// Image optimization utility
const optimizeImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('firebaseapp.com')) {
    return `${url}&w=350&q=60`; // Reduced quality for speed
  }
  return url;
};

// Memoized Product Card
const ProductCard = memo(({ product, index, addToCart, addToWishlist }) => {
  const [cardSize, setCardSize] = useState({});
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
            <Link to={`/designdetails/${product.product_id}`}>
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
          src={optimizeImageUrl(product?.images?.[0] || product?.image?.[0] || "/placeholder.jpg")}
          alt={product.name}
          className="relative z-5 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width={350}
          height={280}
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
}, (prevProps, nextProps) => {
  return (
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.index === nextProps.index
  );
});

ProductCard.displayName = 'ProductCard';

const RelatedProducts = ({ category, subcategory, currentId, addToCart, addToWishlist }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!category) return;
      setLoading(true);

      try {
        const res = await api.get("/products");
        const all = res.data?.products || [];

        // normalize and filter
        const products = all
          .map((p) => {
            // parse JSON fields if necessary
            const parse = (val) => {
              if (!val) return [];
              if (Array.isArray(val) || typeof val === "object") return val;
              try {
                return JSON.parse(val);
              } catch {
                return [];
              }
            };

            return {
              ...p,
              id: p.product_id || p.id,
              product_id: p.product_id || p.id,
              name: p.name || p.title || p.product_name,
              images: parse(p.images) || parse(p.image),
              size: parse(p.size),
              color: parse(p.color),
              stockByVariant: (typeof p.stock_by_variant === 'string') ? (() => { try { return JSON.parse(p.stock_by_variant); } catch { return {}; } })() : (p.stock_by_variant || {}),
              rating: p.rating || 0,
            };
          })
          .filter((p) => p.product_id !== currentId)
          .filter((p) => p.category === category && (subcategory ? p.subcategory === subcategory : true))
          .slice(0, 5);

        setRelatedProducts(products);
      } catch (error) {
        console.error("🔥 Error fetching related products:", error);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [category, subcategory, currentId]);

  // 🔹 Slider settings
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  // 🔹 Loading
  if (loading) {
    return (
      <section className="my-10 px-4 sm:px-10 text-center">
        <h2 className="text-xl font-semibold text-gray-600">Loading related products...</h2>
      </section>
    );
  }

  // 🔹 Empty
  if (relatedProducts.length === 0) {
    return (
      <section className="my-10 px-4 sm:px-10 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Explore More <span className="text-green1">Mauval Prints</span>
        </h2>
       
      </section>
    );
  }

  // 🔹 Display related products
  return (
    <section className="my-10 mt-15 mb-18">
      <PageContainer>
      <div className="max-w-9xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
           <h2 className="text-2xl font-bold mb-15">
            Explore <span className="text-primary">Related Products</span>
          </h2>
          
        </div>

        

        {/* Slider */}
        <Slider {...settings}>
          {relatedProducts.map((product, index) => (
            <div key={product.id} className="px-3">
              <ProductCard
                product={product}
                index={index}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
              />
            </div>
          ))}
        </Slider>
      </div>
      </PageContainer>
    </section>
  );
};

export default RelatedProducts;
