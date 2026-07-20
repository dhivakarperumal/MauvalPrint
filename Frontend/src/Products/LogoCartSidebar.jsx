import React, { useContext } from "react";
import { FaPlus, FaMinus, FaTimes, FaShoppingCart, FaWhatsapp } from "react-icons/fa";
import { BsFillTrashFill } from "react-icons/bs";
import { AuthContext } from "../Context/AuthContext";
import { Link } from "react-router-dom";

const LogoCartSidebar = ({ show, onClose }) => {
  const { logoCart, removeFromLogoCart, updateLogoCartQuantity, clearLogoCart } =
    useContext(AuthContext);

  const subtotal = logoCart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shareOnWhatsApp = () => {
    if (logoCart.length === 0) return;
    const lines = logoCart.map((item) => {
      const hasOffer = item.offer > 0;
      const priceText = hasOffer
        ? `MRP: ₹${item.mrp.toFixed(2)} → Sale: ₹${item.price.toFixed(2)} (${item.offer}% OFF)`
        : `Price: ₹${item.price.toFixed(2)}`;
      return `▪ *${item.name}* (${item.width}×${item.height}px)\n  Qty: ${item.quantity} | ${priceText}\n  Subtotal: ₹${(item.price * item.quantity).toFixed(2)}`;
    });
    const message = [
      "Hello! I would like to order the following logos from *Mauval Print*:",
      "",
      ...lines,
      "",
      `*Total: ₹${subtotal.toFixed(2)}* (Shipping: Free)`,
      "",
      "Please let me know the next steps. Thank you!",
    ].join("\n");
    window.open(`https://wa.me/916385381388?text=${encodeURIComponent(message)}`, "_blank");
    clearLogoCart();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      {/* Sidebar */}
      <div
        className="relative h-full w-full max-w-sm bg-white shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white text-primary">
          <div className="flex items-center gap-2">
            <FaShoppingCart size={18} />
            <h2 className="text-lg font-bold">Logo Cart</h2>
            {logoCart.length > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {logoCart.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="hover:opacity-60 cursor-pointer text-primary transition"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {logoCart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center mt-16 text-gray-500">
              <FaShoppingCart size={56} className="text-primary/30 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">
                Your logo cart is empty
              </h3>
              <p className="text-sm mt-1 text-gray-400">
                Browse logos and add them here.
              </p>
              <Link
                to="/logos"
                onClick={onClose}
                className="mt-6 inline-block px-5 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition text-sm font-semibold"
              >
                Browse Logos
              </Link>
            </div>
          ) : (
            logoCart.map((item) => {
              const hasOffer = item.offer > 0;
              const mrp = item.mrp;
              const finalPrice = item.price;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-contain border rounded-lg shrink-0 bg-gray-50"
                    loading="lazy"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-800 truncate">
                      {item.name}
                    </h3>
                    {item.width && item.height && (
                      <p className="text-xs text-gray-400">
                        {item.width} × {item.height} px
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      {hasOffer && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{mrp.toFixed(2)}
                        </span>
                      )}
                      <span className="text-sm font-bold text-primary">
                        ₹{finalPrice.toFixed(2)}
                      </span>
                      {hasOffer && (
                        <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full">
                          {item.offer}% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">
                      ₹{(finalPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          item.quantity > 1 &&
                          updateLogoCartQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1 rounded-full bg-indigo-100 hover:bg-indigo-200 text-primary cursor-pointer disabled:opacity-40"
                        disabled={item.quantity <= 1}
                      >
                        <FaMinus size={9} />
                      </button>
                      <span className="mx-1 text-sm font-medium text-gray-800 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateLogoCartQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1 rounded-full bg-indigo-100 hover:bg-indigo-200 text-primary cursor-pointer"
                      >
                        <FaPlus size={9} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromLogoCart(item.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer transition"
                      title="Remove"
                    >
                      <BsFillTrashFill size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {logoCart.length > 0 && (
          <div className="p-4 border-t bg-white">
            <div className="flex justify-between text-base mb-1 text-gray-700">
              <span>Subtotal</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm mb-3">
              <span>Shipping</span>
              <span className="text-green-600 font-semibold">Free</span>
            </div>
            <hr className="my-2 border-gray-200" />
            <div className="flex justify-between font-bold text-xl text-black mb-4">
              <span>Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {/* WhatsApp Share */}
            <button
              onClick={shareOnWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-lg font-semibold hover:bg-green-600 active:scale-95 transition cursor-pointer text-sm mb-2"
            >
              <FaWhatsapp size={18} />
              Share Order on WhatsApp
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default LogoCartSidebar;
