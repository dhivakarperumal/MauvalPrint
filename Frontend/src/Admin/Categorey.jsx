import React, { useState, useEffect } from "react";
import api from "../api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";

const Category = () => {
  const [category, setCategory] = useState({
    category_id: "",
    name: "",
    description: "",
    images: [],
    subcategories: [],
  });

  const [subcatInput, setSubcatInput] = useState("");
  const [editId, setEditId] = useState(null); // holds category_id when editing
  const [previewImgs, setPreviewImgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("add");

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      const list = data.categories || [];
      // Parse JSON fields returned as strings from MySQL
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

  const parseJSON = (val, fallback) => {
    if (Array.isArray(val) || (val && typeof val === "object")) return val;
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ─── Image handling ───────────────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const compressedFiles = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
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

    const payload = {
      name,
      description,
      images,
      subcategories,
    };
    if (editId) payload.category_id = category_id;

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

      await fetchCategories();
      setCategory({
        category_id: "",
        name: "",
        description: "",
        images: [],
        subcategories: [],
      });
      setSubcatInput("");
      setPreviewImgs([]);
      const fileInput = document.getElementById("cimgs");
      if (fileInput) fileInput.value = "";
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
    setSubcatInput((cat.subcategories || []).join(", "));
    setPreviewImgs(cat.images || []);
    setEditId(cat.category_id);
    setActiveTab("add");
    toast("Editing category...");
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (category_id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/categories/${category_id}`);
      toast.success("Category deleted.");
      await fetchCategories();
      setCategory({
        category_id: "",
        name: "",
        description: "",
        images: [],
        subcategories: [],
      });
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
  const resetForm = async () => {
    setEditId(null);
    await fetchCategories();
    setCategory({
      category_id: "",
      name: "",
      description: "",
      images: [],
      subcategories: [],
    });
    setSubcatInput("");
    setPreviewImgs([]);
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      <div className="flex justify-between items-start sm:items-center mb-6 gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-3xl font-bold text-blue-900 mb-1">
            {editId ? "Edit Category" : "Add New Category"}
          </h2>
          <p className="text-gray-500">Fill in the details below.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setActiveTab("add"); resetForm(); }}
            className={`px-4 py-2 cursor-pointer rounded-full font-medium text-sm ${
              activeTab === "add"
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-blue-900 hover:bg-gray-200"
            }`}
          >
            Add Category
          </button>
          <button
            onClick={() => setActiveTab("show")}
            className={`px-4 py-2 cursor-pointer rounded-full font-medium text-sm ${
              activeTab === "show"
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-blue-900 hover:bg-gray-200"
            }`}
          >
            Show Categories
          </button>
        </div>
      </div>

      {/* ── Add / Edit Form ── */}
      {activeTab === "add" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Category ID */}
          <div>
            <label className="text-sm font-medium block mb-1">Category ID</label>
            <input
              readOnly
              value={category.category_id || "Auto generated"}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none bg-gray-100"
            />
          </div>

          {/* Category Name */}
          <div>
            <label className="text-sm font-medium block mb-1">Category Name *</label>
            <input
              type="text"
              name="name"
              value={category.name}
              onChange={handleChange}
              required
              placeholder="Category Name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium block mb-1">Description *</label>
            <textarea
              name="description"
              value={category.description}
              onChange={handleChange}
              required
              placeholder="Description"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          {/* Subcategories */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium block mb-1">Subcategory</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={subcatInput}
                onChange={(e) => setSubcatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubcategory())}
                placeholder="e.g. Regular Fit, Oversize, Kids"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubcategory}
                className="bg-blue-900 cursor-pointer text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                Add
              </button>
            </div>

            {category.subcategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {category.subcategories.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                  >
                    {sub}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(sub)}
                      className="text-red-500 cursor-pointer hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium block mb-1">Upload Images *</label>
            <input
              id="cimgs"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              required={!editId}
            />
            {previewImgs.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previewImgs.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`preview-${index}`}
                    className="h-28 w-full object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-900 cursor-pointer text-white px-6 py-2 rounded hover:bg-blue-800"
            >
              {loading
                ? editId ? "Updating..." : "Adding..."
                : editId ? "Update Category" : "Add Category"}
            </button>
          </div>
        </form>
      )}

      {/* ── Show Categories ── */}
      {activeTab === "show" && (
        <div className="mt-6">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto w-full shadow rounded-lg">
            <table className="min-w-[800px] w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-4">Cat ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Subcategories</th>
                  <th className="px-4 py-4">Images</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat.category_id} className="border border-gray-300 hover:bg-gray-50">
                      <td className="px-4 py-2">{cat.category_id}</td>
                      <td className="px-4 py-2">{cat.name}</td>
                      <td className="px-4 py-2">
                        {(cat.subcategories || []).join(", ")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 flex-wrap">
                          {(cat.images || []).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              className="h-12 w-12 object-cover rounded border"
                              alt={`cat-${i}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-3 text-gray-600">
                          <FaEdit
                            onClick={() => handleEdit(cat)}
                            className="hover:text-green-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg p-1"
                          />
                          <FaTrash
                            onClick={() => handleDelete(cat.category_id)}
                            className="hover:text-red-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg p-1"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {categories.map((cat) => (
              <div key={cat.category_id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">ID: {cat.category_id}</p>
                    <h4 className="text-lg font-semibold text-blue-900">{cat.name}</h4>
                    {cat.subcategories?.length > 0 && (
                      <p className="text-sm mt-1 text-gray-600">
                        Subcategories: {cat.subcategories.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <FaEdit
                      onClick={() => handleEdit(cat)}
                      className="hover:text-green-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg p-1"
                    />
                    <FaTrash
                      onClick={() => handleDelete(cat.category_id)}
                      className="hover:text-red-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg p-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {(cat.images || []).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      className="h-24 w-full object-cover rounded border"
                      alt={`cat-mobile-${i}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
