import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaSearch } from "react-icons/fa";

const toRoman = (num) => {
  const lookup = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let roman = "";
  for (const [value, symbol] of lookup) {
    while (num >= value) { roman += symbol; num -= value; }
  }
  return roman;
};

const ProductKeywords = () => {
  const [keywords, setKeywords] = useState([
    { keyword_id: "default-1", keyword_name: "Trending", status: "active", show_on_home: false, display_order: 0 },
    { keyword_id: "default-2", keyword_name: "Best Seller", status: "active", show_on_home: false, display_order: 0 },
    { keyword_id: "default-3", keyword_name: "New Arrival", status: "active", show_on_home: false, display_order: 0 },
    { keyword_id: "default-4", keyword_name: "Custom Print", status: "active", show_on_home: false, display_order: 0 },
    { keyword_id: "default-5", keyword_name: "Featured", status: "active", show_on_home: false, display_order: 0 }
  ]);
  const [stats, setStats] = useState({
    totalKeywords: 0,
    activeKeywords: 0,
    productsTagged: 0,
    mostUsedKeyword: "N/A"
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("selected");
  const [showAddPopup, setShowAddPopup] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editKeywordName, setEditKeywordName] = useState("");

  const fetchData = async () => {
    try {
      const [kwRes, statRes] = await Promise.all([
        api.get("/keywords"),
        api.get("/keywords/stats")
      ]);
      if (kwRes.data.success) {
        setKeywords(kwRes.data.keywords);
      }
      if (statRes.data.success) {
        setStats(statRes.data.stats);
      }
    } catch (error) {
      console.error("Error fetching keywords data", error);
      toast.error("Failed to fetch keywords.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      const res = await api.post("/keywords", { keywordName: newKeyword.trim() });
      if (res.data.success) {
        toast.success("Keyword added!");
        setNewKeyword("");
        setShowAddPopup(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add keyword");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this keyword?")) return;
    try {
      const res = await api.delete(`/keywords/${id}`);
      if (res.data.success) {
        toast.success("Keyword deleted!");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to delete keyword.");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await api.put(`/keywords/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Keyword marked as ${newStatus}`);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const handleToggleHome = async (kw) => {
    const newVal = kw.show_on_home ? 0 : 1;
    // If enabling, assign next order number
    let newOrder = kw.display_order;
    if (newVal === 1 && !kw.display_order) {
      const homeKeywords = keywords.filter(k => k.show_on_home);
      newOrder = homeKeywords.length + 1;
    }
    if (newVal === 0) {
      newOrder = 0;
    }
    try {
      await api.put(`/keywords/${kw.keyword_id}`, { show_on_home: newVal, display_order: newOrder });
      toast.success(newVal ? "Showing on Home" : "Removed from Home");
      fetchData();
    } catch (error) {
      toast.error("Failed to update.");
    }
  };

  const handleOrderChange = async (kw, newOrder) => {
    try {
      await api.put(`/keywords/${kw.keyword_id}`, { display_order: parseInt(newOrder) || 0 });
      fetchData();
    } catch (error) {
      toast.error("Failed to update order.");
    }
  };

  const startEdit = (kw) => {
    setEditingId(kw.keyword_id);
    setEditKeywordName(kw.keyword_name);
  };

  const saveEdit = async (id) => {
    try {
      const res = await api.put(`/keywords/${id}`, { keywordName: editKeywordName.trim() });
      if (res.data.success) {
        toast.success("Keyword updated");
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update keyword");
    }
  };

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = kw.keyword_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === "selected") return kw.show_on_home;
    if (activeTab === "unselected") return !kw.show_on_home;
    return true;
  });

  // Get selected home keywords sorted by order
  const homeKeywords = keywords.filter(kw => kw.show_on_home).sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="p-6 max-w-7xl mx-auto">
     

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-500 text-sm font-semibold mb-1">Total Keywords</h3>
          <p className="text-3xl font-bold text-blue-900">{stats.totalKeywords}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-500 text-sm font-semibold mb-1">Active Keywords</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeKeywords}</p>
        </div>
      </div>

      {/* Home Display Order Preview */}
      {homeKeywords.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <h3 className="text-sm font-bold text-blue-900 mb-3">🏠 Home Page Display Order</h3>
          <div className="flex flex-wrap gap-2">
            {homeKeywords.map((kw, idx) => (
              <span key={kw.keyword_id} className="inline-flex items-center gap-1.5 bg-blue-900 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                <span className="bg-white text-blue-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{toRoman(idx + 1)}</span>
                {kw.keyword_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add New Keyword Popup */}
      {showAddPopup && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity">
          <div className="w-full sm:w-96 bg-white h-full shadow-2xl p-6 relative flex flex-col animate-[slideIn_0.3s_ease-out]">
            <button 
              onClick={() => setShowAddPopup(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-red-500 transition-colors"
            >
              <FaTimes size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Add New Keyword</h3>
            <form onSubmit={handleAddKeyword} className="flex flex-col flex-1">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Keyword Name</label>
                <input
                  type="text"
                  required
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g. Trending, Oversize..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-800 transition shadow-md cursor-pointer mt-auto sm:mt-0"
              >
                <FaPlus size={14} /> Add Keyword
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List & Search (Full Width) */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200 min-h-[400px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4  pb-4">
          <div className="flex gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === "all" ? "bg-blue-900 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"}`}
            >
              All Keywords
            </button>
            <button
              onClick={() => setActiveTab("selected")}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === "selected" ? "bg-blue-900 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"}`}
            >
              Selected
            </button>
            <button
              onClick={() => setActiveTab("unselected")}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === "unselected" ? "bg-blue-900 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"}`}
            >
              Unselected
            </button>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search keywords..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => setShowAddPopup(true)}
              className="bg-blue-900 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-800 transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <FaPlus size={14} /> Add New
            </button>
          </div>
        </div>

          <div className="hidden md:block overflow-x-auto shadow rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="py-3 px-3 font-semibold text-center">Home</th>
                    <th className="py-3 px-3 font-semibold text-center">Order</th>
                    <th className="py-3 px-4 font-semibold">Keyword Name</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredKeywords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-400">No keywords found.</td>
                    </tr>
                  ) : (
                    filteredKeywords.map(kw => (
                      <tr key={kw.keyword_id} className={`hover:bg-gray-50 ${kw.show_on_home ? 'bg-blue-50/50' : ''}`}>
                        {/* Home Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!kw.show_on_home}
                            onChange={() => handleToggleHome(kw)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                            title="Show on Home"
                          />
                        </td>
                        {/* Order (Roman numeral) */}
                        <td className="py-3 px-3 text-center">
                          {kw.show_on_home ? (
                            <select
                              value={kw.display_order || 1}
                              onChange={(e) => handleOrderChange(kw, e.target.value)}
                              className="border border-gray-300 rounded px-1 py-1 text-xs font-bold text-blue-900 bg-blue-50 w-16 text-center cursor-pointer"
                            >
                              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>{toRoman(n)}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        {/* Keyword Name */}
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {editingId === kw.keyword_id ? (
                            <input
                              type="text"
                              value={editKeywordName}
                              onChange={(e) => setEditKeywordName(e.target.value)}
                              className="border border-blue-400 rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {kw.keyword_name}
                              {kw.show_on_home ? (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">HOME</span>
                              ) : null}
                            </div>
                          )}
                        </td>
                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(kw.keyword_id, kw.status)}
                            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${kw.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {kw.status.toUpperCase()}
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="py-3 px-4 flex justify-end gap-2">
                          {editingId === kw.keyword_id ? (
                            <>
                              <button onClick={() => saveEdit(kw.keyword_id)} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition cursor-pointer" title="Save">
                                <FaCheck size={12} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition cursor-pointer" title="Cancel">
                                <FaTimes size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(kw)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition cursor-pointer" title="Edit">
                                <FaEdit size={14} />
                              </button>
                              <button onClick={() => handleDelete(kw.keyword_id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition cursor-pointer" title="Delete">
                                <FaTrash size={14} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

      </div>
    </div>
  );
};

export default ProductKeywords;
