import React, { useState, useEffect, useMemo } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaTimes, FaTh, FaList, FaUserTie } from "react-icons/fa";

const Dealers = () => {
  const [dealer, setDealer] = useState({
    dealerName: "",
    gstNumber: "",
    phone: "",
    email: "",
    address: "",
    invoiceNumber: "",
  });

  const [dealersList, setDealersList] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchDealers = async () => {
    try {
      const res = await api.get("/dealers");
      if (res.data.success) {
        const data = res.data.dealers.map((d) => {
          let extraData = {};
          try {
            if (d.data) {
              extraData = JSON.parse(d.data);
            }
          } catch (err) {}
          return {
            id: d.id,
            dealerId: d.dealer_id,
            dealerName: d.name,
            email: d.email,
            phone: d.phone,
            address: d.address,
            gstNumber: extraData.gstNumber || "",
            invoiceNumber: extraData.invoiceNumber || "",
          };
        });
        setDealersList(data);
      }
    } catch (error) {
      console.error("Error fetching dealers:", error);
      toast.error("Failed to fetch dealers.");
    }
  };

  const fetchInvoiceOptions = async () => {
    try {
      const res = await api.get("/dealers/invoices/options");
      if (res.data.success) {
        setInvoiceOptions(res.data.invoices);
      }
    } catch (error) {
      console.error("Error fetching invoice numbers:", error);
      toast.error("Failed to load invoice numbers.");
    }
  };

  useEffect(() => {
    fetchDealers();
    fetchInvoiceOptions();
  }, []);

  const filteredDealers = useMemo(() => {
    return dealersList.filter(d => 
      d.dealerName?.toLowerCase().includes(search.toLowerCase()) || 
      d.dealerId?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search)
    );
  }, [dealersList, search]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredDealers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredDealers.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filteredDealers, currentPage, totalPages]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDealer((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setDealer({
      dealerName: "",
      gstNumber: "",
      phone: "",
      email: "",
      address: "",
      invoiceNumber: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/dealers/${editingId}`, dealer);
        toast.success("Dealer updated successfully!");
      } else {
        await api.post("/dealers", dealer);
        toast.success("Dealer added successfully!");
      }
      resetForm();
      fetchDealers();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving dealer:", error);
      toast.error("Failed to save dealer.");
    }

    setLoading(false);
  };

  const handleEdit = (d) => {
    setDealer({
      dealerName: d.dealerName || "",
      gstNumber: d.gstNumber || "",
      phone: d.phone || "",
      email: d.email || "",
      address: d.address || "",
      invoiceNumber: d.invoiceNumber || "",
    });
    setEditingId(d.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this dealer?")) {
      try {
        await api.delete(`/dealers/${id}`);
        toast.success("Dealer deleted!");
        fetchDealers();
      } catch (error) {
        console.error("Error deleting dealer:", error);
        toast.error("Failed to delete dealer.");
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Dealer Details</h2>
        <p className="text-sm text-gray-500 mt-1">View and manage dealer records and information.</p>
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

            {/* Add New Dealer Button */}
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
            >
              <FaPlus size={12} /> Add Dealer
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-4 w-16 text-center">S No</th>
                <th className="px-4 py-4">Dealer Info</th>
                <th className="px-4 py-4">Contact</th>
                <th className="px-4 py-4">GST / Invoice</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((d, index) => (
                  <tr key={d.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-5 text-center font-medium text-gray-500 align-middle">
                      {indexOfFirst + index + 1}
                    </td>
                    <td className="px-4 py-5 align-middle">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-blue-200 uppercase tracking-wide">
                          {d.dealerId}
                        </span>
                        <span className="font-bold text-gray-900 text-base">{d.dealerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-middle">
                      <div className="space-y-1">
                        <p className="text-gray-900 font-semibold text-sm">{d.phone}</p>
                        <p className="text-xs text-gray-500 font-medium">{d.email}</p>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-xs break-words" title={d.address}>{d.address}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-middle">
                      <div className="flex gap-4">
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 min-w-[100px]">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">GST No</p>
                          <p className="text-sm font-bold text-gray-700">{d.gstNumber || "N/A"}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 min-w-[100px]">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Invoice</p>
                          <p className="text-sm font-bold text-gray-700">{d.invoiceNumber || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(d)}
                          className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 hover:text-blue-800 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
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
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    <FaUserTie className="mx-auto text-4xl mb-3 text-gray-300" />
                    <p className="font-medium text-lg text-gray-600">No dealers found</p>
                    <p className="text-sm">Try adjusting your search or add a new dealer.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.length > 0 ? (
            currentItems.map((d) => (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded">
                      {d.dealerId}
                    </span>
                    <h3 className="font-bold text-gray-800 mt-2 text-lg">{d.dealerName}</h3>
                  </div>
                  <div className="bg-gray-100 p-2 rounded-full text-gray-400">
                    <FaUserTie size={16} />
                  </div>
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Contact</p>
                    <p className="text-sm font-medium text-gray-700">{d.phone}</p>
                    <p className="text-xs text-gray-500">{d.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Address</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{d.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">GST No</p>
                      <p className="text-xs font-bold text-gray-700">{d.gstNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Invoice</p>
                      <p className="text-xs font-bold text-gray-700">{d.invoiceNumber || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-auto">
                  <button
                    onClick={() => handleEdit(d)}
                    className="text-blue-600 bg-blue-50 px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-red-600 bg-red-50 px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <FaUserTie className="mx-auto text-4xl mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">No dealers found.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-4 mt-6 bg-white border border-gray-200 rounded-xl shadow-sm gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md text-sm py-1 px-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Showing {filteredDealers.length === 0 ? 0 : indexOfFirst + 1} to {Math.min(indexOfLast, filteredDealers.length)} of {filteredDealers.length} items
            </p>
          </div>
          
          {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => {
                const page = idx + 1;
                const shouldShow = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
                
                if (!shouldShow) {
                  if ((page === 2 && currentPage > 4) || (page === totalPages - 1 && currentPage < totalPages - 3)) {
                    return <span key={page} className="px-2 text-gray-400 font-medium">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              Next
            </button>
          </div>
          )}
        </div>
      )}

      {/* Add / Edit Dealer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:w-[500px] h-full bg-white shadow-2xl relative flex flex-col overflow-y-auto animate-[slideIn_0.3s_ease-out]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 flex justify-between items-center text-white sticky top-0 z-10 shadow-md">
              <div>
                <h3 className="text-xl font-bold">{editingId ? "Edit Dealer" : "Add New Dealer"}</h3>
                <p className="text-blue-200 text-sm mt-1">Fill out the dealer details below.</p>
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
                
                {!editingId && (
                  <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-semibold">Dealer ID:</span>
                    <span className="font-bold font-mono bg-white px-2 py-1 rounded shadow-sm text-sm">
                      MD{String(dealersList.length + 1).padStart(3, "0")}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Dealer Name *</label>
                  <input
                    name="dealerName"
                    value={dealer.dealerName}
                    onChange={handleChange}
                    required
                    placeholder="Enter dealer's name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Phone Number *</label>
                    <input
                      name="phone"
                      value={dealer.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g. +91 9876543210"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      value={dealer.email}
                      onChange={handleChange}
                      required
                      placeholder="dealer@example.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">GST Number *</label>
                  <input
                    name="gstNumber"
                    value={dealer.gstNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter GST number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Full Address *</label>
                  <textarea
                    name="address"
                    value={dealer.address}
                    onChange={handleChange}
                    required
                    rows="3"
                    placeholder="Enter full address"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Select Invoice Number *</label>
                  <select
                    name="invoiceNumber"
                    value={dealer.invoiceNumber}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                  >
                    <option value="">-- Select invoice number --</option>
                    {invoiceOptions.map((inv) => (
                      <option key={inv} value={inv}>{inv}</option>
                    ))}
                  </select>
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
                    disabled={loading}
                    className="flex-[2] bg-blue-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-800 shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : editingId ? "Update Dealer" : "Add Dealer"}
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

export default Dealers;
