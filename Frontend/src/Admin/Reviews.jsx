import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar, FaEdit, FaTrash } from "react-icons/fa";
import api from "../api";
import toast from "react-hot-toast";

const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<FaStar key={i} className="text-yellow-400" />);
    else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
    else stars.push(<FaRegStar key={i} className="text-yellow-400" />);
  }
  return stars;
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    name: "",
    product: "",
    rating: 0,
    comment: "",
    featured: false,
    image: "",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get("/reviews");
      if (data.success) setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setForm((prev) => ({ ...prev, image: dataUrl }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.product || !form.comment || form.rating < 0 || form.rating > 5) {
      alert("Please fill all fields correctly.");
      return;
    }

    const payload = {
      name: form.name,
      product: form.product,
      rating: parseFloat(form.rating),
      comment: form.comment,
      featured: form.featured || false,
      image: form.image,
    };

    try {
      if (editingId) {
        await api.put(`/reviews/${editingId}`, payload);
        toast.success("Review updated!");
        setEditingId(null);
      } else {
        await api.post("/reviews", payload);
        toast.success("Review added!");
      }
      setForm({ name: "", product: "", rating: 0, comment: "", featured: false, image: "" });
      fetchReviews();
    } catch (err) {
      console.error("Error saving review:", err);
      toast.error("Failed to save review.");
    }
  };

  const handleEdit = (review) => {
    setForm({
      name: review.name,
      product: review.product,
      rating: review.rating,
      comment: review.comment,
      featured: review.featured ? true : false,
      image: review.image || "",
    });
    setEditingId(review.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await api.delete(`/reviews/${id}`);
        toast.success("Review deleted!");
        fetchReviews();
      } catch (err) {
        console.error("Error deleting review:", err);
        toast.error("Failed to delete review.");
      }
    }
  };

  const toggleFeatured = async (id, currentStatus) => {
    try {
      await api.patch(`/reviews/${id}/featured`, { featured: !currentStatus });
      toast.success("Featured status updated!");
      fetchReviews();
    } catch (err) {
      console.error("Error updating featured:", err);
      toast.error("Failed to update featured status.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      <h2 className="text-3xl font-bold text-blue-900 mb-4">Product Reviews</h2>
      <p className="text-sm text-gray-500">Submit and manage customer reviews.</p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-6 rounded-xl shadow"
      >
        {/* Customer Name */}
        <div>
          <label className="block text-sm text-gray-600 mb-1" htmlFor="name">Customer Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm text-gray-600 mb-1" htmlFor="product">Product Name</label>
          <input
            id="product"
            type="text"
            placeholder="Product you purchased"
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm text-gray-600 mb-1" htmlFor="rating">Rating (0 to 5)</label>
          <input
            id="rating"
            type="number"
            step="0.5"
            min="0"
            max="5"
            placeholder="e.g. 4.5"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Featured */}
        <div>
          <label className="block text-sm text-gray-600 mb-1" htmlFor="featured">Feature on Home</label>
          <select
            id="featured"
            value={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.value === "true" })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="false">Not Featured</option>
            <option value="true">Feature on Home</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm text-gray-600 mb-1" htmlFor="image">Image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {form.image && (
            <img src={form.image} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded" />
          )}
        </div>

        {/* Comment */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm text-gray-600 mb-1" htmlFor="comment">Review</label>
          <textarea
            id="comment"
            rows={3}
            placeholder="Write your review..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Submit */}
        <div className="col-span-1 sm:col-span-2 text-right">
          <button
            type="submit"
            className="bg-blue-900 cursor-pointer hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {editingId ? "Update Review" : "Submit Review"}
          </button>
        </div>
      </form>

      {/* Reviews Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg shadow p-5 border border-gray-100 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-gray-800">{review.name}</h3>
                <span className="text-sm text-gray-500">{review.date}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2"><strong>Product:</strong> {review.product}</p>
              <div className="flex items-center mb-2">{renderStars(review.rating)}</div>
              <p className="text-gray-700 text-sm mb-4">{review.comment}</p>
              {review.image && (
                <img src={review.image} alt="Review" className="w-full h-40 object-cover rounded-md mb-4" />
              )}
            </div>

            <div className="flex justify-between items-center gap-2">
              <button
                onClick={() => toggleFeatured(review.id, review.featured)}
                className={`text-xs px-3 py-1 rounded transition font-medium ${
                  review.featured
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {review.featured ? "🌟 Featured" : "Mark as Featured"}
              </button>

              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(review)}
                  className="border-1 border-gray-400 p-2 rounded-full text-green-400 font-bold hover:text-blue-800 text-sm"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="border-1 border-gray-400 p-2 rounded-full text-orange-400  hover:text-red-800 text-sm"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
