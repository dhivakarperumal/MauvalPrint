import React, { useEffect, useState, useMemo } from "react";
import { FaEye, FaEdit, FaTrash, FaFilter, FaStar, FaPlus, FaTh, FaList, FaSearch, FaBox, FaPaintBrush, FaCubes } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val) || (val && typeof val === "object")) return val;
  try { return JSON.parse(val); } catch (e) { return fallback; }
};

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [modalType, setModalType] = useState("");
  const [selectedProductLocal, setSelectedProductLocal] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxProductPrice, setMaxProductPrice] = useState(1000);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [selectedOfferRange, setSelectedOfferRange] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("All"); // All, Normal, Customise
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [productsPerPage, setProductsPerPage] = useState(10);

  useEffect(() => {
    const savedPage = localStorage.getItem("productsCurrentPage");
    if (savedPage && !isNaN(parseInt(savedPage, 10))) {
      setCurrentPage(parseInt(savedPage, 10));
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem("productsCurrentPage", currentPage);
  }, [currentPage]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products");
      const list = (data.products || []).map((p) => ({
        ...p,
        images: parseJSON(p.images, []),
        images_by_variant: parseJSON(p.images_by_variant, {}),
        color: parseJSON(p.color, []),
        size: parseJSON(p.size, []),
        fabric_gsm: parseJSON(p.fabric_gsm, []),
        washing_details: parseJSON(p.washing_details, []),
        stock_by_variant: parseJSON(p.stock_by_variant, {}),
        our_design: p.our_design === true || p.our_design === 1 || p.our_design === "1" || p.our_design === "true",
      }));

      // Sort by title (MP001, MP002 …)
      list.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, { numeric: true })
      );

      setProducts(list);

      const uniqueCategories = [...new Set(list.map((p) => p.category).filter(Boolean))];
      setCategoryOptions(uniqueCategories);

      const maxPrice = Math.max(...list.map((p) => Number(p.sale_price) || Number(p.mrp) || 0), 0);
      setMaxProductPrice(maxPrice || 1000);
      setPriceRange([0, maxPrice || 1000]);
    } catch (error) {
      toast.error("Failed to load products.");
      console.error(error);
    }
  };

  // ─── View ─────────────────────────────────────────────────────────────────
  const handleView = (product) => {
    setSelectedProductLocal(product);
    setModalType("view");
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = (product) => {
    navigate(`/admin/addproducts/${product.product_id}`, { state: { product } });
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const toastId = toast.loading("Deleting...");
      await api.delete(`/products/${productId}`);
      toast.success("Deleted!", { id: toastId });
      fetchProducts();
    } catch (error) {
      toast.error("Delete failed.");
      console.error(error);
    }
  };

  // ─── Import (Excel / JSON) ─────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      let jsonData = [];
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        jsonData = JSON.parse(text);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      }

      if (!window.confirm(`Import ${jsonData.length} products?`)) return;

      const toastId = toast.loading("Importing…");
      let successCount = 0;
      for (const item of jsonData) {
        try {
          const images = item.images ? (Array.isArray(item.images) ? item.images : item.images.split(",").map((s) => s.trim())) : [];
          const payload = {
            title: item.id || item.title || "",
            name: item.name || "",
            category: item.category || "",
            subcategory: item.subcategory || "",
            color: item.color ? (Array.isArray(item.color) ? item.color : item.color.split(",").map((s) => s.trim())) : [],
            size: item.size ? (Array.isArray(item.size) ? item.size : item.size.split(",").map((s) => s.trim())) : [],
            mrp: Number(item.mrp) || 0,
            sale_price: Number(item.salePrice || item.sale_price) || 0,
            offer: Number(item.offer) || 0,
            rating: Number(item.rating) || 0,
            description: item.description || "",
            fabric_details: item.fabricDetails || item.fabric_details || "",
            fabric_gsm: item.fabricGSM || item.fabric_gsm ? (Array.isArray(item.fabricGSM || item.fabric_gsm) ? (item.fabricGSM || item.fabric_gsm) : (item.fabricGSM || item.fabric_gsm).split(",").map(s => s.trim())) : [],
            washing_details: item.washingDetails || item.washing_details ? (Array.isArray(item.washingDetails || item.washing_details) ? (item.washingDetails || item.washing_details) : (item.washingDetails || item.washing_details).split(",").map(s => s.trim())) : [],
            keywords: item.keywords ? (Array.isArray(item.keywords) ? item.keywords : item.keywords.split(",").map(s => s.trim())) : [],
            keyword: item.keyword || "",
            notes: item.notes || "",
            customizable: item.customizable === true || item.customizable?.toString().toLowerCase() === "yes",
            our_design: item.ourDesign === true || item.our_design === true || item.ourDesign?.toString().toLowerCase() === "yes",
            images,
            stock: Number(item.stock) || 0,
          };
          await api.post("/products", payload);
          successCount++;
        } catch (err) {
          console.error("Row import error:", err);
        }
      }
      toast.success(`Imported ${successCount} / ${jsonData.length} products`, { id: toastId });
      fetchProducts();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to import products.");
    }
    // Reset file input
    e.target.value = null;
  };

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory.length === 0 || selectedCategory.includes(p.category);
    const productPrice = Number(p.sale_price) > 0 ? Number(p.sale_price) : Number(p.mrp);
    const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1];
    const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(Math.floor(Number(p.rating)));
    const matchesOffer = onlyOffers ? Number(p.offer) > 0 : true;
    let matchesOfferRange = true;
    if (selectedOfferRange) {
      const [min, max] = selectedOfferRange.split("-").map(Number);
      matchesOfferRange = Number(p.offer) >= min && Number(p.offer) <= max;
    }
    
    let matchesType = true;
    if (productTypeFilter === "Normal") {
      matchesType = p.our_design === true;
    } else if (productTypeFilter === "Customise") {
      matchesType = p.our_design === false;
    }

    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesOffer && matchesOfferRange && matchesType;
  });

  // ─── Pagination ───────────────────────────────────────────────────────────
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filteredProducts, currentPage, totalPages]);

  // ─── UI ───────────────────────────────────────────────────────────────────
  const isValidImageSrc = (src) => {
    if (!src || typeof src !== 'string') return false;
    return src.startsWith('http') || src.startsWith('/') || src.startsWith('data:');
  };

  const pickPrimaryImage = (p) => {
    // prefer first image from images[], then try images_by_variant (first entry), else null
    if (Array.isArray(p.images) && p.images.length > 0 && isValidImageSrc(p.images[0])) return p.images[0];
    if (p.images_by_variant && typeof p.images_by_variant === 'object') {
      const firstVariantKey = Object.keys(p.images_by_variant)[0];
      const arr = p.images_by_variant[firstVariantKey];
      if (Array.isArray(arr) && arr.length > 0 && isValidImageSrc(arr[0])) return arr[0];
    }
    return null;
  };
  return (
    <div className="p-3 sm:p-5 lg:p-8 bg-gray-50 min-h-screen relative">

      {/* Product Count Cards */}
      {(() => {
        const totalCount = products.length;
        const normalCount = products.filter(p => p.our_design === true).length;
        const customiseCount = products.filter(p => p.our_design === false).length;
        const normalPercent = totalCount > 0 ? Math.round((normalCount / totalCount) * 100) : 0;
        const customisePercent = totalCount > 0 ? Math.round((customiseCount / totalCount) * 100) : 0;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 mt-6 lg:grid-cols-4 gap-5 mb-8">
            {/* All Products */}
            <div
              onClick={() => setProductTypeFilter("All")}
              className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 ${
                productTypeFilter === "All"
                  ? "shadow-xl shadow-blue-500/25 ring-2 ring-blue-400/50"
                  : "shadow-md hover:shadow-xl"
              }`}
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">All Products</p>
                  <p className="text-white text-4xl font-black tracking-tight">{totalCount}</p>
                  <p className="text-blue-200 text-[11px] mt-2 font-medium">Total inventory items</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20 group-hover:rotate-12 transition-transform duration-500">
                  <FaCubes className="text-white text-2xl" />
                </div>
              </div>
              <div className="mt-4 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            {/* Normal Products */}
            <div
              onClick={() => setProductTypeFilter("Normal")}
              className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 ${
                productTypeFilter === "Normal"
                  ? "shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/50"
                  : "shadow-md hover:shadow-xl"
              }`}
              style={{ background: "linear-gradient(135deg, #065f46 0%, #10b981 50%, #34d399 100%)" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Normal</p>
                  <p className="text-white text-4xl font-black tracking-tight">{normalCount}</p>
                  <p className="text-emerald-200 text-[11px] mt-2 font-medium">{normalPercent}% of total</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20 group-hover:rotate-12 transition-transform duration-500">
                  <FaBox className="text-white text-2xl" />
                </div>
              </div>
              <div className="mt-4 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full transition-all duration-1000" style={{ width: `${normalPercent}%` }}></div>
              </div>
            </div>

            {/* Customise Products */}
            <div
              onClick={() => setProductTypeFilter("Customise")}
              className={`cursor-pointer group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 ${
                productTypeFilter === "Customise"
                  ? "shadow-xl shadow-purple-500/25 ring-2 ring-purple-400/50"
                  : "shadow-md hover:shadow-xl"
              }`}
              style={{ background: "linear-gradient(135deg, #581c87 0%, #a855f7 50%, #c084fc 100%)" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Customise</p>
                  <p className="text-white text-4xl font-black tracking-tight">{customiseCount}</p>
                  <p className="text-purple-200 text-[11px] mt-2 font-medium">{customisePercent}% of total</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20 group-hover:rotate-12 transition-transform duration-500">
                  <FaPaintBrush className="text-white text-2xl" />
                </div>
              </div>
              <div className="mt-4 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full transition-all duration-1000" style={{ width: `${customisePercent}%` }}></div>
              </div>
            </div>

            {/* Filtered Results */}
            <div
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 shadow-md hover:shadow-xl"
              style={{ background: "linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #fbbf24 100%)" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Filtered</p>
                  <p className="text-white text-4xl font-black tracking-tight">{filteredProducts.length}</p>
                  <p className="text-amber-200 text-[11px] mt-2 font-medium">Current results</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20 group-hover:rotate-12 transition-transform duration-500">
                  <FaFilter className="text-white text-2xl" />
                </div>
              </div>
              <div className="mt-4 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full transition-all duration-1000" style={{ width: `${totalCount > 0 ? Math.round((filteredProducts.length / totalCount) * 100) : 0}%` }}></div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Search & Actions Top Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Right side controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:ml-auto">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-2 rounded-md transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaList size={14} />
              </button>
              <button
                onClick={() => setViewMode("card")}
                title="Card View"
                className={`p-2 rounded-md transition-all cursor-pointer ${
                  viewMode === "card"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaTh size={14} />
              </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-gray-200"></div>

            {/* Action Buttons */}
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm cursor-pointer mb-0">
              <FaPlus /> Import
              <input
                type="file"
                accept=".xlsx,.xls,.json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <button
              onClick={() => navigate("/admin/addproducts")}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
            >
              <FaPlus /> Add Products
            </button>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                showFilter 
                  ? "bg-blue-100 text-blue-900 border border-blue-200 shadow-inner" 
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 shadow-sm"
              }`}
            >
              <FaFilter /> Filter
            </button>
          </div>
        </div>
      </div>

     

      {/* Product Type Tabs */}
      <div className="flex gap-2 mt-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
        {["All", "Normal", "Customise"].map((type) => (
          <button
            key={type}
            onClick={() => setProductTypeFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              productTypeFilter === type
                ? "bg-blue-100 text-blue-900 shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {type === "All" ? "All Products" : type === "Normal" ? "Normal Products" : "Customise Products"}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        {/* Filter Panel */}
        {showFilter && (
          <div className="w-64 bg-white p-4 rounded shadow space-y-4 flex-shrink-0">
            <div className="space-y-2">
              <p className="font-semibold">Categories:</p>
              {categoryOptions.map((cat, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={cat}
                    checked={selectedCategory.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCategory([...selectedCategory, cat]);
                      else setSelectedCategory(selectedCategory.filter((c) => c !== cat));
                    }}
                    className="h-4 w-4 cursor-pointer text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">{cat}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</p>
              <input
                type="range"
                min={0}
                max={maxProductPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Rating:</p>
              {[5, 4, 3, 2, 1].map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={r}
                    checked={selectedRatings.includes(r)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedRatings([...selectedRatings, r]);
                      else setSelectedRatings(selectedRatings.filter((x) => x !== r));
                    }}
                    className="h-4 w-4 cursor-pointer text-blue-600 border-gray-300 rounded"
                  />
                  <span>{r} <FaStar className="inline text-yellow-500" /></span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Offer Range:</p>
              {["10-30", "30-40", "50-80"].map((range) => (
                <label key={range} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="offerRange"
                    value={range}
                    checked={selectedOfferRange === range}
                    onChange={(e) => setSelectedOfferRange(e.target.value)}
                    className="h-4 w-4 cursor-pointer"
                  />
                  <span>{range}%</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory([]);
                  setPriceRange([0, maxProductPrice]);
                  setSelectedRatings([]);
                  setOnlyOffers(false);
                  setSelectedOfferRange("");
                }}
                className="w-full cursor-pointer bg-gray-200 rounded py-2 hover:bg-gray-300"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Product Grid / Table */}
        <div className="flex-1">
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {currentProducts.map((p) => (
                <div key={p.product_id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
                  {/* Image Section */}
                  <div className="relative h-40 sm:h-48 lg:h-56 w-full overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={pickPrimaryImage(p) || "https://via.placeholder.com/150"}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {p.our_design ? (
                        <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm w-max">
                          Normal
                        </span>
                      ) : (
                        <span className="bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm w-max">
                          Customise
                        </span>
                      )}
                      {Number(p.offer) > 0 && (
                        <span className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm w-max">
                          {p.offer}% OFF
                        </span>
                      )}
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                      <button onClick={() => handleView(p)} className="bg-white text-gray-800 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 shadow-lg" title="View">
                        <FaEye size={18} />
                      </button>
                      <button onClick={() => handleEdit(p)} className="bg-white text-gray-800 p-3 rounded-full hover:bg-yellow-500 hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75 shadow-lg" title="Edit">
                        <FaEdit size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.product_id)} className="bg-white text-gray-800 p-3 rounded-full hover:bg-red-600 hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150 shadow-lg" title="Delete">
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 sm:p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.category || "Uncategorized"}</p>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">ID: {p.title || p.product_id}</span>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 text-xs sm:text-sm leading-snug mb-2 line-clamp-2" title={p.name}>
                      {p.name}
                    </h3>
                    
                    <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-50">
                      <div>
                        {Number(p.offer) > 0 || Number(p.mrp) > Number(p.sale_price) ? (
                          <p className="text-[11px] text-gray-400 line-through mb-0.5 font-medium">₹{p.mrp}</p>
                        ) : (
                          <p className="text-[11px] text-transparent mb-0.5">-</p>
                        )}
                        <p className="text-base sm:text-lg font-extrabold text-blue-900 tracking-tight">₹{p.sale_price}</p>
                      </div>
                      
                      {/* Rating / Stock Indicator */}
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
                          <FaStar className="text-yellow-400 text-[10px]" />
                          <span className="text-[11px] font-bold text-yellow-700">{p.rating || "0.0"}</span>
                        </div>
                        {p.stock <= 5 ? (
                          <span className="text-[10px] font-bold text-red-500 tracking-wide">ONLY {p.stock} LEFT</span>
                        ) : (
                          <span className="text-[10px] font-bold text-green-600 tracking-wide">IN STOCK</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="w-full text-left border-collapse">
               <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="p-4 border-b border-gray-200 font-semibold w-16 text-center">S No</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Image</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Name</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Category</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Price</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Stock</th>
                    <th className="p-4 border-b border-gray-200 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((p, index) => (
                    <tr key={p.product_id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                      <td className="p-4 text-center font-medium text-gray-500">
                        {indexOfFirst + index + 1}
                      </td>
                      <td className="p-4">
                        <img
                          src={pickPrimaryImage(p) || "https://via.placeholder.com/150"}
                          alt={p.name}
                          className="w-16 h-16 object-cover rounded-md border border-gray-200"
                        />
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 block w-max mb-1">
                          ID: {p.title || p.product_id}
                        </span>
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {p.category || "Uncategorized"}
                        <div className="mt-1">
                          {p.our_design ? (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Normal</span>
                          ) : (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Customise</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          {Number(p.offer) > 0 || Number(p.mrp) > Number(p.sale_price) ? (
                            <span className="text-[11px] text-gray-400 line-through">₹{p.mrp}</span>
                          ) : null}
                          <span className="font-bold text-blue-900">₹{p.sale_price}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {p.stock <= 5 ? (
                          <span className="text-xs font-bold text-red-500">{p.stock} Left</span>
                        ) : (
                          <span className="text-xs font-bold text-green-600">{p.stock}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleView(p)} className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors" title="View">
                            <FaEye />
                          </button>
                          <button onClick={() => handleEdit(p)} className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-yellow-500 hover:text-white transition-colors" title="Edit">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDelete(p.product_id)} className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-red-600 hover:text-white transition-colors" title="Delete">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col items-center gap-3 mt-8 py-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">Rows per page:</span>
              <select
                value={productsPerPage}
                onChange={(e) => {
                  setProductsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md text-sm py-1 px-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-2 justify-center">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-full px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100 transition-colors"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, idx) => {
              const page = idx + 1;
              const shouldShow =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 2;

              if (!shouldShow) {
                if (
                  (page === 2 && currentPage > 4) ||
                  (page === totalPages - 1 && currentPage < totalPages - 3)
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-400 font-medium">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 min-w-[2.5rem] rounded-full border font-medium transition-colors ${
                    currentPage === page
                      ? "bg-gray-900 text-white border-gray-900 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100 transition-colors"
            >
                Next →
              </button>
            </div>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span> • Showing {currentProducts.length} of {filteredProducts.length} products
          </p>
        </div>
      )}

      {/* View Modal */}
      {modalType === "view" && selectedProductLocal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-4xl relative overflow-y-auto max-h-[100vh]">
            <button
              onClick={() => { setModalType(""); setSelectedProductLocal(null); }}
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-blue-900 mb-4">View Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {selectedProductLocal.title}</p>
                <p><strong>Name:</strong> {selectedProductLocal.name}</p>
                <p><strong>Category:</strong> {selectedProductLocal.category}</p>
                <p><strong>Subcategory:</strong> {selectedProductLocal.subcategory}</p>
                <p><strong>MRP:</strong> ₹{selectedProductLocal.mrp}</p>
                <p><strong>Sale Price:</strong> ₹{selectedProductLocal.sale_price}</p>
                <p><strong>Offer:</strong> {selectedProductLocal.offer}%</p>
                <p><strong>Rating:</strong> {selectedProductLocal.rating}</p>
                <p><strong>Stock:</strong> {selectedProductLocal.stock}</p>
                <p><strong>Description:</strong> {selectedProductLocal.description}</p>
                <p><strong>Fabric:</strong> {selectedProductLocal.fabric_details}</p>
                <p><strong>Colors:</strong> {(selectedProductLocal.color || []).join(", ")}</p>
                <p><strong>Sizes:</strong> {(selectedProductLocal.size || []).join(", ")}</p>
                <p><strong>Our Design:</strong> {selectedProductLocal.our_design ? "Yes" : "No"}</p>
              </div>
              <div>
                <strong>Images:</strong>
                <div className="mt-2 space-y-3">
                  {/* General images */}
                  {Array.isArray(selectedProductLocal.images) && selectedProductLocal.images.filter(isValidImageSrc).length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-2">General</div>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProductLocal.images.filter(isValidImageSrc).map((img, idx) => (
                          <img key={`g-${idx}`} src={img} alt={`general-${idx}`} className="w-full h-32 object-cover rounded border" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variant images grouped by variant key */}
                  {selectedProductLocal.images_by_variant && Object.keys(selectedProductLocal.images_by_variant).length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Variant Images</div>
                      <div className="space-y-4">
                        {Object.entries(selectedProductLocal.images_by_variant).map(([variantKey, imgs]) => {
                          const valid = Array.isArray(imgs) ? imgs.filter(isValidImageSrc) : [];
                          if (valid.length === 0) return null;
                          return (
                            <div key={variantKey}>
                              <div className="text-xs text-gray-600 mb-1">{variantKey}</div>
                              <div className="grid grid-cols-2 gap-2">
                                {valid.map((img, idx) => (
                                  <img key={`${variantKey}-${idx}`} src={img} alt={`${variantKey}-${idx}`} className="w-full h-32 object-cover rounded border" />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Placeholder when no images at all */}
                  {((!Array.isArray(selectedProductLocal.images) || selectedProductLocal.images.filter(isValidImageSrc).length === 0) && (!selectedProductLocal.images_by_variant || Object.values(selectedProductLocal.images_by_variant).flat().filter(isValidImageSrc).length === 0)) && (
                    <img src="https://via.placeholder.com/300x200?text=No+Image" alt="no-image" className="w-full h-32 object-cover rounded border" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
