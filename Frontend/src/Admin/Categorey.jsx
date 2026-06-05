import React, { useState, useEffect, useMemo } from "react";
import api from "../api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import {
  FaEdit, FaTrash, FaPlus, FaTimes, FaCloudUploadAlt,
  FaTag, FaSearch, FaTh, FaList, FaFilter, FaLayerGroup,
} from "react-icons/fa";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseJSON = (val, fallback) => {
  if (Array.isArray(val) || (val && typeof val === "object")) return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

const generateNextCatId = (list) =>
  `CAT${String(list.length + 1).padStart(3, "0")}`;

// ─── Component ────────────────────────────────────────────────────────────────
const Category = () => {
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [previewImgs, setPreviewImgs] = useState([]);
  const [subcatInput, setSubcatInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterSubcatCount, setFilterSubcatCount] = useState("all");
  const [filterHasImage, setFilterHasImage] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  // ── Form state ──────────────────────────────────────────────────────────────
  const [category, setCategory] = useState({
    category_id: "", name: "", description: "", images: [], subcategories: [],
  });

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      const list = (data.categories || []).map((c) => ({
        ...c,
        images: parseJSON(c.images, []),
        subcategories: parseJSON(c.subcategories, []),
      }));
      setCategories(list);
      return list;
    } catch (err) {
      console.error("Error fetching categories:", err);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const list = await fetchCategories();
      setCategory((p) => ({ ...p, category_id: generateNextCatId(list) }));
    })();
  }, []);

  useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    if (mobile) {
      setViewMode("card");
    }
  };

  handleResize();
  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  // ── Filtered & sorted categories ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...categories];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category_id?.toLowerCase().includes(q) ||
          (c.subcategories || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterHasImage === "yes") list = list.filter((c) => c.images?.length > 0);
    if (filterHasImage === "no")  list = list.filter((c) => !c.images?.length);
    if (filterSubcatCount === "0")   list = list.filter((c) => (c.subcategories || []).length === 0);
    if (filterSubcatCount === "1-3") list = list.filter((c) => { const n = (c.subcategories || []).length; return n >= 1 && n <= 3; });
    if (filterSubcatCount === "4+")  list = list.filter((c) => (c.subcategories || []).length >= 4);
    if (sortBy === "name-asc")  list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === "subcats")   list.sort((a, b) => (b.subcategories || []).length - (a.subcategories || []).length);
    return list;
  }, [categories, search, filterHasImage, filterSubcatCount, sortBy]);

  const hasActiveFilters = search || filterSubcatCount !== "all" || filterHasImage !== "all" || sortBy !== "default";

  const clearFilters = () => {
    setSearch("");
    setFilterSubcatCount("all");
    setFilterHasImage("all");
    setSortBy("default");
    setCurrentPage(1);
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filtered, currentPage, totalPages]);

  // ── Image handling ──────────────────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const compressed = await Promise.all(
        files.map((f) => imageCompression(f, { maxSizeMB: 0.15, maxWidthOrHeight: 700, useWebWorker: true }))
      );
      const b64 = await Promise.all(
        compressed.map((f) => new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(f);
        }))
      );
      setCategory((p) => ({ ...p, images: b64 }));
      setPreviewImgs(b64);
      toast.success("Images uploaded & compressed!");
    } catch { toast.error("Failed to compress/upload images."); }
  };

  const handleChange = (e) =>
    setCategory((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { category_id, name, description, images, subcategories } = category;
    if (!name || !description || images.length === 0) {
      toast.error("Please fill all required fields and upload images.");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, { category_id, name, description, images, subcategories });
        toast.success("Category updated!");
        setEditId(null);
      } else {
        await api.post("/categories", { category_id, name, description, images, subcategories });
        toast.success("Category added!");
      }
      const list = await fetchCategories();
      resetForm(list);
      setShowModal(false);
    } catch { toast.error("Failed to save category."); }
    setLoading(false);
  };

  // ── Edit / Delete ───────────────────────────────────────────────────────────
  const handleEdit = (cat) => {
    setCategory({
      category_id: cat.category_id, name: cat.name,
      description: cat.description, images: cat.images || [],
      subcategories: cat.subcategories || [],
    });
    setSubcatInput("");
    setPreviewImgs(cat.images || []);
    setEditId(cat.category_id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted.");
      const list = await fetchCategories();
      resetForm(list);
    } catch { toast.error("Failed to delete category."); }
  };

  // ── Subcategories ───────────────────────────────────────────────────────────
  const handleAddSubcategory = () => {
    const t = subcatInput.trim();
    if (t && !category.subcategories.includes(t)) {
      setCategory((p) => ({ ...p, subcategories: [...p.subcategories, t] }));
      setSubcatInput("");
    }
  };

  const handleRemoveSubcategory = (sub) =>
    setCategory((p) => ({ ...p, subcategories: p.subcategories.filter((s) => s !== sub) }));

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetForm = (list) => {
    setEditId(null);
    setCategory({ category_id: generateNextCatId(list || categories), name: "", description: "", images: [], subcategories: [] });
    setSubcatInput("");
    setPreviewImgs([]);
  };

  const openAddModal = async () => {
    const list = await fetchCategories();
    resetForm(list);
    setShowModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your product categories and subcategories
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors shadow-md cursor-pointer self-start sm:self-auto"
        >
          <FaPlus size={12} /> Add New Category
        </button>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, subcategory…"
              className="w-1/2 pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-shadow"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>

          {/* Has Images filter */}
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2.5 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 cursor-pointer min-w-[170px]"
          >
            <option value="default">↕ Default Order</option>
            <option value="name-asc">A → Z</option>
            <option value="name-desc">Z → A</option>
            <option value="subcats">Most Subcategories</option>
          </select>

          {/* View toggle */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2.5 rounded-lg cursor-pointer transition-all ${viewMode === "card" ? "bg-white text-blue-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="Card View"
            >
              <FaTh size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2.5 rounded-lg cursor-pointer transition-all ${viewMode === "table" ? "bg-white text-blue-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="Table View"
            >
              <FaList size={14} />
            </button>
          </div>
        </div>

        {/* Active filter pills row */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Active:</span>
            {search && (
              <span className="flex items-center gap-1.5 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                "{search}"
                <button onClick={() => setSearch("")} className="hover:text-red-600 cursor-pointer"><FaTimes size={9} /></button>
              </span>
            )}
            {filterHasImage !== "all" && (
              <span className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                {filterHasImage === "yes" ? "With Images" : "No Images"}
                <button onClick={() => setFilterHasImage("all")} className="hover:text-red-600 cursor-pointer"><FaTimes size={9} /></button>
              </span>
            )}
            {filterSubcatCount !== "all" && (
              <span className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                Subcats: {filterSubcatCount}
                <button onClick={() => setFilterSubcatCount("all")} className="hover:text-red-600 cursor-pointer"><FaTimes size={9} /></button>
              </span>
            )}
            {sortBy !== "default" && (
              <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
                Sort: {sortBy}
                <button onClick={() => setSortBy("default")} className="hover:text-red-600 cursor-pointer"><FaTimes size={9} /></button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-4 px-1">
        Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
        <span className="font-semibold text-gray-600">{categories.length}</span> categories
      </p>

      {/* ════════════════════ CARD MODE ════════════════════ */}
      {(isMobile || viewMode === "card") && (
        <>
          {currentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentItems.map((cat) => (
                <div
                  key={cat.category_id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* ── Image area with gradient overlay ── */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
                    {cat.images?.length > 0 ? (
                      <img
                        src={cat.images[0]}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
                          <FaTag className="text-blue-300" size={28} />
                        </div>
                        <span className="text-xs text-blue-300 font-medium">No Image</span>
                      </div>
                    )}

                    {/* Dark gradient bottom overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Category ID badge — top left */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-blue-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm tracking-wide">
                        {cat.category_id}
                      </span>
                    </div>

                    {/* Extra images count — top right */}
                    {cat.images?.length > 1 && (
                      <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg font-semibold">
                        +{cat.images.length - 1} 📷
                      </span>
                    )}

                    {/* Name on bottom of image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-white font-bold text-base leading-tight drop-shadow-md line-clamp-1">
                        {cat.name}
                      </h4>
                    </div>


                  </div>

                  {/* ── Card body ── */}
                  <div className="p-4">
                    {/* Description */}
                    {cat.description ? (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                        {cat.description}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-300 italic mb-3">No description</p>
                    )}

                    {/* Subcategory tags */}
                    {cat.subcategories?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {cat.subcategories.slice(0, 4).map((sub, i) => (
                          <span
                            key={i}
                            className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-purple-100"
                          >
                            {sub}
                          </span>
                        ))}
                        {cat.subcategories.length > 4 && (
                          <span className="text-[10px] text-gray-400 self-center font-medium">
                            +{cat.subcategories.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <span className="text-[10px] text-gray-300 italic">No subcategories</span>
                      </div>
                    )}

                    {/* Bottom action bar */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                      >
                        <FaEdit size={11} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.category_id)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                      >
                        <FaTrash size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} onAdd={openAddModal} />
          )}
        </>
      )}

      {/* ════════════════════ TABLE MODE ════════════════════ */}
      {(!isMobile && viewMode === "table") && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
          <table className="min-w-[750px] w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-center w-16">S No</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Cat ID</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Images</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Subcategories</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((cat, idx) => (
                  <tr
                    key={cat.category_id}
                    className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                  >
                    <td className="px-5 py-3.5 text-center font-medium text-gray-500">
                      {indexOfFirst + idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-md">
                        {cat.category_id}
                      </span>
                    </td>
                     <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {(cat.images || []).slice(0, 3).map((img, i) => (
                          <img key={i} src={img} className="h-10 w-10 object-cover rounded-lg border border-gray-200 shadow-sm" alt={`cat-${i}`} />
                        ))}
                        {cat.images?.length > 3 && (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                            +{cat.images.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{cat.name}</td>

                   
                    
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {(cat.subcategories || []).length > 0 ? (
                          cat.subcategories.map((sub, i) => (
                            <span key={i} className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-100">
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <FaEdit size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.category_id)}
                          className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-16">
                    <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} onAdd={openAddModal} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════ PAGINATION ════════════════════ */}
      {totalPages > 0 && (
        <div className="flex flex-col items-center gap-3 mt-8 py-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md text-sm py-1 px-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
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
                  const shouldShow = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
                  
                  if (!shouldShow) {
                    if ((page === 2 && currentPage > 4) || (page === totalPages - 1 && currentPage < totalPages - 3)) {
                      return <span key={page} className="px-2 text-gray-400 font-medium">...</span>;
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
            Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span> • Showing {currentItems.length} of {filtered.length} items
          </p>
        </div>
      )}

      {/* ════════════════════ ADD / EDIT MODAL ════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowModal(false); resetForm(); }}
          />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ animation: "modalSlideUp 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
                  <FaTag className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">
                    {editId ? "Edit Category" : "Add New Category"}
                  </h3>
                  <p className="text-blue-200 text-xs">
                    {editId ? "Update the category details below" : "Fill in the details to create a new category"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Category ID</label>
                  <input
                    readOnly value={category.category_id || "Auto generated"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="name" value={category.name} onChange={handleChange}
                    required placeholder="e.g. T-Shirts, Hoodies"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description" value={category.description} onChange={handleChange}
                  required placeholder="Brief description of this category..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Subcategories</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={subcatInput}
                    onChange={(e) => setSubcatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubcategory())}
                    placeholder="e.g. Regular Fit, Oversize, Kids"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                  <button
                    type="button" onClick={handleAddSubcategory}
                    className="bg-blue-900 cursor-pointer text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {category.subcategories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.subcategories.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full text-sm text-purple-700 font-medium">
                        {sub}
                        <button type="button" onClick={() => handleRemoveSubcategory(sub)} className="text-purple-400 cursor-pointer hover:text-red-500 transition-colors">
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Upload Images <span className="text-red-500">*</span>
                </label>
                <label
                  htmlFor="cimgs-modal"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                >
                  <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm text-gray-500 group-hover:text-blue-600">Click to upload images</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WEBP (auto-compressed)</p>
                </label>
                <input id="cimgs-modal" type="file" accept="image/*" multiple onChange={handleImageChange} required={!editId} className="hidden" />
                {previewImgs.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {previewImgs.map((img, i) => (
                      <img key={i} src={img} alt={`preview-${i}`} className="h-24 w-full object-cover rounded-xl border border-gray-200 shadow-sm" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-5 py-2.5 cursor-pointer rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="px-6 py-2.5 cursor-pointer rounded-xl text-sm font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editId ? "Updating..." : "Adding..."}
                    </>
                  ) : editId ? "Update Category" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ hasFilters, onClear, onAdd }) => (
  <div className="text-center py-16 px-6">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <FaTag className="text-gray-300" size={24} />
    </div>
    <h3 className="text-gray-700 font-semibold mb-1">
      {hasFilters ? "No matching categories" : "No categories yet"}
    </h3>
    <p className="text-gray-400 text-sm mb-4">
      {hasFilters ? "Try adjusting your search or filters." : `Click "Add New Category" to get started.`}
    </p>
    {hasFilters ? (
      <button onClick={onClear} className="text-sm text-blue-700 underline cursor-pointer hover:text-blue-900">
        Clear filters
      </button>
    ) : (
      <button onClick={onAdd} className="text-sm bg-blue-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-800 transition-colors">
        Add Category
      </button>
    )}
  </div>
);

export default Category;
