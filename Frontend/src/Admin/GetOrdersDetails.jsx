import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";

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
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState(null); // Track editing

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, "getOrdersDetails"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const orderData = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      testimonial: form.testimonial,
      logoBase64: form.logo,
      timestamp: serverTimestamp(),
      products: form.products.map((p) => ({ ...p, quantity: Number(p.quantity) })),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "getOrdersDetails", editingId), orderData);
        toast.success("Order updated successfully!");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "getOrdersDetails"), orderData);
        toast.success("Order submitted successfully!");
      }

      setForm({
        name: "",
        phone: "",
        email: "",
        testimonial: "",
        logo: "",
        products: [{ color: "", size: "", quantity: "", printType: "" }],
      });
      fetchOrders();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to submit order");
    }
  };

  const handleEdit = (order) => {
    setForm({
      name: order.name,
      phone: order.phone,
      email: order.email,
      testimonial: order.testimonial,
      logo: order.logoBase64 || "",
      products: order.products || [{ color: "", size: "", quantity: "", printType: "" }],
    });
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "getOrdersDetails", id));
        toast.success("Order deleted successfully!");
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "-";
    const date = timestamp.toDate();
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[#192f59]">T-Shirt Print Orders</h2>
          <p className="text-sm text-gray-500">Add new print order or review existing orders</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowForm(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
              showForm ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Add Form
          </button>
          <button
            onClick={() => setShowForm(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
              !showForm ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Show Orders
          </button>
        </div>
      </div>

      <div className="p-6 mt-7 bg-white rounded-xl shadow space-y-6 max-w-7xl mx-auto">
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="e.g. +91 9876543210"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="example@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full mb-2"
              />
              {form.logo && (
                <img
                  src={form.logo}
                  alt="Logo Preview"
                  className="h-20 border rounded object-contain mt-1"
                />
              )}
            </div>

            {/* Product Variants */}
            {form.products.map((product, index) => (
              <div key={index} className="md:col-span-2 rounded-lg p-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <select
                      name="color"
                      value={product.color}
                      onChange={(e) => handleProductChange(index, e)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Color</option>
                      <option value="Black">Black</option>
                      <option value="White">White</option>
                      <option value="Red">Red</option>
                      <option value="Blue">Blue</option>
                      <option value="Green">Green</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <select
                      name="size"
                      value={product.size}
                      onChange={(e) => handleProductChange(index, e)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Size</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, e)}
                      required
                      min={1}
                      placeholder="e.g. 25"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Print Type</label>
                    <input
                      name="printType"
                      value={product.printType}
                      onChange={(e) => handleProductChange(index, e)}
                      required
                      placeholder="e.g. Logo, Text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {form.products.length > 1 && (
                  <div className="text-right mt-2">
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-sm cursor-pointer text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={addProduct}
                className="text-blue-600 cursor-pointer hover:underline text-sm"
              >
                + Add Another Product
              </button>
            </div>

            {/* Testimonial */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial (optional)</label>
              <textarea
                name="testimonial"
                value={form.testimonial}
                onChange={handleChange}
                rows="3"
                placeholder="What did the customer say?"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 text-right">
              <button
                type="submit"
                className="bg-blue-900 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingId ? "Update Order" : "Submit Order"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            {orders.length === 0 ? (
              <p className="text-gray-500">No orders yet.</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto shadow rounded-lg mt-6">
                  <table className="min-w-[900px] w-full text-sm text-left">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Logo</th>
                        <th className="p-2">Products</th>
                        <th className="p-2">Testimonial</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-300 hover:bg-gray-50">
                          <td className="p-2">{order.name}</td>
                          <td className="p-2">{order.phone}</td>
                          <td className="p-2">
                            {order.logoBase64 ? (
                              <img
                                src={order.logoBase64}
                                alt="Logo"
                                className="w-12 h-12 object-contain rounded border"
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-2">
                            {order.products?.map((p, i) => (
                              <div key={i}>
                                <b>Color:</b> {p.color}, <b>Size:</b> {p.size},{" "}
                                <b>Qty:</b> {p.quantity}, <b>Type:</b> {p.printType}
                              </div>
                            ))}
                          </td>
                          <td className="p-2 italic text-gray-600">{order.testimonial || "-"}</td>
                          <td className="p-2">{formatDate(order.timestamp)}</td>
                          <td className="p-2 flex items-center justify-center mt-4 gap-2">
                            <button
                              onClick={() => handleEdit(order)}
                              className="text-green-500 cursor-pointer border-2 border-gray-200 p-2 rounded-full hover:text-blue-800"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="text-black border-2 cursor-pointer border-gray-200 p-2 rounded-full hover:text-red-800"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-semibold">{order.name}</h3>
                        <span className="text-sm text-gray-500">{order.phone}</span>
                      </div>
                      {order.logoBase64 && (
                        <img
                          src={order.logoBase64}
                          alt="Logo"
                          className="w-16 h-16 object-contain mb-2"
                        />
                      )}
                      <div className="text-sm text-gray-700 mb-1">
                        {order.products?.map((p, i) => (
                          <div key={i}>
                            <b>Color:</b> {p.color}, <b>Size:</b> {p.size}, <b>Qty:</b> {p.quantity},{" "}
                            <b>Type:</b> {p.printType}
                          </div>
                        ))}
                      </div>
                      <p className="italic text-sm text-gray-500">{order.testimonial || "-"}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(order.timestamp)}</p>
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-blue-600 cursor-pointer flex items-center gap-1"
                        >
                          <FaEdit /> 
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 cursor-pointer flex items-center gap-1"
                        >
                          <FaTrash /> 
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetOrdersDetails;
