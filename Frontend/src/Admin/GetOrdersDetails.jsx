import React, { useState, useEffect, useMemo } from "react";
import api from "../api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaTimes, FaTh, FaList, FaPrint } from "react-icons/fa";

const GetOrdersDetails = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    testimonial: "",
    logo: "",
    products: [{ color: "", size: "", quantity: "", printType: "" }],
  });

  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/print-orders");
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.name?.toLowerCase().includes(search.toLowerCase()) || 
      o.phone?.includes(search) || 
      o.order_id?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...form.products];
    updated[index][name] = value;
    setForm((prev) => ({ ...prev, products: updated }));
  };

  const addProduct = () => {
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, { color: "", size: "", quantity: "", printType: "" }],
    }));
  };

  const removeProduct = (index) => {
    const updated = [...form.products];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, products: updated }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const options = { maxSizeMB: 0.2, maxWidthOrHeight: 600, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => setForm((prev) => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to compress image");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      testimonial: "",
      logo: "",
      products: [{ color: "", size: "", quantity: "", printType: "" }],
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      testimonial: form.testimonial,
      logo: form.logo,
      products: form.products.map((p) => ({ ...p, quantity: Number(p.quantity) })),
    };

    try {
      if (editingId) {
        await api.put(`/print-orders/${editingId}`, payload);
        toast.success("Order updated successfully!");
      } else {
        await api.post("/print-orders", payload);
        toast.success("Order submitted successfully!");
      }
      resetForm();
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to submit order");
    }
  };

  const handleEdit = (order) => {
    setForm({
      name: order.name || "",
      phone: order.phone || "",
      email: order.email || "",
      testimonial: order.testimonial || "",
      logo: order.logo || "",
      products: order.products && order.products.length > 0 
        ? order.products 
        : [{ color: "", size: "", quantity: "", printType: "" }],
    });
    setEditingId(order.order_id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await api.delete(`/print-orders/${id}`);
        toast.success("Order deleted successfully!");
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order");
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">T-Shirt Print Orders</h2>
        <p className="text-sm text-gray-500 mt-1">Review existing custom print orders and manage them.</p>
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
              placeholder="Search by ID, Name or Phone..."
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

            {/* Add New Order Button */}
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
            >
              <FaPlus size={12} /> Add New Order
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-4 w-16 text-center">S No</th>
                <th className="px-4 py-4">Order ID</th>
                <th className="px-4 py-4">Customer Info</th>
                <th className="px-4 py-4">Design / Logo</th>
                <th className="px-4 py-4">Products</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, idx) => (
                  <tr key={order.order_id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-center font-medium text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                        {order.order_id}
                      </span>
                      <div className="text-xs text-gray-400 mt-2">{formatDate(order.created_at)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800">{order.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.phone}</p>
                      {order.email && <p className="text-xs text-gray-400">{order.email}</p>}
                    </td>
                    <td className="px-4 py-4">
                      {order.logo ? (
                        <img
                          src={order.logo}
                          alt="Logo"
                          className="w-14 h-14 object-contain rounded-lg border border-gray-200 shadow-sm bg-gray-50"
                        />
                      ) : (
                        <span className="text-xs text-gray-400 italic">No Design</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                        {order.products?.map((p, i) => (
                          <div key={i} className="text-xs bg-gray-100 px-2 py-1.5 rounded flex flex-wrap gap-2 items-center">
                            <span className="font-semibold text-gray-700">{p.printType}</span>
                            <span className="bg-white border px-1.5 py-0.5 rounded text-[10px]">{p.color} - {p.size}</span>
                            <span className="ml-auto font-bold text-blue-600">x{p.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 hover:text-blue-800 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.order_id)}
                          className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100 hover:text-red-800 cursor-pointer transition-colors"
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
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    <FaPrint className="mx-auto text-4xl mb-3 text-gray-300" />
                    <p className="font-medium text-lg text-gray-600">No print orders found</p>
                    <p className="text-sm">Try adjusting your search or add a new order.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded">
                      {order.order_id}
                    </span>
                    <h3 className="font-bold text-gray-800 mt-2 text-lg">{order.name}</h3>
                    <p className="text-sm text-gray-500">{order.phone}</p>
                  </div>
                  {order.logo && (
                    <img
                      src={order.logo}
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded-lg border border-gray-100 bg-gray-50 shadow-sm"
                    />
                  )}
                </div>

                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {order.products?.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="text-xs">
                        <span className="font-bold text-gray-700 block">{p.printType}</span>
                        <span className="text-gray-500">{p.color} - {p.size}</span>
                      </div>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        x{p.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {order.testimonial && (
                  <div className="mb-4 bg-purple-50 text-purple-800 p-2.5 rounded text-xs italic border border-purple-100">
                    "{order.testimonial}"
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(order)}
                      className="text-blue-600 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(order.order_id)}
                      className="text-red-600 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <FaPrint className="mx-auto text-4xl mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">No print orders found.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:w-[600px] h-full bg-white shadow-2xl relative flex flex-col overflow-y-auto animate-[slideIn_0.3s_ease-out]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 flex justify-between items-center text-white sticky top-0 z-10 shadow-md">
              <div>
                <h3 className="text-xl font-bold">{editingId ? "Edit Print Order" : "Add New Print Order"}</h3>
                <p className="text-blue-200 text-sm mt-1">Fill out the form details below.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors cursor-pointer"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter full name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Phone *</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g. +91 9876543210"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Email (Optional)</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Upload Logo / Design</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-2">
                      <FaPlus size={12} /> Choose File
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {form.logo && (
                      <img src={form.logo} alt="Preview" className="h-12 w-auto object-contain rounded border border-gray-200 shadow-sm" />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaPrint className="text-blue-600" /> Print Details
                  </h4>
                  <div className="space-y-4">
                    {form.products.map((product, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                        {form.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 cursor-pointer bg-white rounded-md shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Product"
                          >
                            <FaTimes size={10} />
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Color *</label>
                            <select
                              name="color"
                              value={product.color}
                              onChange={(e) => handleProductChange(index, e)}
                              required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            >
                              <option value="">Select</option>
                              <option value="Black">Black</option>
                              <option value="White">White</option>
                              <option value="Red">Red</option>
                              <option value="Blue">Blue</option>
                              <option value="Green">Green</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Size *</label>
                            <select
                              name="size"
                              value={product.size}
                              onChange={(e) => handleProductChange(index, e)}
                              required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            >
                              <option value="">Select</option>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Print Type *</label>
                            <input
                              name="printType"
                              value={product.printType}
                              onChange={(e) => handleProductChange(index, e)}
                              required
                              placeholder="e.g. Front Logo"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity *</label>
                            <input
                              type="number"
                              name="quantity"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, e)}
                              required min={1}
                              placeholder="e.g. 10"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={addProduct}
                    className="mt-4 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer w-full border border-blue-200 border-dashed"
                  >
                    + Add Another Product Variant
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Testimonial / Notes</label>
                  <textarea
                    name="testimonial"
                    value={form.testimonial}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Customer instructions or feedback..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-sm resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-blue-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-800 shadow-md transition-colors cursor-pointer"
                  >
                    {editingId ? "Update Order" : "Submit Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default GetOrdersDetails;
