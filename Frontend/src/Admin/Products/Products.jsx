import React, { useEffect, useState, useMemo } from "react";
import { FaEye, FaEdit, FaTrash, FaFilter, FaStar, FaPlus, FaTh, FaList, FaSearch, FaBox, FaPaintBrush, FaCubes } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val) || (val && typeof val === "object")) return val;
  try { return JSON.parse(val); } catch (e) { return fallback; }
};

const ProductList = ({ setSelectedProduct, setActiveTab }) => {
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
  const [viewMode, setViewMode] = useState("card");
  const productsPerPage = 40;

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
    setSelectedProduct(product);
    setActiveTab("addProduct");
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

  // ─── Excel Import ─────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (!window.confirm(`Import ${jsonData.length} products?`)) return;

      const toastId = toast.loading("Importing…");
      let successCount = 0;
      for (const item of jsonData) {
        try {
          const images = item.images ? item.images.split(",").map((s) => s.trim()) : [];
          const payload = {
            title: item.id || item.title || "",
            name: item.name || "",
            category: item.category || "",
            subcategory: item.subcategory || "",
            color: item.color ? item.color.split(",").map((s) => s.trim()) : [],
            size: item.size ? item.size.split(",").map((s) => s.trim()) : [],
            mrp: Number(item.mrp) || 0,
            sale_price: Number(item.salePrice || item.sale_price) || 0,
            offer: Number(item.offer) || 0,
            rating: Number(item.rating) || 0,
            description: item.description || "",
            fabric_details: item.fabricDetails || item.fabric_details || "",
            our_design: item.ourDesign?.toString().toLowerCase() === "yes",
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
      console.error("Excel upload error:", err);
      toast.error("Failed to import products.");
    }
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
  return (
    <div className="p-4 bg-gray-50 min-h-screen relative">

       {/* Product Count Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setProductTypeFilter("All")}
          className={`cursor-pointer rounded-xl p-4 flex items-center gap-4 border transition-all duration-300 ${
            productTypeFilter === "All"
              ? "bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20"
              : "bg-white text-gray-800 border-gray-200 hover:shadow-md hover:border-blue-200"
          }`}
        >
          <div className={`p-3 rounded-lg ${productTypeFilter === "All" ? "bg-white/20" : "bg-blue-50"}`}>
            <FaCubes className={`text-xl ${productTypeFilter === "All" ? "text-white" : "text-blue-600"}`} />
          </div>
          <div>
            <p className={`text-2xl font-extrabold ${productTypeFilter === "All" ? "text-white" : "text-blue-900"}`}>{products.length}</p>
            <p className={`text-xs font-semibold uppercase tracking-wider ${productTypeFilter === "All" ? "text-blue-100" : "text-gray-500"}`}>All Products</p>
          </div>
        </div>

        <div
          onClick={() => setProductTypeFilter("Normal")}
          className={`cursor-pointer rounded-xl p-4 flex items-center gap-4 border transition-all duration-300 ${
            productTypeFilter === "Normal"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
              : "bg-white text-gray-800 border-gray-200 hover:shadow-md hover:border-emerald-200"
          }`}
        >
          <div className={`p-3 rounded-lg ${productTypeFilter === "Normal" ? "bg-white/20" : "bg-emerald-50"}`}>
            <FaBox className={`text-xl ${productTypeFilter === "Normal" ? "text-white" : "text-emerald-600"}`} />
          </div>
          <div>
            <p className={`text-2xl font-extrabold ${productTypeFilter === "Normal" ? "text-white" : "text-emerald-700"}`}>{products.filter(p => p.our_design === true).length}</p>
            <p className={`text-xs font-semibold uppercase tracking-wider ${productTypeFilter === "Normal" ? "text-emerald-100" : "text-gray-500"}`}>Normal</p>
          </div>
        </div>

        <div
          onClick={() => setProductTypeFilter("Customise")}
          className={`cursor-pointer rounded-xl p-4 flex items-center gap-4 border transition-all duration-300 ${
            productTypeFilter === "Customise"
              ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20"
              : "bg-white text-gray-800 border-gray-200 hover:shadow-md hover:border-purple-200"
          }`}
        >
          <div className={`p-3 rounded-lg ${productTypeFilter === "Customise" ? "bg-white/20" : "bg-purple-50"}`}>
            <FaPaintBrush className={`text-xl ${productTypeFilter === "Customise" ? "text-white" : "text-purple-600"}`} />
          </div>
          <div>
            <p className={`text-2xl font-extrabold ${productTypeFilter === "Customise" ? "text-white" : "text-purple-700"}`}>{products.filter(p => p.our_design === false).length}</p>
            <p className={`text-xs font-semibold uppercase tracking-wider ${productTypeFilter === "Customise" ? "text-purple-100" : "text-gray-500"}`}>Customise</p>
          </div>
        </div>

        <div
          className="bg-white text-gray-800 border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:border-amber-200 transition-all duration-300"
        >
          <div className="p-3 rounded-lg bg-amber-50">
            <FaStar className="text-xl text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-600">{filteredProducts.length}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filtered Results</p>
          </div>
        </div>
      </div>
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        

        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
          />
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg mr-2">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-md transition-all duration-300 ${viewMode === "card" ? "bg-white shadow text-blue-900" : "text-gray-500 hover:text-gray-700"}`}
              title="Card View"
            >
              <FaTh size={18} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-all duration-300 ${viewMode === "table" ? "bg-white shadow text-blue-900" : "text-gray-500 hover:text-gray-700"}`}
              title="Table View"
            >
              <FaList size={18} />
            </button>
          </div>

          <button
            onClick={() => setActiveTab("addProduct")}
            className="px-4 cursor-pointer md:px-6 bg-blue-900 text-white rounded py-2 flex items-center gap-2 hover:bg-blue-800"
          >
            <FaPlus /> Add Products
          </button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="px-4 cursor-pointer md:px-6 bg-blue-900 text-white rounded py-2 flex items-center gap-2 hover:bg-blue-800"
          >
            <FaFilter /> Filter
          </button>
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
                className="flex-1 cursor-pointer bg-gray-200 rounded py-2 hover:bg-gray-300"
              >
                Reset
              </button>
              <label className="flex-1 cursor-pointer bg-green-600 text-white rounded py-2 text-center hover:bg-green-700">
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        )}

        {/* Product Grid / Table */}
        <div className="flex-1">
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {currentProducts.map((p) => (
                <div key={p.product_id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
                  {/* Image Section */}
                  <div className="relative h-56 w-full overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={p.images?.[0] || "https://via.placeholder.com/150"}
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
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
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.category || "Uncategorized"}</p>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">ID: {p.title || p.product_id}</span>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 text-sm leading-snug mb-3 line-clamp-2" title={p.name}>
                      {p.name}
                    </h3>
                    
                    <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-50">
                      <div>
                        {Number(p.offer) > 0 || Number(p.mrp) > Number(p.sale_price) ? (
                          <p className="text-[11px] text-gray-400 line-through mb-0.5 font-medium">₹{p.mrp}</p>
                        ) : (
                          <p className="text-[11px] text-transparent mb-0.5">-</p>
                        )}
                        <p className="text-lg font-extrabold text-blue-900 tracking-tight">₹{p.sale_price}</p>
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
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-4 border-b border-gray-200 font-semibold">Image</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">ID / Name</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Category</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Price</th>
                    <th className="p-4 border-b border-gray-200 font-semibold">Stock</th>
                    <th className="p-4 border-b border-gray-200 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((p) => (
                    <tr key={p.product_id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                      <td className="p-4">
                        <img
                          src={p.images?.[0] || "https://via.placeholder.com/150"}
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 cursor-pointer rounded border border-gray-300 ${
                currentPage === idx + 1 ? "bg-gray-900 text-white" : "bg-white"
              }`}
            >
              {idx + 1}
            </button>
          ))}
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(selectedProductLocal.images || []).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`product-${idx}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                  ))}
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
