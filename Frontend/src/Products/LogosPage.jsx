import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { FaRulerCombined, FaWhatsapp, FaShareAlt, FaEye, FaShoppingCart } from "react-icons/fa";
import PageContainer from "../Components/PageContainer";
import Head from "../Components/Head";
import { AuthContext } from "../Context/AuthContext";
import LogoCartSidebar from "./LogoCartSidebar";

const LogosPage = () => {
  const { logoCart, addToLogoCart } = useContext(AuthContext);
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clickedLogoId, setClickedLogoId] = useState(null);
  const [showLogoCart, setShowLogoCart] = useState(false);

  useEffect(() => {
    api
      .get("/logos")
      .then(({ data }) => {
        if (data.success) {
          setLogos(data.logos.filter((l) => l.status === 1));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleBubble = (logoId) => {
    setClickedLogoId((prevId) => (prevId === logoId ? null : logoId));
  };

  const filtered = logos.filter((l) =>
    l.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Our Logo Designs" subtitle="Logos" />

      {/* Logo Cart Sidebar */}
      <LogoCartSidebar show={showLogoCart} onClose={() => setShowLogoCart(false)} />

      {/* Content */}
      <PageContainer className="py-12">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Search Bar + Cart Button */}
            <div className="flex justify-end items-center gap-3 mb-8">
              {/* Cart Icon Button */}
              <button
                onClick={() => setShowLogoCart(true)}
                className="relative flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-full shadow hover:bg-primary/90 transition font-semibold text-sm cursor-pointer shrink-0"
              >
                <FaShoppingCart size={16} />
                <span className="hidden sm:inline">Logo Cart</span>
                {logoCart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {logoCart.length}
                  </span>
                )}
              </button>

              {/* Search */}
              <div className="relative w-full max-w-xs">
                <input
                  type="text"
                  placeholder="Search logos..."
                  className="w-full px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 1.5a7.5 7.5 0 010 15.15z" />
                </svg>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-xl font-medium">No designs found.</p>
                <p className="text-sm mt-1">Try a different search term.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-6">
                  Showing <span className="font-semibold text-gray-800">{filtered.length}</span> design{filtered.length !== 1 ? "s" : ""}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((logo) => {
                const hasOffer = parseFloat(logo.offer) > 0;
                const finalPrice = parseFloat(logo.offer_price || logo.mrp || 0);
                const mrp = parseFloat(logo.mrp || 0);

                return (
                  <div
                    key={logo.id}
                    onClick={() => toggleBubble(logo.id)}
                    className="group relative bg-white border text-center border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 p-4 flex flex-col"
                  >
                    {/* Offer Badge */}
                    {hasOffer && (
                      <div className="absolute z-20 top-2 left-2">
                        <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                          {logo.offer}% OFF
                        </span>
                      </div>
                    )}

                    {/* Image with Bubble Effects */}
                    <div className="relative w-full h-52 bg-primary/5 rounded-[30px] overflow-hidden shadow-lg transition-transform duration-1000 ease-in-out hover:scale-105 group">
                      
                      {/* WhatsApp Order Bubble */}
                      <div
                        className={`absolute w-[70%] h-[70%] transition-all duration-400 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedLogoId === logo.id
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
                              const priceText = hasOffer 
                                ? `MRP: ₹${mrp.toFixed(2)}\nSale Price: ₹${finalPrice.toFixed(2)}` 
                                : `Price: ₹${mrp.toFixed(2)}`;
                              const message = encodeURIComponent(`Hello, I would like to place an order for the following logo design:\n\n*Design Name:* ${logo.name}\n${priceText}\n\n*Image:* ${logo.image}\n\nPlease let me know the next steps to complete this order.`);
                              window.open(`https://wa.me/916385381388?text=${message}`, "_blank");
                            }}
                            className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-green-500 hover:text-white transition"
                            title="Order via WhatsApp"
                          >
                            <FaWhatsapp size={16} />
                          </button>
                        </div>
                      </div>

                      {/* WhatsApp Share Bubble */}
                      <div
                        className={`absolute w-[50%] h-[50%] transition-all duration-700 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedLogoId === logo.id
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
                              const priceText = hasOffer 
                                ? `MRP: ₹${mrp.toFixed(2)}\nSale Price: ₹${finalPrice.toFixed(2)}` 
                                : `Price: ₹${mrp.toFixed(2)}`;
                              const message = encodeURIComponent(`Check out this awesome design on Mauval Print!\n\n*Design Name:* ${logo.name}\n${priceText}\n\n*Image:* ${logo.image}`);
                              window.open(`https://wa.me/?text=${message}`, "_blank");
                            }}
                            className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-blue-500 hover:text-white transition"
                            title="Share on WhatsApp"
                          >
                            <FaShareAlt size={16} />
                          </button>
                        </div>
                      </div>

                      {/* View Image Bubble */}
                      <div
                        className={`absolute w-[32%] h-[32%] transition-all duration-1000 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${clickedLogoId === logo.id
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
                              window.open(logo.image, "_blank");
                            }}
                            className="text-white bg-white/20 p-2 rounded-full cursor-pointer hover:bg-white hover:text-primary transition"
                            title="View Full Image"
                          >
                            <FaEye size={16} />
                          </button>
                        </div>
                      </div>

                      <img
                        src={logo.image}
                        alt={logo.name}
                        className="relative z-5 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
                      />
                    </div>

                    {/* Product Info */}
                    <h3 className="text-lg font-semibold text-gray-800 truncate mt-3">
                      {logo.name}
                    </h3>

                    {/* Dimensions replacing Stars for Logos */}
                    <div className="flex items-center justify-center text-xs text-gray-400 my-1 gap-1">
                      <FaRulerCombined size={10} />
                      <span>{logo.width} × {logo.height} px</span>
                    </div>

                    {logo.description && (
                      <p className="text-xs text-gray-400 mb-1 line-clamp-1">{logo.description}</p>
                    )}

                    <p className="text-md font-bold text-primary mt-2">
                      MRP: <del className="text-gray-400 mr-1 font-normal">₹{mrp.toFixed(2)}</del> ₹{finalPrice.toFixed(2)}
                    </p>

                    {/* Optional: Save badge */}
                    {hasOffer && (
                      <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center justify-center">
                        <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                          Save ₹{(mrp - finalPrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {/* Add to Logo Cart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToLogoCart({
                          id: logo.id,
                          name: logo.name,
                          image: logo.image,
                          mrp: mrp,
                          offer: parseFloat(logo.offer || 0),
                          offer_price: finalPrice,
                          price: finalPrice,
                          width: logo.width,
                          height: logo.height,
                          description: logo.description || "",
                        });
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-2 rounded-xl hover:bg-primary/90 active:scale-95 transition cursor-pointer"
                    >
                      <FaShoppingCart size={13} />
                      Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default LogosPage;
