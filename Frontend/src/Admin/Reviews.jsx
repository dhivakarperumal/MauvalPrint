import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar, FaEdit, FaTrash, FaPlus, FaSearch, FaTable, FaThLarge, FaTimes } from "react-icons/fa";
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
  
  // New States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"

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
      setIsModalOpen(false);
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
    setIsModalOpen(true);
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

  const openAddModal = () => {
    setForm({ name: "", product: "", rating: 0, comment: "", featured: false, image: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const filteredReviews = reviews.filter((r) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReviews = reviews.length;
  const featuredReviews = reviews.filter((r) => r.featured).length;
  const standardReviews = reviews.filter((r) => !r.featured).length;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
      
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-blue-900">Reviews Management</h2>
        <p className="text-sm text-gray-500 mt-1">View, edit, and feature customer reviews.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Total Reviews</p>
              <h3 className="text-4xl font-black">{totalReviews}</h3>
            </div>
            <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FaStar className="text-3xl text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-300"></div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold uppercase tracking-wider mb-1">Featured</p>
              <h3 className="text-4xl font-black">{featuredReviews}</h3>
            </div>
            <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FaStar className="text-3xl text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-300"></div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider mb-1">Standard</p>
              <h3 className="text-4xl font-black">{standardReviews}</h3>
            </div>
            <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FaRegStar className="text-3xl text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-300"></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Search */}
        <div className="relative w-full sm:w-72 md:w-96">
          <input 
            type="text" 
            placeholder="Search reviews..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        {/* Right Side: View Toggle & Add Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto justify-center">
            <button 
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Card View"
            >
              <FaThLarge />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Table View"
            >
              <FaTable />
            </button>
          </div>
          
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto justify-center cursor-pointer"
          >
            <FaPlus /> Add New Review
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? "Edit Review" : "Add New Review"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                <FaTimes size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="col-span-1 sm:col-span-2 text-right mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold mr-3 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-900 cursor-pointer hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  {editingId ? "Update Review" : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Display */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.length > 0 ? filteredReviews.map((review) => (
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
                  type="button"
                  onClick={() => toggleFeatured(review.id, review.featured)}
                  className={`cursor-pointer text-xs px-3 py-1 rounded transition font-medium ${
                    review.featured
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {review.featured ? "🌟 Featured" : "Mark as Featured"}
                </button>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(review)}
                    className="border-1 border-gray-400 p-2 cursor-pointer rounded-full text-green-400 font-bold hover:text-blue-800 text-sm"
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    className="border-1 border-gray-400 p-2 cursor-pointer rounded-full text-orange-400 hover:text-red-800 text-sm"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-10 text-gray-500">No reviews found.</div>
          )}
        </div>
      ) : (
            <div className="hidden md:block overflow-x-auto shadow rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
              <tr className="">
                <th className="p-4 font-medium w-16">S.No</th>
                <th className="p-4 font-medium">Image</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium min-w-[100px]">Rating</th>
                <th className="p-4 font-medium">Review</th>
                <th className="p-4 font-medium text-center">Featured</th>
                <th className="p-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length > 0 ? filteredReviews.map((review, index) => (
                <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-gray-500 font-medium text-center">{index + 1}</td>
                  <td className="p-4">
                    {review.image ? (
                      <img src={review.image} alt="Review" className="w-12 h-12 object-cover rounded-md" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">No img</div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{review.name}</td>
                  <td className="p-4 text-gray-600">{review.product}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                  </td>
                  <td className="p-4 text-gray-600 text-sm max-w-xs truncate" title={review.comment}>{review.comment}</td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(review.id, review.featured)}
                      className={`cursor-pointer text-xs px-2 py-1 rounded transition font-medium ${
                        review.featured ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {review.featured ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button type="button" onClick={() => handleEdit(review)} className="text-green-500 hover:text-green-700 cursor-pointer transition-colors p-1">
                        <FaEdit size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(review.id)} className="text-red-500 hover:text-red-700 cursor-pointer transition-colors p-1">
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">No reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reviews;
