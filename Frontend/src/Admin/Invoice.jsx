import React, { useState, useEffect, useMemo } from "react";
import api from "../api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaTimes, FaTh, FaList, FaFileInvoice, FaFileDownload } from "react-icons/fa";

const Invoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: "",
    invoiceDate: "",
    invoiceValue: "",
    invoiceGSTValue: "",
    invoiceTotalValue: "",
    transportAmount: "",
    billPdfBase64: null,
    billPdfName: "",
  });

  const [invoiceList, setInvoiceList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setInvoiceData((prev) => ({
        ...prev,
        billPdfBase64: reader.result,
        billPdfName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/invoices");
      if (res.data.success) {
        const data = res.data.invoices.map((inv) => ({
          id: inv.id,
          invoiceNo: inv.invoice_no,
          invoiceDate: inv.invoice_date,
          invoiceValue: inv.invoice_value,
          invoiceGSTValue: inv.gst_value,
          invoiceTotalValue: inv.total_value,
          transportAmount: inv.transport_amount,
          billPdfBase64: inv.bill_pdf_base64,
          billPdfName: inv.bill_pdf_name,
        }));
        setInvoiceList(data);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to fetch invoices.");
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoiceList.filter((inv) =>
      inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceDate?.includes(search)
    );
  }, [invoiceList, search]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filteredInvoices, currentPage, totalPages]);

  const resetForm = () => {
    setInvoiceData({
      invoiceNo: "",
      invoiceDate: "",
      invoiceValue: "",
      invoiceGSTValue: "",
      invoiceTotalValue: "",
      transportAmount: "",
      billPdfBase64: null,
      billPdfName: "",
    });
    setEditingId(null);
  };

  const handleAddOrUpdateInvoice = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/invoices/${editingId}`, invoiceData);
        toast.success("Invoice updated successfully!");
      } else {
        await api.post("/invoices", invoiceData);
        toast.success("Invoice added successfully!");
      }
      resetForm();
      fetchInvoices();
      setShowModal(false);
    } catch (error) {
      console.error("Error adding/updating invoice:", error);
      toast.error("Failed to save invoice.");
    }
  };

  const handleEdit = (invoice) => {
    setInvoiceData({
      invoiceNo: invoice.invoiceNo || "",
      invoiceDate: invoice.invoiceDate || "",
      invoiceValue: invoice.invoiceValue || "",
      invoiceGSTValue: invoice.invoiceGSTValue || "",
      invoiceTotalValue: invoice.invoiceTotalValue || "",
      transportAmount: invoice.transportAmount || "",
      billPdfBase64: invoice.billPdfBase64 || null,
      billPdfName: invoice.billPdfName || "",
    });
    setEditingId(invoice.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.delete(`/invoices/${id}`);
        toast.success("Invoice deleted!");
        fetchInvoices();
      } catch (err) {
        console.error("Error deleting invoice:", err);
        toast.error("Failed to delete invoice.");
      }
    }
  };

  const downloadInvoiceExcel = () => {
    if (invoiceList.length === 0) {
      toast.error("No invoices to export.");
      return;
    }

    const excelData = invoiceList.map((invoice, idx) => ({
      "S No": idx + 1,
      "Invoice No": invoice.invoiceNo,
      "Invoice Date": invoice.invoiceDate,
      "Invoice Value (₹)": invoice.invoiceValue,
      "GST Value (₹)": invoice.invoiceGSTValue,
      "Transport Amount (₹)": invoice.transportAmount,
      "Total Value (₹)": invoice.invoiceTotalValue,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Invoices.xlsx");
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Invoice System</h2>
        <p className="text-sm text-gray-500 mt-1">Manage, view, and export invoice records.</p>
      </div>

      {/* Top Bar: Search, View Toggles, Excel, Add Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search by Invoice No or Date..."
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

            {/* Export Button */}
            <button
              onClick={downloadInvoiceExcel}
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-100 transition-colors cursor-pointer border border-green-200"
            >
              <FaFileDownload size={12} /> Export Excel
            </button>

            {/* Add New Invoice Button */}
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
            >
              <FaPlus size={12} /> Add Invoice
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
                <th className="px-4 py-4">Invoice No</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Base Value</th>
                <th className="px-4 py-4">GST</th>
                <th className="px-4 py-4">Transport</th>
                <th className="px-4 py-4 text-green-400 font-bold">Total</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-center font-medium text-gray-500">
                      {indexOfFirst + index + 1}
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-800">
                      {item.invoiceNo || "N/A"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {item.invoiceDate}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-700">₹{item.invoiceValue}</td>
                    <td className="px-4 py-4 font-medium text-red-600">₹{item.invoiceGSTValue}</td>
                    <td className="px-4 py-4 font-medium text-blue-600">₹{item.transportAmount}</td>
                    <td className="px-4 py-4 font-black text-green-700">₹{item.invoiceTotalValue}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 hover:text-blue-800 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
                  <td colSpan="8" className="text-center py-12 text-gray-500">
                    <FaFileInvoice className="mx-auto text-4xl mb-3 text-gray-300" />
                    <p className="font-medium text-lg text-gray-600">No invoices found</p>
                    <p className="text-sm">Try adjusting your search or add a new invoice.</p>
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
            currentItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded">
                      {item.invoiceNo || "N/A"}
                    </span>
                    <h3 className="font-bold text-gray-500 mt-2 text-xs uppercase tracking-wider">Date</h3>
                    <p className="text-sm font-semibold text-gray-800">{item.invoiceDate}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-xl text-green-600 border border-green-100">
                    <FaFileInvoice size={18} />
                  </div>
                </div>

                <div className="space-y-2 mb-4 flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Base Value</span>
                    <span className="font-bold text-gray-700">₹{item.invoiceValue}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">GST</span>
                    <span className="font-bold text-red-600">₹{item.invoiceGSTValue}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Transport</span>
                    <span className="font-bold text-blue-600">₹{item.transportAmount}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                    <span className="text-sm font-bold text-gray-800">Total</span>
                    <span className="text-lg font-black text-green-700">₹{item.invoiceTotalValue}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 mt-auto">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 bg-blue-50 px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 bg-red-50 px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <FaFileInvoice className="mx-auto text-4xl mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">No invoices found.</p>
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
              Showing {filteredInvoices.length === 0 ? 0 : indexOfFirst + 1} to {Math.min(indexOfLast, filteredInvoices.length)} of {filteredInvoices.length} items
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

      {/* Add / Edit Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:w-[500px] h-full bg-white shadow-2xl relative flex flex-col overflow-y-auto animate-[slideIn_0.3s_ease-out]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 flex justify-between items-center text-white sticky top-0 z-10 shadow-md">
              <div>
                <h3 className="text-xl font-bold">{editingId ? "Edit Invoice" : "Add New Invoice"}</h3>
                <p className="text-blue-200 text-sm mt-1">Fill out the invoice details below.</p>
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
              <form onSubmit={handleAddOrUpdateInvoice} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                
                {editingId && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Invoice Number</label>
                    <input
                      type="text"
                      name="invoiceNo"
                      value={invoiceData.invoiceNo}
                      disabled
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-100 cursor-not-allowed text-gray-500 font-bold text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    required
                    value={invoiceData.invoiceDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Invoice Value (₹) *</label>
                    <input
                      type="number"
                      name="invoiceValue"
                      required
                      placeholder="e.g. 1000"
                      value={invoiceData.invoiceValue}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">GST Value (₹) *</label>
                    <input
                      type="number"
                      name="invoiceGSTValue"
                      required
                      placeholder="e.g. 180"
                      value={invoiceData.invoiceGSTValue}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Transport Amount (₹) *</label>
                    <input
                      type="number"
                      name="transportAmount"
                      required
                      placeholder="e.g. 50"
                      value={invoiceData.transportAmount}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 text-green-700">Total Value (₹) *</label>
                    <input
                      type="number"
                      name="invoiceTotalValue"
                      required
                      placeholder="e.g. 1180"
                      value={invoiceData.invoiceTotalValue}
                      onChange={handleChange}
                      className="w-full border border-green-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50 focus:bg-white transition-all text-sm font-black text-green-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Upload Invoice PDF (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                  />
                  {invoiceData.billPdfName && (
                    <p className="text-xs mt-2 text-green-700 font-medium">
                      Selected: {invoiceData.billPdfName}
                    </p>
                  )}
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
                    {editingId ? "Update Invoice" : "Save Invoice"}
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

export default Invoice;
