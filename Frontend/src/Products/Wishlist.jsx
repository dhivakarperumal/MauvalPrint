import React, { useContext, useState } from "react";
import {
  FaTimes,
  FaShoppingCart,
  FaTrash,
  FaHeart,
} from "react-icons/fa";
import { AuthContext } from "../Context/AuthContext";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const Wishlist = ({ show, onClose }) => {
  const { wishlist, removeFromWishlist, addToCart, clearWishlist } = useContext(AuthContext);
  const [cardSize, setCardSize] = useState({});

  const handleAddAllToCart = () => {
    if (!wishlist.length) return toast.info("Wishlist is empty");

    const allSelected = wishlist.every((item) => cardSize[item.id]);

    if (!allSelected) {
      toast.warn("Please select a size for all products to add to cart");
      return;
    }

    wishlist.forEach((item) => {
      const selectedSize = cardSize[item.id];
      addToCart({ ...item, selectedSize });
    });

    toast.success("All wishlist items added to cart");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      {/* Sidebar */}
      <div
        className="relative h-full w-full max-w-sm bg-white shadow-lg transform transition-transform duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Wishlist</h2>
          <button
            onClick={onClose}
            className="text-primary hover:text-primary/90 cursor-pointer"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center mt-16">
              <FaHeart className="text-[80px] text-[#283b53] opacity-30 mb-4" />
              <h3 className="text-xl font-semibold text-[#283b53] mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-gray-500 max-w-sm">
                Looks like you haven’t added anything to your favorites yet. Start exploring and add your favorite items!
              </p>
              <Link
                to="/products"
                onClick={onClose}
                className="mt-6 inline-block px-5 py-2 bg-[#283b53] text-white rounded-md hover:bg-[#1e2e40] transition"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={`${item.id}`}
                className="flex items-center gap-3 mb-4 border-b border-primary/50 pb-4"
              >
                <img
                  src={item.image?.[0] || item.images?.[0]}
                  alt={item.name}
                  className="w-16 h-16 object-contain border rounded-md p-1"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-800">
                    {item.name}
                  </h3>
                  <p className="font-bold text-md text-primary">
                    ₹{item.price?.toFixed(2)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.size?.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setCardSize((prev) => ({ ...prev, [item.id]: sz }))}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          cardSize[item.id] === sz
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => {
                      const selectedSize = cardSize[item.id];
                      if (!selectedSize) {
                        return toast.warn("Select a size before adding to cart");
                      }
                      addToCart({ ...item, selectedSize });
                    }}
                    className="bg-white border rounded p-1 shadow text-primary cursor-pointer"
                    title="Add to Cart"
                  >
                    <FaShoppingCart size={14} />
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="bg-white border rounded p-1 shadow text-primary cursor-pointer"
                    title="Remove"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <button
                onClick={handleAddAllToCart}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-md font-semibold cursor-pointer"
              >
                Add All to Cart
              </button>
              <button
                onClick={clearWishlist}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-semibold cursor-pointer"
              >
                Clear Wishlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
