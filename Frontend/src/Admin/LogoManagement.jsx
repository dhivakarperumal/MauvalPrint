import React, { useState, useEffect } from "react";
import api from "../api";
import { FaEdit, FaTrash, FaPlus, FaImage } from "react-icons/fa";
import toast from "react-hot-toast";

const LogoManagement = () => {
  const [logos, setLogos] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'form'
  const [loading, setLoading] = useState(false);

  const initialFormState = {
    id: null,
    name: "",
    image: "",
    type: "Header",
    width: 150,
    height: 50,
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

  const uploadToGoDaddy = async (files, category = "products") => {
    const formData = new FormData();
    files.forEach((file, i) =>
      formData.append("files[]", file, file.name || `file_${i}`)
    );
    formData.append("category", category);

    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

    try {
      const res = await fetch("https://mauvalprint.in/api/upload.php", {
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
      const urls = await uploadToGoDaddy([file], "logos");
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-blue-900">Logo Management</h2>
          <p className="text-sm text-gray-500">Manage site logos for Header, Footer, Login, Favicon.</p>
        </div>
        <div>
          <button
            onClick={() => {
              setForm(initialFormState);
              setViewMode(viewMode === "table" ? "form" : "table");
            }}
            className="px-4 py-2 bg-blue-900 text-white rounded-full flex items-center gap-2 hover:bg-blue-800 transition"
          >
            {viewMode === "table" ? (
              <>
                <FaPlus /> Add Logo
              </>
            ) : (
              "Back to List"
            )}
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

      <div className="bg-white rounded-lg shadow-sm  overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading logos...</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-4 w-16">S.No</th>
                  <th className="p-4">Logo Preview</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Dimensions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      No logos found. Add a new logo to get started.
                    </td>
                  </tr>
                ) : (
                  logos.map((logo, index) => (
                    <tr key={logo.id} className=" hover:bg-gray-50 transition">
                      <td className="p-4 font-semibold text-gray-600">{index + 1}</td>
                      <td className="p-4">
                        <img src={logo.image} alt={logo.name} className="h-10 w-auto object-contain bg-gray-100 rounded" />
                      </td>
                      <td className="p-4 font-medium text-gray-800">{logo.name}</td>
                      <td className="p-4">{logo.width}x{logo.height}</td>
                      <td className="p-4">
                        {logo.status === 1 ? (
                          <span className="text-green-600 font-semibold flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div> Active
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(logo)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(logo.id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
    </div>
  );
};

export default LogoManagement;
