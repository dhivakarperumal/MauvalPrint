import React, { useState } from "react";

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    productId: "",
    category: "",
    originalPrice: "",
    discountPercent: "",
    offerPrice: "",
    image: null,
    imagePreview: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let updatedForm = { ...form };

    if (name === "image" && files.length > 0) {
      const file = files[0];
      updatedForm.image = file;

      const reader = new FileReader();
      reader.onloadend = () => {
        updatedForm.imagePreview = reader.result;
        setForm({ ...updatedForm });
      };
      reader.readAsDataURL(file);
    } else {
      updatedForm[name] = value;

      // Auto-calculate offer price
      const price = parseFloat(
        name === "originalPrice" ? value : updatedForm.originalPrice || 0
      );
      const discount = parseFloat(
        name === "discountPercent" ? value : updatedForm.discountPercent || 0
      );
      if (!isNaN(price) && !isNaN(discount)) {
        updatedForm.offerPrice = (price - (price * discount) / 100).toFixed(2);
      }

      setForm(updatedForm);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, productId, category, originalPrice, offerPrice, imagePreview } = form;

    if (!name || !productId || !category || !originalPrice || !offerPrice || !imagePreview) {
      alert("⚠️ Please fill all fields and upload an image.");
      return;
    }

    setOffers([
      {
        ...form,
        id: Date.now(),
      },
      ...offers,
    ]);

    setForm({
      name: "",
      productId: "",
      category: "",
      originalPrice: "",
      discountPercent: "",
      offerPrice: "",
      image: null,
      imagePreview: null,
    });

    // Reset file input manually
    document.getElementById("imageInput").value = "";
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
     <div>
       <h2 className="text-2xl font-bold text-blue-900">Add Offer Product</h2>
      <p className="text-sm text-gray-500 mb-1">
          Fill in the details to add offers.
        </p>
     </div>

     <form
  onSubmit={handleSubmit}
  className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl shadow"
>
  {/* Product Name */}
  <div>
    <label className="block text-sm text-gray-600 mb-1" htmlFor="name">Product Name</label>
    <input
      id="name"
      type="text"
      name="name"
      value={form.name}
      onChange={handleChange}
      placeholder="Enter product name"
      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>

  {/* Product ID */}
  <div>
    <label className="block text-sm text-gray-600 mb-1" htmlFor="productId">Product ID</label>
    <input
      id="productId"
      type="text"
      name="productId"
      value={form.productId}
      onChange={handleChange}
      placeholder="Unique product ID (e.g., TS001)"
      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>

  {/* Category */}
  <div>
    <label className="block text-sm text-gray-600 mb-1" htmlFor="category">Category</label>
    <select
      id="category"
      name="category"
      value={form.category}
      onChange={handleChange}
      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    >
      <option value="">Select category</option>
      <option value="tshirts">T-Shirts</option>
      <option value="jackets">Jackets</option>
      <option value="hoodies">Hoodies</option>
      <option value="kids">Kids</option>
    </select>
  </div>

  {/* Original Price */}
  <div>
    <label className="block text-sm text-gray-600 mb-1" htmlFor="originalPrice">Original Price (₹)</label>
    <input
      id="originalPrice"
      type="number"
      name="originalPrice"
      value={form.originalPrice}
      onChange={handleChange}
      min={0}
      placeholder="Enter original price"
      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>

  {/* Discount Percent */}
  <div>
    <label className="block text-sm text-gray-600 mb-1" htmlFor="discountPercent">Discount (%)</label>
    <input
      id="discountPercent"
      type="number"
      name="discountPercent"
      value={form.discountPercent}
      onChange={handleChange}
      min={0}
      placeholder="Enter discount percentage"
      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>

  {/* Offer Price (read-only) */}
  <div>
    <label className="block text-sm text-gray-600 mb-1" htmlFor="offerPrice">Offer Price (₹)</label>
    <input
      id="offerPrice"
      type="number"
      name="offerPrice"
      value={form.offerPrice}
      onChange={handleChange}
      placeholder="Auto-calculated offer price"
      className="w-full border border-gray-300 p-2 rounded bg-gray-100"
      readOnly
    />
  </div>

  {/* Image Upload */}
  <div>
    <label className="block text-sm text-gray-600 mb-1" htmlFor="imageInput">Product Image</label>
    <input
      id="imageInput"
      type="file"
      name="image"
      accept="image/*"
      onChange={handleChange}
      className="w-full border border-gray-300 p-2 rounded focus:outline-none"
    />
  </div>

  {/* Image Preview */}
  {form.imagePreview && (
    <div className="flex items-center">
      <img
        src={form.imagePreview}
        alt="Preview"
        className="h-24 w-24 object-cover rounded"
      />
    </div>
  )}

  {/* Submit Button */}
  <div className="md:col-span-2 text-right">
    <button
      type="submit"
      className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
    >
      Add Offer
    </button>
  </div>
</form>


      <h3 className="text-xl font-semibold text-gray-700">Offer Product List</h3>
     {/* Desktop Table View */}
<div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow">
  <table className="min-w-full text-sm text-left">
    <thead className="bg-gray-800 text-white">
      <tr>
        <th className="px-4 py-2">Image</th>
        <th className="px-4 py-2">Product</th>
        <th className="px-4 py-2">Product ID</th>
        <th className="px-4 py-2">Category</th>
        <th className="px-4 py-2">Original Price</th>
        <th className="px-4 py-2">Discount %</th>
        <th className="px-4 py-2">Offer Price</th>
      </tr>
    </thead>
    <tbody className="divide-y">
      {offers.length > 0 ? (
        offers.map((offer) => (
          <tr key={offer.id} className="hover:bg-gray-50">
            <td className="px-4 py-2">
              <img
                src={offer.imagePreview}
                alt={offer.name}
                className="h-12 w-12 object-cover rounded"
              />
            </td>
            <td className="px-4 py-2 font-medium">{offer.name}</td>
            <td className="px-4 py-2">{offer.productId}</td>
            <td className="px-4 py-2 capitalize">{offer.category}</td>
            <td className="px-4 py-2">₹{offer.originalPrice}</td>
            <td className="px-4 py-2">{offer.discountPercent}%</td>
            <td className="px-4 py-2 font-semibold text-green-600">
              ₹{offer.offerPrice}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="7" className="px-4 py-3 text-center text-gray-500">
            No offer products added yet.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

{/* Mobile Card View */}
<div className="block md:hidden space-y-4">
  {offers.length > 0 ? (
    offers.map((offer) => (
      <div
        key={offer.id}
        className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <img
            src={offer.imagePreview}
            alt={offer.name}
            className="h-16 w-16 object-cover rounded"
          />
          <div>
            <h3 className="font-semibold text-gray-800">{offer.name}</h3>
            <p className="text-sm text-gray-500">{offer.productId}</p>
            <p className="text-xs capitalize text-gray-600">{offer.category}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 text-sm space-y-1 text-right sm:text-left">
          <p>Original: ₹{offer.originalPrice}</p>
          <p>Discount: {offer.discountPercent}%</p>
          <p className="text-green-600 font-semibold">Offer: ₹{offer.offerPrice}</p>
        </div>
      </div>
    ))
  ) : (
    <p className="text-center text-gray-500">No offer products added yet.</p>
  )}
</div>

    </div>
  );
};

export default Offers;
