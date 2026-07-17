import React, { useState, useEffect } from "react";
import api from "../api";
import { FaRulerCombined, FaWhatsapp } from "react-icons/fa";
import PageContainer from "../Components/PageContainer";
import Head from "../Components/Head";

const LogosPage = () => {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = logos.filter((l) =>
    l.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Our Logo Designs" subtitle="Logos" />

 

      {/* Content */}
      <PageContainer className="py-12">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
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
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col"
                  >
                    {/* Offer Badge */}
                    {hasOffer && (
                      <div className="absolute z-10 mt-3 ml-3">
                        <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                          {logo.offer}% OFF
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative bg-gray-50 flex items-center justify-center h-44 overflow-hidden border-b border-gray-100 p-4">
                      <img
                        src={logo.image}
                        alt={logo.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                        style={{ maxWidth: logo.width || "100%", maxHeight: logo.height || "100%" }}
                      />
                    </div>

                    {/* Details */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{logo.name}</h3>

                      {/* Dimensions */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                        <FaRulerCombined size={10} />
                        <span>{logo.width} × {logo.height} px</span>
                      </div>

                      {/* Description */}
                      {logo.description && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{logo.description}</p>
                      )}

                      {/* Pricing */}
                      {mrp > 0 && (
                        <div className="flex items-center gap-2 mb-3 mt-auto">
                          {hasOffer && (
                            <span className="text-xs text-gray-400 line-through">₹{mrp.toFixed(2)}</span>
                          )}
                          <span className="text-base font-extrabold text-green-700">
                            ₹{finalPrice.toFixed(2)}
                          </span>
                          {hasOffer && (
                            <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full">
                              Save ₹{(mrp - finalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <button 
                        onClick={() => {
                          const priceText = hasOffer 
                            ? `MRP: ₹${mrp.toFixed(2)}\nSale Price: ₹${finalPrice.toFixed(2)}` 
                            : `Price: ₹${mrp.toFixed(2)}`;
                          const message = encodeURIComponent(`Hello, I would like to place an order for the following logo design:\n\n*Design Name:* ${logo.name}\n${priceText}\n\n*Image:* ${logo.image}\n\nPlease let me know the next steps to complete this order.`);
                          window.open(`https://wa.me/916385381388?text=${message}`, "_blank");
                        }}
                        className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                      >
                        <FaWhatsapp size={15} />
                        Get This Design
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default LogosPage;
