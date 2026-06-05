import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaSearch, FaTh, FaList, FaPlus, FaEdit, FaBoxOpen } from "react-icons/fa";
import AddStock from "./AddStock"; // We will import and render this in a modal

const StockDetails = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  const parseImageArray = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(Boolean);
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [images].filter(Boolean);
      } catch {
        return [images].filter(Boolean);
      }
    }
    return [];
  };

  const getVariantImage = (imagesByVariant) => {
    if (!imagesByVariant) return "";
    let parsed = imagesByVariant;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = {};
      }
    }
    if (typeof parsed !== "object" || !parsed) return "";
    const flat = Object.values(parsed).flat().filter(Boolean);
    return flat[0] || "";
  };

  const getProductImage = (product) => {
    if (product.image) return product.image;
    if (product.image_url) return product.image_url;

    const images = parseImageArray(product.images);
    if (images.length > 0) return images[0];

    const variantImage = getVariantImage(product.images_by_variant || product.image_varient || product.imagesByVariant);
    if (variantImage) return variantImage;

    return "";
  };

  const fetchStock = async () => {
    try {
      const { data } = await api.get("/products");
      const productList = [];

      (data.products || []).forEach((product) => {
        let stockByVariant = product.stock_by_variant || {};
        if (typeof stockByVariant === "string") {
          try {
            stockByVariant = JSON.parse(stockByVariant);
          } catch {
            stockByVariant = {};
          }
        }

        const variants = [];
        let totalStock = 0;

        Object.entries(stockByVariant).forEach(([key, qty]) => {
          const [color, size] = key.split("-");
          variants.push({ key, color, size, qty });
          totalStock += qty || 0;
        });

        productList.push({
          productId: product.product_id || product.id || "",
          name: product.name || "",
          image: getProductImage(product),
          variants,
          totalStock,
        });
      });

      productList.sort((a, b) =>
        a.productId.localeCompare(b.productId, undefined, { numeric: true })
      );

      setProducts(productList);
    } catch (error) {
      toast.error("Failed to fetch stock");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.productId?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleExpand = (productId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleEdit = (product, variant) => {
    setSelectedVariant({
      ...variant,
      productId: product.productId,
      name: product.name,
    });
    setShowEditModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedVariant((prev) => ({
      ...prev,
      [name]: name === "qty" ? parseInt(value) || 0 : value,
    }));
  };

  const handleUpdate = async () => {
    const { productId, key, qty } = selectedVariant;

    try {
      await api.put(`/products/${productId}/stock`, {
        variant: key,
        quantity: qty,
      });

      toast.success("Stock updated");
      setShowEditModal(false);
      fetchStock(); // refresh stock list
    } catch (error) {
      toast.error("Failed to update stock");
      console.error(error);
    }
  };

  return (
    <div className="p-8 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Stock Details</h2>
        <p className="text-sm text-gray-500 mt-1">
          View and manage variant-wise stock for all products.
        </p>
      </div>

      {/* Top Bar: Search, View Toggles, Add Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          
          {/* Search */}
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap ml-auto">
            {/* View Toggles */}
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

            <div className="hidden md:block w-px h-8 bg-gray-200"></div>

            {/* Add New Stock Button */}
            <button
              onClick={() => setShowAddStockModal(true)}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
            >
              <FaPlus size={12} /> Add New Stock
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-4 w-16 text-center">S No</th>
                <th className="px-4 py-4 w-24 text-center">Image</th>
                <th className="px-4 py-4">Product ID</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                paginatedProducts.map((product, index) => (
                  <React.Fragment key={product.productId}>
                    {/* Main Row */}
                    <tr className="border-t border-gray-200 bg-white hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-4 text-center font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=No+Image"; }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-4 cursor-pointer font-bold text-blue-700 hover:underline"
                        onClick={() => toggleExpand(product.productId)}
                        title="Click to view variants"
                      >
                        {product.productId}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-700">{product.name}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.totalStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.totalStock} items
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedRows.has(product.productId) && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan="5" className="px-4 py-4 shadow-inner">
                          {product.variants.length > 0 ? (
                            <table className="w-full text-sm text-left border border-gray-200 rounded overflow-hidden">
                              <thead className="bg-gray-200 text-gray-700">
                                <tr>
                                  <th className="p-3">Color</th>
                                  <th className="p-3">Size</th>
                                  <th className="p-3">Qty</th>
                                  <th className="p-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.variants.map((variant, i) => (
                                  <tr key={i} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                    <td className="p-3 font-medium">{variant.color}</td>
                                    <td className="p-3 font-medium">{variant.size}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${variant.qty > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {variant.qty}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded flex items-center justify-center gap-1.5 ml-auto text-xs font-bold transition-colors cursor-pointer"
                                        onClick={() => handleEdit(product, variant)}
                                      >
                                        <FaEdit /> Edit
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-gray-500 text-center py-4 bg-white border border-gray-200 rounded">
                              No variants found for this product.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    <FaBoxOpen className="mx-auto text-3xl mb-2 text-gray-300" />
                    No stock data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <div key={product.productId} className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 p-5 transition-shadow">
                {product.image && (
                  <img 
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4 border border-gray-200"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">
                      {product.productId}
                    </span>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Total</span>
                    <span className={`text-xl font-black ${product.totalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.totalStock}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Variants ({product.variants.length})</span>
                    <button 
                      onClick={() => toggleExpand(product.productId)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      {expandedRows.has(product.productId) ? "Hide Details" : "Show Details"}
                    </button>
                  </div>
                  
                  {expandedRows.has(product.productId) && (
                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {product.variants.length > 0 ? (
                        product.variants.map((variant, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 p-2.5 rounded border border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded">{variant.color}</span>
                              <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded">{variant.size}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-sm ${variant.qty > 0 ? 'text-green-600' : 'text-red-500'}`}>{variant.qty}</span>
                              <button
                                onClick={() => handleEdit(product, variant)}
                                className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded cursor-pointer"
                                title="Edit Variant"
                              >
                                <FaEdit size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic text-center py-2">No variants</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-10 text-center border border-gray-200">
              <FaBoxOpen className="mx-auto text-4xl mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No products found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Showing {Math.min((currentPage - 1) * productsPerPage + 1, filteredProducts.length)} - {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[320px]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition ${page === currentPage ? 'bg-blue-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {showEditModal && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative animate-[slideIn_0.2s_ease-out]">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-xl font-bold text-blue-900 mb-1">
              Edit Variant Stock
            </h3>
            <p className="text-xs text-gray-500 mb-5 pb-4 border-b border-gray-100">Update stock for a specific size and color</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Product</label>
                <input
                  value={selectedVariant.name}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Color</label>
                  <input
                    value={selectedVariant.color}
                    readOnly
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Size</label>
                  <input
                    value={selectedVariant.size}
                    readOnly
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Quantity</label>
                <input
                  name="qty"
                  type="number"
                  value={selectedVariant.qty}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  placeholder="Enter quantity"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-blue-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-800 shadow-md transition-colors cursor-pointer"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:w-[500px] h-full bg-white shadow-2xl relative flex flex-col overflow-y-auto animate-[slideIn_0.3s_ease-out]">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 flex justify-between items-center text-white sticky top-0 z-10 shadow-md">
              <div>
                <h3 className="text-xl font-bold">Add New Stock</h3>
                <p className="text-blue-200 text-sm mt-1">Select variants to add stock</p>
              </div>
              <button 
                onClick={() => {
                  setShowAddStockModal(false);
                  fetchStock(); // Refresh stock after closing modal in case it was updated
                }}
                className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {/* We embed AddStock but hide its headers via CSS since it renders its own full page styling normally */}
              <div className="add-stock-modal-wrapper">
                <AddStock />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        /* Hide the big headers and borders inside AddStock when rendered in modal */
        .add-stock-modal-wrapper .min-h-screen { min-height: auto; padding: 1.5rem; background: transparent; }
        .add-stock-modal-wrapper .max-w-7xl > h2 { display: none; }
        .add-stock-modal-wrapper .max-w-7xl > p { display: none; }
        .add-stock-modal-wrapper .bg-white.shadow-lg { box-shadow: none; padding: 0; background: transparent; border-radius: 0; }
        .add-stock-modal-wrapper form { background: white; padding: 1.5rem; border-radius: 1rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .add-stock-modal-wrapper .mt-8.max-w-7xl { margin-top: 1rem; box-shadow: none; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.5rem; background: white; }
      `}</style>
    </div>
  );
};

export default StockDetails;
