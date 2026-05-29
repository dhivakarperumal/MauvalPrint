import React, { useState, useRef, useEffect, useContext } from "react";
import { FaSearch } from "react-icons/fa";
import { AuthContext } from "../Context/AuthContext";

export default function Search({ placeholder = "Search", onSelect }) {
  const { products } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products by name
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-xl " ref={wrapperRef}>
      <div className="flex items-center rounded-md bg-[#f4f5ec] px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-cyan-400">
        <FaSearch className="mr-3 text-gray-700" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-gray-800 placeholder-gray-600 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-xl font-light text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full rounded-md bg-[#f4f5ec] shadow-lg z-50">
          <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Product Suggestions
          </p>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.map((product) => (
              <li
                key={product.id}
                className="cursor-pointer text-primary px-4 py-2 hover:bg-[#eaeadd]"
                onMouseDown={() => {
                  setQuery("");
                  setIsOpen(false);
                  onSelect?.(product); // 🔥 trigger the navigation
                }}
              >
                {product.name}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-4 text-center text-gray-500">
                No matches
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}