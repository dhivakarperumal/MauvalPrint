import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaSearch, FaList, FaThLarge, FaChevronDown, FaChevronUp } from "react-icons/fa";
import api from "../../api";

const getStatusBadge = (status) => {
  const base = "px-2 py-0.5 text-xs rounded font-semibold";
  if (status === "Cancelled") return `${base} bg-red-100 text-red-700`;
  return base;
};

const CancelOrders = () => {
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        if (response.data.success) {
          const orderList = response.data.orders.map(order => ({
            ...order,
            id: order.order_id,
            orderID: order.order_id,
            paymentID: order.payment_id,
            cancelledAt: order.updated_at,
            createdAt: { toDate: () => new Date(order.created_at || 0) }
          })).filter(order => order.status === "Cancelled");
          setCancelledOrders(orderList);
        } else {
          toast.error(response.data.message || "Failed to load cancelled orders");
        }
      } catch (error) {
        console.error("Error fetching cancelled orders:", error);
        toast.error("Failed to load cancelled orders");
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filtered = cancelledOrders.filter((order) => {
      const cancelledAt = order.cancelledAt ? new Date(order.cancelledAt) : new Date(0);
      const term = searchTerm.toLowerCase();

      const matchSearch =
        order.orderID?.toLowerCase().includes(term) ||
        order.checkout?.fullname?.toLowerCase().includes(term);

      let matchDate = true;
      if (filterType === "Today") {
        matchDate = cancelledAt.toDateString() === today.toDateString();
      } else if (filterType === "This Week") {
        matchDate = cancelledAt >= startOfWeek;
      } else if (filterType === "This Month") {
        matchDate = cancelledAt >= startOfMonth;
      } else if (filterType === "FromTo") {
        if (fromDate && toDate) {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          matchDate = cancelledAt >= from && cancelledAt <= to;
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchDate;
    });

    const sorted = filtered.sort((a, b) => {
      const dateA = a.cancelledAt ? new Date(a.cancelledAt) : new Date(0);
      const dateB = b.cancelledAt ? new Date(b.cancelledAt) : new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(sorted);
    setCurrentPage(1);
  }, [cancelledOrders, searchTerm, filterType, fromDate, toDate]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Cancelled Orders</h2>
          <p className="text-sm text-gray-500">View and manage cancelled orders</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Left Side: Search */}
        <div className="w-full md:w-1/3 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
          />
        </div>

        {/* Right Side: Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {filterType === "FromTo" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="FromTo">From - To</option>
          </select>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${viewMode === "table" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              title="Table View"
            >
              <FaList />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${viewMode === "card" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              title="Card View"
            >
              <FaThLarge />
            </button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-64 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500">No cancelled orders found.</p>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <div className="overflow-x-auto shadow-sm rounded-xl border border-gray-200 bg-white">
              <table className="min-w-[900px] w-full text-sm text-left">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-4">Order ID</th>
                    <th className="px-4 py-4">Customer</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Reason</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className="cursor-pointer border border-gray-100 hover:bg-gray-50"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <td className="px-4 py-4 text-blue-600 underline">{order.orderID}</td>
                        <td className="px-4 py-4">{order.checkout?.fullname}</td>
                        <td className="px-4 py-4">₹{order.total}</td>
                        <td className="px-4 py-4">{order.reason}</td>
                        <td className="px-4 py-4">
                          <span className='bg-red-200 p-1 text-black rounded'>{"Cancelled"}</span>
                        </td>
                      </tr>

                      {expandedRows.includes(order.id) && (
                        <tr>
                          <td colSpan="5" className="bg-gray-50 px-4 py-3">
                            <div className="mb-2 space-y-1 text-sm text-gray-700">
                              <p><strong>Name:</strong> {order.checkout?.fullname}</p>
                              <p><strong>Email:</strong> {order.checkout?.email}</p>
                              <p><strong>Address:</strong> {order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}, {order.checkout?.country}</p>
                              <p><strong>Contact:</strong> {order.checkout?.contact}</p>
                            </div>
                            <div className="mt-2">
                              <strong>Cart Items:</strong>
                              <ul className="space-y-3">
                                {order.cart?.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                                    <span className="font-medium">{idx + 1}.</span>
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border" />
                                    <div className="flex gap-3 flex-wrap">
                                      <span>{item.name}</span>
                                      <span>Qty: {item.quantity}</span>
                                      <span>Price: ₹{item.price}</span>
                                      <span>Color: {item.color}</span>
                                      <span>Size: {item.size}</span>
                                      <span>Total: ₹{item.quantity * item.price}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedOrders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-900 text-lg truncate" title={order.orderID}>{order.orderID}</p>
                      <p className="text-sm font-medium text-gray-700 truncate">{order.checkout?.fullname}</p>
                    </div>
                    <span className={`${getStatusBadge("Cancelled")} shrink-0`}>Cancelled</span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Amount</p>
                      <p className="font-bold text-gray-900 text-base">₹{order.total}</p>
                    </div>
                  </div>

                  {order.reason && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                      <p className="text-[11px] text-red-500 uppercase tracking-wider mb-0.5 font-medium">Reason</p>
                      <p className="text-sm text-red-800 font-medium">{order.reason}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto pt-2">
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors cursor-pointer border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      {expandedRows.includes(order.id) ? (
                        <><FaChevronUp /> Hide Details</>
                      ) : (
                        <><FaChevronDown /> View Details</>
                      )}
                    </button>
                  </div>

                  {expandedRows.includes(order.id) && (
                    <div className="mt-2 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600 mb-4 space-y-1 bg-gray-50 p-3 rounded-lg">
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Email:</strong> <span className="break-all">{order.checkout?.email}</span></p>
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Contact:</strong> <span>{order.checkout?.contact}</span></p>
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Address:</strong> <span>{order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}</span></p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-3 text-gray-800 flex items-center gap-2">
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">{order.cart?.length || 0}</span>
                          Cart Items
                        </p>
                        <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {order.cart?.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 object-cover rounded-md border border-gray-100 bg-gray-50 shrink-0"
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-semibold text-xs text-gray-900 leading-tight truncate">{item.name}</span>
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
                                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">Qty: <b>{item.quantity}</b></span>
                                  <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">₹{item.price}</span>
                                  {item.size && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Size: <b>{item.size}</b></span>}
                                  {item.color && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Color: <b>{item.color}</b></span>}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-4 mt-6 bg-white border border-gray-200 rounded-xl shadow-sm gap-4">
              <p className="text-sm text-gray-600 font-medium">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm font-medium transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CancelOrders;
