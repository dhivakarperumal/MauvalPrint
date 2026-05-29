import React, { useEffect, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaFilter, FaStar, FaPlus } from "react-icons/fa";
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
  const [currentPage, setCurrentPage] = useState(1);
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
    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesOffer && matchesOfferRange;
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
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4 md:gap-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Product List</h2>
          <p className="text-gray-600">Manage your uploaded product designs here.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
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

      <div className="flex gap-4 mt-10">
        {/* Filter Panel */}
        {showFilter && (
          <div className="w-64 bg-white p-4 rounded shadow space-y-4 flex-shrink-0">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

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

        {/* Product Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentProducts.map((p) => (
            <div key={p.product_id} className="bg-white rounded shadow p-4 flex flex-col gap-2">
              <img
                src={p.images?.[0] || "https://via.placeholder.com/150"}
                alt={p.name}
                className="w-full h-32 object-cover rounded"
              />
              <p className="font-semibold text-gray-800">{p.name}</p>
              <p className="text-sm text-gray-600">ID: {p.product_id}</p>
              <p className="text-sm text-gray-600">Category: {p.category}</p>
              <div className="flex justify-between">
                <p className="text-sm text-gray-600 line-through">MRP ₹{p.mrp}</p>
                <p className="text-sm text-gray-600 font-bold">Selling ₹{p.sale_price}</p>
              </div>
              {Number(p.offer) > 0 && (
                <p className="text-sm text-red-600 font-semibold">Offer: {p.offer}%</p>
              )}
              <div className="flex justify-between gap-2 mt-2">
                <button
                  onClick={() => handleView(p)}
                  className="border cursor-pointer border-gray-300 px-2 py-2 rounded-full hover:text-blue-600 text-center"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => handleEdit(p)}
                  className="border cursor-pointer border-gray-300 px-2 py-2 rounded-full hover:text-yellow-600 text-center"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(p.product_id)}
                  className="border cursor-pointer border-gray-300 px-2 py-2 rounded-full hover:text-red-600 text-center"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}

          {currentProducts.length === 0 && (
            <div className="col-span-4 text-center py-12 text-gray-500">
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
