import React, { useState, useEffect } from "react";
import api from "../api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaCloudUploadAlt, FaTag } from "react-icons/fa";

const Category = () => {
  const [category, setCategory] = useState({
    category_id: "",
    name: "",
    description: "",
    images: [],
    subcategories: [],
  });

  const [subcatInput, setSubcatInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [previewImgs, setPreviewImgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const parseJSON = (val, fallback) => {
    if (Array.isArray(val) || (val && typeof val === "object")) return val;
    try {
      return JSON.parse(val);
    } catch (e) {
      return fallback;
    }
  };

  const generateNextCatId = (list) => {
    const count = list.length + 1;
    return `CAT${String(count).padStart(3, "0")}`;
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      const list = data.categories || [];
      const parsed = list.map((c) => ({
        ...c,
        images: parseJSON(c.images, []),
        subcategories: parseJSON(c.subcategories, []),
      }));
      setCategories(parsed);
      return parsed;
    } catch (err) {
      console.error("Error fetching categories:", err);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const list = await fetchCategories();
      setCategory((prev) => ({ ...prev, category_id: generateNextCatId(list) }));
    })();
  }, []);

  // ─── Image handling ───────────────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const compressedFiles = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.15,
            maxWidthOrHeight: 700,
            useWebWorker: true,
          })
        )
      );

      const base64Images = await Promise.all(
        compressedFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      setCategory((prev) => ({ ...prev, images: base64Images }));
      setPreviewImgs(base64Images);
      toast.success("Images uploaded & compressed!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to compress or upload images.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Submit (Add / Update) ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { category_id, name, description, images, subcategories } = category;

    if (!name || !description || images.length === 0) {
      toast.error("Please fill all required fields and upload images.");
      return;
    }

    const payload = { category_id, name, description, images, subcategories };

    setLoading(true);
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, payload);
        toast.success("Category updated!");
        setEditId(null);
      } else {
        await api.post("/categories", payload);
        toast.success("Category added!");
      }

      const list = await fetchCategories();
      resetForm(list);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category.");
    }
    setLoading(false);
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = (cat) => {
    setCategory({
      category_id: cat.category_id,
      name: cat.name,
      description: cat.description,
      images: cat.images || [],
      subcategories: cat.subcategories || [],
    });
    setSubcatInput("");
    setPreviewImgs(cat.images || []);
    setEditId(cat.category_id);
    setShowModal(true);
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (category_id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/categories/${category_id}`);
      toast.success("Category deleted.");
      const list = await fetchCategories();
      resetForm(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category.");
    }
  };

  // ─── Subcategories ────────────────────────────────────────────────────────
  const handleAddSubcategory = () => {
    const trimmed = subcatInput.trim();
    if (trimmed && !category.subcategories.includes(trimmed)) {
      setCategory((prev) => ({
        ...prev,
        subcategories: [...prev.subcategories, trimmed],
      }));
      setSubcatInput("");
    }
  };

  const handleRemoveSubcategory = (sub) => {
    setCategory((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((s) => s !== sub),
    }));
  };

  // ─── Reset form ───────────────────────────────────────────────────────────
  const resetForm = (list) => {
    setEditId(null);
    setCategory({
      category_id: generateNextCatId(list || categories),
      name: "",
      description: "",
      images: [],
      subcategories: [],
    });
    setSubcatInput("");
    setPreviewImgs([]);
  };

  const openAddModal = async () => {
    const list = await fetchCategories();
    resetForm(list);
    setShowModal(true);
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center mb-8 gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-3xl font-bold text-blue-900 mb-1">Categories</h2>
          <p className="text-gray-500">Manage your product categories and subcategories.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 cursor-pointer bg-blue-900 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-md hover:shadow-lg"
        >
          <FaPlus /> Add New Category
        </button>
      </div>

      {/* ── Categories Table (Desktop) ── */}
      <div className="hidden md:block overflow-x-auto w-full shadow-md rounded-xl border border-gray-100">
        <table className="min-w-[800px] w-full text-sm text-left">
          <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
            <tr>
              <th className="px-5 py-4 font-semibold">Cat ID</th>
              <th className="px-5 py-4 font-semibold">Name</th>
              <th className="px-5 py-4 font-semibold">Subcategories</th>
              <th className="px-5 py-4 font-semibold">Images</th>
              <th className="px-5 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat, idx) => (
                <tr
                  key={cat.category_id}
                  className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-5 py-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                      {cat.category_id}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">{cat.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {(cat.subcategories || []).map((sub, i) => (
                        <span
                          key={i}
                          className="bg-purple-50 text-purple-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-purple-100"
                        >
                          {sub}
                        </span>
                      ))}
                      {(!cat.subcategories || cat.subcategories.length === 0) && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {(cat.images || []).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          className="h-12 w-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                          alt={`cat-${i}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.category_id)}
                        className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-400">
                  No categories found. Click "Add New Category" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Categories Cards (Mobile) ── */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {categories.map((cat) => (
          <div key={cat.category_id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {cat.category_id}
                </span>
                <h4 className="text-lg font-semibold text-blue-900 mt-1">{cat.name}</h4>
                {cat.subcategories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cat.subcategories.map((sub, i) => (
                      <span
                        key={i}
                        className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-100"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(cat)}
                  className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat.category_id)}
                  className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(cat.images || []).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="h-24 w-full object-cover rounded-lg border border-gray-200"
                  alt={`cat-mobile-${i}`}
                />
              ))}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100">
            No categories found.
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL POPUP
         ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          ></div>

          {/* Modal */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ animation: "modalSlideUp 0.3s ease-out" }}
          >
            {/* Modal Header */}
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
                    {editId
                      ? "Update the category details below"
                      : "Fill in the details to create a new category"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Row: Category ID + Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Category ID
                  </label>
                  <input
                    readOnly
                    value={category.category_id || "Auto generated"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={category.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. T-Shirts, Hoodies"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={category.description}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of this category..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                  rows={3}
                />
              </div>

              {/* Subcategories */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Subcategories
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subcatInput}
                    onChange={(e) => setSubcatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddSubcategory())
                    }
                    placeholder="e.g. Regular Fit, Oversize, Kids"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="bg-blue-900 cursor-pointer text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {category.subcategories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.subcategories.map((sub, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full text-sm text-purple-700 font-medium"
                      >
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(sub)}
                          className="text-purple-400 cursor-pointer hover:text-red-500 transition-colors ml-0.5"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Upload Images <span className="text-red-500">*</span>
                </label>
                <label
                  htmlFor="cimgs-modal"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                >
                  <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                    Click to upload images
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    PNG, JPG, WEBP (auto-compressed)
                  </p>
                </label>
                <input
                  id="cimgs-modal"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  required={!editId}
                  className="hidden"
                />
                {previewImgs.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {previewImgs.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`preview-${index}`}
                        className="h-24 w-full object-cover rounded-xl border border-gray-200 shadow-sm"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 cursor-pointer rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 cursor-pointer rounded-xl text-sm font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editId ? "Updating..." : "Adding..."}
                    </>
                  ) : editId ? (
                    "Update Category"
                  ) : (
                    "Add Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Category;
