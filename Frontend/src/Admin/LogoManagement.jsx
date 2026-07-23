import React, { useState, useEffect } from "react";
import api from "../api";
import { FaEdit, FaTrash, FaPlus, FaImage, FaSearch, FaList, FaThLarge, FaFilter } from "react-icons/fa";
import toast from "react-hot-toast";

const LogoManagement = () => {
  const [logos, setLogos] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'form'
  const [displayMode, setDisplayMode] = useState("list"); // 'list' or 'card'
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const initialFormState = {
    id: null,
    name: "",
    image: "",
    type: "Header",
    width: 150,
    height: 50,
    mrp: "",
    offer: "",
    offer_price: "",
    status: 1,
    is_default: 0,
    description: "",
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/logos");
      if (data.success) {
        setLogos(data.logos);
      }
    } catch (error) {
      console.error("Error fetching logos:", error);
      toast.error("Failed to load logos.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const uploadToBackend = async (files, category = "products") => {
    const formData = new FormData();
    files.forEach((file, i) =>
      formData.append("files[]", file, file.name || `file_${i}`)
    );
    formData.append("category", category);

    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

    try {
      const res = await fetch(`/api/upload?category=${encodeURIComponent(category)}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok || !data) {
        console.error("Upload failed response:", res.status, data);
        toast.error(`Upload failed: server responded ${res.status}`);
        return [];
      }

      if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        toast.success(`Uploaded ${data.urls.length} file(s) successfully`);
        return data.urls;
      }

      console.error("Upload response (no urls):", data);
      toast.error("Upload failed: no URLs returned from server");
      return [];
    } catch (err) {
      toast.dismiss(toastId);
      console.error("Upload error:", err);
      toast.error(`Upload failed: ${err.message || "network error"}`);
      return [];
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const urls = await uploadToBackend([file], "logos");
      if (urls && urls.length > 0) {
        setForm((prev) => ({ ...prev, image: urls[0] }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.image || !form.width || !form.height) {
      return toast.error("Please fill in all required fields.");
    }

    try {
      if (form.id) {
        await api.put(`/logos/${form.id}`, form);
        toast.success("Logo updated successfully.");
      } else {
        await api.post("/logos", form);
        toast.success("Logo added successfully.");
      }
      setForm(initialFormState);
      setViewMode("table");
      fetchLogos();
    } catch (error) {
      console.error("Error saving logo:", error);
      toast.error("Failed to save logo.");
    }
  };

  const handleEdit = (logo) => {
    setForm(logo);
    setViewMode("form");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this logo?")) {
      try {
        await api.delete(`/logos/${id}`);
        toast.success("Logo deleted successfully.");
        fetchLogos();
      } catch (error) {
        console.error("Error deleting logo:", error);
        toast.error("Failed to delete logo.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 min-h-screen">


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatBox
          title="Designs"
          count={logos.length}
          color="blue"
          icon={<FaImage size={22} className="text-white drop-shadow-sm" />}
        />
        <StatBox
          title="Active Designs"
          count={logos.filter(l => l.status === 1).length}
          color="green"
          icon={<FaThLarge size={22} className="text-white drop-shadow-sm" />}
        />
        <StatBox
          title="Inactive Designs"
          count={logos.filter(l => l.status === 0).length}
          color="red"
          icon={<FaList size={22} className="text-white drop-shadow-sm" />}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search designs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-sm"
          />
        </div>
        
        {/* Actions Toolbar */}
        <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setDisplayMode("list")}
              className={`p-1.5 rounded transition ${displayMode === "list" ? "bg-[#1e3a8a] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              title="List View"
            >
              <FaList size={14} />
            </button>
            <button
              onClick={() => setDisplayMode("card")}
              className={`p-1.5 rounded transition ${displayMode === "card" ? "bg-[#1e3a8a] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              title="Card View"
            >
              <FaThLarge size={14} />
            </button>
          </div>
          
         
         
          
          <button
            onClick={() => {
              setForm(initialFormState);
              setViewMode("form");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 font-medium whitespace-nowrap text-sm transition shadow-sm"
          >
            <FaPlus /> Add Design
          </button>
          
          
        </div>
      </div>

      {viewMode === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl mt-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{form.id ? "Edit Design" : "Add Design"}</h3>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Design Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                placeholder="e.g. Main Header Design"
                required
              />
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm font-semibold mb-2">Width (px) *</label>
              <input
                type="number"
                name="width"
                value={form.width}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                required
              />
            </div>
            {/* Height */}
            <div>
              <label className="block text-sm font-semibold mb-2">Height (px) *</label>
              <input
                type="number"
                name="height"
                value={form.height}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                required
              />
            </div>

            {/* MRP */}
            <div>
              <label className="block text-sm font-semibold mb-2">MRP (₹) *</label>
              <input
                type="number"
                name="mrp"
                value={form.mrp}
                onChange={(e) => {
                  const mrp = parseFloat(e.target.value) || 0;
                  const offer = parseFloat(form.offer) || 0;
                  const offer_price = offer > 0 ? (mrp - (mrp * offer) / 100).toFixed(2) : form.offer_price;
                  setForm((prev) => ({ ...prev, mrp: e.target.value, offer_price }));
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                placeholder="e.g. 999"
                min="0"
                step="0.01"
              />
            </div>

            {/* Offer % */}
            <div>
              <label className="block text-sm font-semibold mb-2">Offer (%)</label>
              <input
                type="number"
                name="offer"
                value={form.offer}
                onChange={(e) => {
                  const offer = parseFloat(e.target.value) || 0;
                  const mrp = parseFloat(form.mrp) || 0;
                  const offer_price = mrp > 0 && offer > 0 ? (mrp - (mrp * offer) / 100).toFixed(2) : form.offer_price;
                  setForm((prev) => ({ ...prev, offer: e.target.value, offer_price }));
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                placeholder="e.g. 10"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* Offer Price (Auto) */}
            <div>
              <label className="block text-sm font-semibold mb-2">Offer Price (₹) <span className="text-gray-400 font-normal text-xs">auto-calculated</span></label>
              <input
                type="number"
                name="offer_price"
                value={form.offer_price}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-green-50"
                placeholder="Auto calculated"
                min="0"
                step="0.01"
              />
            </div>
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold mb-2">Design Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                required={!form.image}
              />
            </div>
            {/* Image Preview */}
            <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 bg-gray-50 h-[100px]">
              {form.image ? (
                <img src={form.image} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%" }} />
              ) : (
                <span className="text-gray-400 flex flex-col items-center">
                  <FaImage size={24} />
                  Preview
                </span>
              )}
            </div>
            {/* Status (Toggle) */}
            <div className="flex items-center space-x-4 pt-4">
              <label className="block text-sm font-semibold">Status (Active)</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="status"
                  checked={form.status === 1}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                rows="3"
                placeholder="Optional description"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className="px-6 py-2.5 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-semibold shadow-md"
            >
              {form.id ? "Update Design" : "Save Design"}
            </button>
          </div>
        </form>
        </div>
      )}

      {(() => {
        const filteredLogos = logos.filter(logo => 
          (logo.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
        );
        const totalPages = Math.ceil(filteredLogos.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentLogos = filteredLogos.slice(startIndex, startIndex + itemsPerPage);

        return (
          <div className="rounded-lg overflow-hidden flex flex-col gap-4">
            {loading ? (
              <div className="p-10 text-center text-gray-500 bg-white rounded-xl border">Loading logos...</div>
            ) : filteredLogos.length === 0 ? (
              <div className="p-10 text-center text-gray-500 bg-white rounded-xl border">No designs found.</div>
            ) : displayMode === "list" ? (
              /* ── LIST / TABLE VIEW ── */
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="p-4">S.No</th>
                      <th className="p-4">Preview</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Dimensions</th>
                      <th className="p-4">MRP</th>
                      <th className="p-4">Offer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Update Time</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogos.map((logo, index) => (
                      <tr key={logo.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="p-4 font-semibold text-gray-500">{startIndex + index + 1}</td>
                    <td className="p-4">
                      <img src={logo.image} alt={logo.name} className="h-10 w-auto object-contain bg-gray-100 rounded" />
                    </td>
                    <td className="p-4 font-medium text-gray-800">{logo.name}</td>
                    <td className="p-4 text-gray-600">{logo.width} × {logo.height} px</td>
                    <td className="p-4 text-gray-700">₹{parseFloat(logo.mrp || 0).toFixed(2)}</td>
                    <td className="p-4">
                      {logo.offer > 0 ? (
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{logo.offer}% OFF</span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="p-4 font-semibold text-green-700">₹{parseFloat(logo.offer_price || logo.mrp || 0).toFixed(2)}</td>
                    <td className="p-4">
                      {logo.status === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Inactive
                        </span>
                      )}
                    </td>
                    
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(logo)} className="text-blue-600 hover:text-blue-800 transition" title="Edit">
                          <FaEdit size={16} />
                        </button>
                        <button onClick={() => handleDelete(logo.id)} className="text-red-500 hover:text-red-700 transition" title="Delete">
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── CARD / GRID VIEW ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {currentLogos.map((logo, index) => (
              <div key={logo.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Card Image */}
                <div className="flex items-center justify-center bg-gray-50 border-b border-gray-100 h-36 p-4">
                  <img src={logo.image} alt={logo.name} className="max-h-full max-w-full object-contain" />
                </div>
                {/* Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-400 font-medium">#{startIndex + index + 1}</span>
                      <h3 className="font-semibold text-gray-800 text-sm mt-0.5 leading-tight">{logo.name}</h3>
                    </div>
                    {logo.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                    <span>{logo.width} × {logo.height} px</span>
                    <span title="Last Updated">
                      {logo.updated_at ? new Date(logo.updated_at).toLocaleString() : logo.created_at ? new Date(logo.created_at).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {logo.mrp > 0 && <span className="text-xs text-gray-400 line-through">₹{parseFloat(logo.mrp).toFixed(2)}</span>}
                    {logo.offer > 0 && <span className="text-xs bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full">{logo.offer}% OFF</span>}
                    {(logo.offer_price > 0 || logo.mrp > 0) && (
                      <span className="text-sm font-bold text-green-700">₹{parseFloat(logo.offer_price || logo.mrp).toFixed(2)}</span>
                    )}
                  </div>
                  {logo.description && <p className="text-xs text-gray-400 truncate mb-3">{logo.description}</p>}
                  {/* Card Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(logo)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(logo.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      <FaTrash size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-6 mb-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                        currentPage === i + 1 
                        ? 'bg-blue-900 text-white shadow-md font-semibold' 
                        : 'border border-gray-300 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

const StatBox = ({ title, count, color, icon }) => {
  const gradientMap = {
    blue: "bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-700",
    red: "bg-gradient-to-br from-rose-500 via-red-500 to-orange-500",
    purple: "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600",
    green: "bg-gradient-to-br from-teal-400 via-emerald-500 to-green-600",
  };

  const shadowMap = {
    blue: "shadow-blue-500/40",
    red: "shadow-red-500/40",
    purple: "shadow-purple-500/40",
    green: "shadow-emerald-500/40",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradientMap[color]} shadow-lg ${shadowMap[color]} flex flex-col justify-between group cursor-pointer hover:-translate-y-1 transition-all duration-300`}>
      {/* Decorative glass shapes */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700 ease-out pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 group-hover:scale-125 transition-transform duration-700 ease-out pointer-events-none"></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="text-white">
          <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1 drop-shadow-sm">{title}</p>
          <p className="text-4xl font-black drop-shadow-md tracking-tight">{count}</p>
        </div>
        <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner group-hover:bg-white/30 transition-colors duration-300 text-white">
          {icon}
        </div>
      </div>


    </div>
  );
};

export default LogoManagement;
