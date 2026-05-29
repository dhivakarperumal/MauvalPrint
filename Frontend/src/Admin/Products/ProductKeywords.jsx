import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaSearch } from "react-icons/fa";

const ProductKeywords = () => {
  const [keywords, setKeywords] = useState([]);
  const [stats, setStats] = useState({
    totalKeywords: 0,
    activeKeywords: 0,
    productsTagged: 0,
    mostUsedKeyword: "N/A"
  });
  
  const [newKeyword, setNewKeyword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const filteredKeywords = keywords.filter(kw => kw.keyword_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Product Keywords Manager</h2>
        <p className="text-gray-500 text-sm">Manage dynamic tags for product grouping on frontend</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-500 text-sm font-semibold mb-1">Total Keywords</h3>
          <p className="text-3xl font-bold text-blue-900">{stats.totalKeywords}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-500 text-sm font-semibold mb-1">Active Keywords</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeKeywords}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-500 text-sm font-semibold mb-1">Products Tagged</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.productsTagged}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-500 text-sm font-semibold mb-1">Most Used Keyword</h3>
          <p className="text-xl font-bold text-orange-500 truncate w-full px-2" title={stats.mostUsedKeyword}>
            {stats.mostUsedKeyword}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Add New Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Add New Keyword</h3>
            <form onSubmit={handleAddKeyword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword Name</label>
                <input
                  type="text"
                  required
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g. Trending, Oversize..."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-900 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-800 transition"
              >
                <FaPlus size={14} /> Add Keyword
              </button>
            </form>
          </div>
        </div>

        {/* List & Search */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200 min-h-[400px]">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-700">All Keywords</h3>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search keywords..."
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring focus:ring-blue-100 w-48 sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-800 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Keyword Name</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredKeywords.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-6 text-center text-gray-400">No keywords found.</td>
                    </tr>
                  ) : (
                    filteredKeywords.map(kw => (
                      <tr key={kw.keyword_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {editingId === kw.keyword_id ? (
                            <input 
                              type="text" 
                              value={editKeywordName} 
                              onChange={(e) => setEditKeywordName(e.target.value)}
                              className="border border-blue-400 rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            kw.keyword_name
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                           <button 
                             onClick={() => handleToggleStatus(kw.keyword_id, kw.status)}
                             className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${kw.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                           >
                             {kw.status.toUpperCase()}
                           </button>
                        </td>
                        <td className="py-3 px-4 flex justify-end gap-2">
                          {editingId === kw.keyword_id ? (
                            <>
                              <button onClick={() => saveEdit(kw.keyword_id)} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition" title="Save">
                                <FaCheck size={12}/>
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition" title="Cancel">
                                <FaTimes size={12}/>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(kw)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition" title="Edit">
                                <FaEdit size={14}/>
                              </button>
                              <button onClick={() => handleDelete(kw.keyword_id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition" title="Delete">
                                <FaTrash size={14}/>
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
      </div>
    </div>
  );
};

export default ProductKeywords;
