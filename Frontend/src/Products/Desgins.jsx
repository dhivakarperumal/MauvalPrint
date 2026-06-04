import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import Head from "../Components/Head";
import { FaHeart, FaShoppingCart, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import PageContainer from "../Components/PageContainer";

const Designs = () => {
  const { designs } = useContext(AuthContext);
  const [theme, setTheme] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Theme filter
  const themeOptions = ["All", ...Array.from(new Set(designs?.map(d => d.keyword).filter(Boolean)))];
  const filteredDesigns = theme === "All" ? designs : designs.filter(d => d.keyword === theme);
  const totalPages = Math.ceil(filteredDesigns.length / ITEMS_PER_PAGE);
  const paginatedDesigns = filteredDesigns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [theme]);

  // Loading state when designs haven't loaded yet
  if (!designs || designs.length === 0) {
    return (

      <div className="mt-17">
        
          <Head title="Designs" subtitle="Designs" />
          <PageContainer>
          <div className="min-h-screen bg-[#fef4f3] py-10 px-4">
            <h1 className="text-3xl font-bold text-center mb-6 text-primary">
              Our Designs
            </h1>
            <div className="flex justify-center items-center mt-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </PageContainer>
      </div>

    );
  }

  return (
    
      <div className="mt-17">
        
        <Head title="Designs" subtitle="Designs" />
        
        <div className="min-h-screen bg-[#fef4f3] py-10 px-4">
          <PageContainer> 
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">
            Our Designs
          </h1>

          {/* Theme Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {themeOptions.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setTheme(t)}
                className={`px-4 py-1 rounded-full border transition font-medium ${theme === t
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-primary border"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            {paginatedDesigns.map((design) => (
              <DesignCard
                key={design.id}
                product={design}
                images={design.images || [design.image]}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded-full ${i + 1 === currentPage ? "bg-primary text-white" : ""
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
          </PageContainer>
        </div>
        
      </div>
  );
};

// ---------------------------
// Design Card Component
// ---------------------------
const DesignCard = ({ product, images }) => {
  const { addToCart, addToWishlist } = useContext(AuthContext);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.size?.[0] || null);
  const [selectedColor, setSelectedColor] = useState(product.color?.[0] || null);

  const colors = product.color || [];
  const sizes = product.size || [];

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.warn("Please select a size!");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.warn("Please select a color!");
      return;
    }

    addToCart({
      ...product,
      selectedSize: selectedSize || "Free Size",
      selectedColor: selectedColor || "Default Color",
      quantity: 1,
    });

    toast.success(
      `${product.name} (${selectedColor || "Default"}, ${selectedSize || "Free Size"
      }) added to cart`
    );
  };

  return (
    <div
      className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg group relative bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Section */}
      <div className="w-full h-[300px] relative overflow-hidden bg-primary/10">
        {/* Wishlist Bubble */}
        <div
          className={`absolute w-[50%] h-[50%] transition-all duration-700 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${hovered ? "bottom-0 left-0" : "bottom-[-70%] left-[-70%]"
            }`}
          style={{ borderTop: "2px solid white", borderRight: "1px solid white", backdropFilter: "blur(2px)" }}
        >
          <div className="absolute top-2 right-2">
            <button
              onClick={() => addToWishlist(product)}
              className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-white hover:text-primary transition"
              title="Add to Wishlist"
            >
              <FaHeart size={16} />
            </button>
          </div>
        </div>

        {/* View Details Bubble */}
        <div
          className={`absolute w-[32%] h-[32%] transition-all duration-1000 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${hovered ? "bottom-0 left-0" : "bottom-[-70%] left-[-70%]"
            }`}
          style={{ borderTop: "2px solid white", borderRight: "1px solid white", backdropFilter: "blur(2px)" }}
        >
          <div className="absolute top-2 right-2">
            <Link to={`/designdetails/${product.product_id}`}>
              <button
                className="text-white bg-white/20 p-2 rounded-full cursor-pointer hover:bg-white hover:text-primary transition"
                title="View Details"
              >
                <FaEye size={16} />
              </button>
            </Link>
          </div>
        </div>

        {/* Images */}
        <img
          src={images?.[0]}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500 ${hovered ? "opacity-0" : "opacity-100"
            }`}
          loading="lazy"
          decoding="async"
        />
        <img
          src={images?.[1] || images?.[0]}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-contain p-4 transform transition-all duration-700 ${hovered ? "scale-110 opacity-100" : "scale-100 opacity-0"
            }`}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Color Selector */}
      {colors.length > 0 && (
        <div className="mt-2 flex justify-center gap-2">
          {colors.map((clr, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedColor(clr);
              }}
              className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${selectedColor === clr ? "border-primary scale-110" : "border-gray-300"
                }`}
              style={{ backgroundColor: clr }}
            ></button>
          ))}
        </div>
      )}

      {/* Size Selector */}
      {sizes.length > 0 && (
        <div className="mt-3 mb-3 flex justify-center gap-2 flex-wrap">
          {sizes.map((sz, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSize(sz);
              }}
              className={`px-3 py-1 rounded-full text-xs border transition ${selectedSize === sz
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-primary/10"
                }`}
            >
              {sz}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Info & Add to Cart */}
      <div className="bg-primary text-white flex flex-col gap-2 px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">{product.name}</h3>
            <h4 className="font-bold text-lg">
              MRP : <del>{product.mrp}</del> {product.salePrice}
            </h4>
            <p className="text-sm">⭐ {product.rating || "0.0"}</p>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="bg-white text-primary border font-semibold text-xs px-4 py-2 rounded-full shadow hover:bg-primary hover:text-white transition cursor-pointer w-full flex items-center justify-center gap-1"
        >
          <FaShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
};

export default Designs;
