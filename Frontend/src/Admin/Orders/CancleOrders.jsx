import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";

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
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "cancelOrders"));
        const orderList = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setCancelledOrders(orderList);
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

    // Sort by newest first
    const sorted = filtered.sort((a, b) => {
      const dateA = a.cancelledAt ? new Date(a.cancelledAt) : new Date(0);
      const dateB = b.cancelledAt ? new Date(b.cancelledAt) : new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  }, [cancelledOrders, searchTerm, filterType, fromDate, toDate]);

  // Calculate paginated data
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
    <div className="p-4 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Cancelled Orders</h2>
        <p className="text-sm text-gray-500">View and manage cancelled orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="All">All</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="FromTo">From - To</option>
          </select>

          {filterType === "FromTo" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </>
          )}
        </div>

        <input
          type="text"
          placeholder="Search by Order ID or Customer Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-full md:w-1/3"
        />
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white shadow rounded-xl p-4 gap-4"
            onClick={() => toggleExpand(order.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-blue-800">{order.orderID}</h3>
                <p className="text-sm text-gray-700">{order.checkout?.fullname}</p>
              </div>
              <span className={getStatusBadge(order.status)}>{order.status}</span>
            </div>

            <p className="text-sm text-gray-600">
              <strong>Amount:</strong> {order.total}
            </p>
            <p className="text-sm text-gray-600">{order.reason}</p>

            {expandedRows.includes(order.id) && (
              <div className="mt-3 text-sm text-gray-700">
                <div className="mb-2 space-y-1">
                  <p><strong>Name:</strong> {order.checkout?.fullname}</p>
                  <p><strong>Email:</strong> {order.checkout?.email}</p>
                  <p><strong>Address:</strong> {order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}, {order.checkout?.country}</p>
                  <p><strong>Contact:</strong> {order.checkout?.contact}</p>
                </div>
                <p className="mt-2"><strong>Cart Items:</strong></p>
                <ul className="space-y-3">
                  {order.cart?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="font-medium">{idx + 1}.</span>
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border" />
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.name}</span>
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
            )}
          </div>
        ))}
      </div>

      {/* Mobile Pagination */}
      <div className="md:hidden flex flex-col items-center gap-3 mt-6 px-4">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto shadow rounded-lg mt-6">
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
          <tbody className="">
            {paginatedOrders.map((order) => (
              <React.Fragment key={order.id}>
                <tr
                  className="cursor-pointer border border-gray-300 hover:bg-gray-50"
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

      {/* Desktop Pagination */}
      <div className="hidden md:flex justify-between items-center mt-6 px-4">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? "bg-blue-900 text-white"
                    : "border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrders;
