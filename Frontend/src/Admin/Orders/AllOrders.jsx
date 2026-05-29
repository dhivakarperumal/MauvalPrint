import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { FaSearch, FaList, FaThLarge, FaChevronDown, FaChevronUp } from "react-icons/fa";



const getStatusBadge = (status) => {
  const base = "text-xs font-medium rounded px-2 py-1";
  switch (status) {
    case "Place Order":
      return `${base} bg-blue-100 text-blue-800`;
    case "Packed":
      return `${base} bg-purple-100 text-purple-800`;
    case "Shipped":
      return `${base} bg-indigo-100 text-indigo-800`;
    case "Delivered":
      return `${base} bg-green-100 text-green-800`;
    case "Cancelled":
      return `${base} bg-red-100 text-red-700`;

    default:
      return base;
  }
};

// Helper function to determine available status options based on current status
const getAvailableStatuses = (currentStatus) => {
  const statusHierarchy = {
    "Place Order": [" Place Order", "Packed", "Shipped", "Delivered", "Cancelled"],
    "Packed": [ "Packed", "Shipped", "Delivered", "Cancelled"],
    "Shipped": ["Shipped", "Delivered", "Cancelled"],
    "Delivered": ["Delivered"],
    "Cancelled": ["Cancelled"],
    
  };
  return statusHierarchy[currentStatus] || ["Place Order"];
};

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [cancellationInput, setCancellationInput] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState("table");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orderList = querySnapshot.docs
          .map((doc) => ({ ...doc.data(), docId: doc.id }))
          .filter((order) => order.status !== "Delivered");
        setOrders(orderList);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      }
    };
    fetchOrders();
    setCurrentPage(1);
  }, []);

  // Pagination handler
  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Filter orders based on search and date
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filtered = orders.filter((order) => {
      const createdAt = order.createdAt?.toDate();
      const lowerSearch = searchTerm.toLowerCase();

      const matchSearch =
        order.orderID?.toLowerCase().includes(lowerSearch) ||
        order.checkout?.fullname?.toLowerCase().includes(lowerSearch);

      let matchDate = true;
      if (filterType === "Today") {
        matchDate = createdAt.toDateString() === today.toDateString();
      } else if (filterType === "This Week") {
        matchDate = createdAt >= startOfWeek;
      } else if (filterType === "This Month") {
        matchDate = createdAt >= startOfMonth;
      } else if (filterType === "FromTo" && fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        matchDate = createdAt >= from && createdAt <= to;
      }

      return matchSearch && matchDate;
    });

    // Sort by newest first
    const sorted = filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, filterType, fromDate, toDate]);

  // Expand row toggle
  const toggleExpand = (orderID) => {
    setExpandedRows((prev) =>
      prev.includes(orderID)
        ? prev.filter((row) => row !== orderID)
        : [...prev, orderID]
    );
  };

  // Change order status
  const handleStatusChange = async (orderID, newStatus) => {
    const orderToUpdate = orders.find((order) => order.orderID === orderID);
    if (!orderToUpdate) return;

    if (newStatus === "Cancelled") {
      setCancellationInput((prev) => ({ ...prev, [orderID]: true }));
      return;
    }

    try {
      await updateDoc(doc(db, "orders", orderToUpdate.docId), {
        status: newStatus,
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.orderID === orderID ? { ...order, status: newStatus } : order
        )
      );

      // Hide cancellation input if not cancelled
      setCancellationInput((prev) => {
        const updated = { ...prev };
        delete updated[orderID];
        return updated;
      });

      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  // Cancel order
  const handleCancelSubmit = async (orderID, reason) => {
    const order = orders.find((o) => o.orderID === orderID);
    if (!order) return;

    try {
      await updateDoc(doc(db, "orders", order.docId), {
        status: "Cancelled",
      });

      await addDoc(collection(db, "cancelOrders"), {
        ...order,
        cancelledAt: new Date().toISOString(),
        reason,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.orderID === orderID ? { ...o, status: "Cancelled" } : o
        )
      );

      setCancellationInput((prev) => {
        const updated = { ...prev };
        delete updated[orderID];
        return updated;
      });

      toast.success("Order cancelled and stored successfully");
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("Failed to cancel order");
    }
  };

  // Print functions
  const handlePrint = (order) => {
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; border-radius: 10px; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="../Image/logo.png" alt="Company Logo" style="height: 60px; margin-bottom: 10px;" />
          <h2 style="margin: 0; color: #192f59;">Order Receipt</h2>
          <p style="color: #555;">Thank you for shopping with us!</p>
        </div>

        <hr style="margin: 20px 0;" />

        <p><strong>Order ID:</strong> ${order.orderID}</p>
        <p><strong>Customer:</strong> ${order.checkout?.fullname}</p>
        <p><strong>Amount:</strong> ₹${order.total}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        

        <p><strong>Delivery Address:</strong><br />
          ${order.checkout?.street},<br />
          ${order.checkout?.city}, ${order.checkout?.state} - ${
      order.checkout?.zip
    },<br />
          ${order.checkout?.country}
        </p>

        <p><strong>Contact:</strong> ${order.checkout?.contact}</p>

        <h4 style="margin-top: 30px; color: #192f59;">Cart Items:</h4>
         <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background-color: #f3f3f3;">
        <th style="border: 1px solid #ccc; padding: 8px;">Image</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Product</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Qty</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Size</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Color</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${order.cart
        ?.map(
          (item) => `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
            <img src="${
              item.image || item.customizedImage || "/placeholder.jpg"
            }"
                 alt="${item.name}"
                 style="width: 40px; height: 40px; object-fit: cover;" />
          </td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.name}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${
            item.quantity
          }</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${
            item.size || "-"
          }</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${
            item.color || "-"
          }</td>
          <td style="border: 1px solid #ccc; padding: 8px;">₹${item.price}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

        <hr style="margin: 20px 0;" />

        <p style="text-align: center; font-size: 14px; color: #666;">
          This receipt is system-generated. For support, contact support@example.com
        </p>
      </div>
    `;

    const printWindow = window.open("", "", "width=900,height=650");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order - ${order.orderID}</title>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };


  const AddressPrint = (order) => {
    const content = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; border: 1px solid #ccc; border-radius: 10px; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="../Image/logo.png" alt="Company Logo" style="height: 60px; margin-bottom: 10px;" />
        <h2 style="margin: 0; color: #192f59;">Address Details</h2>
        <p style="color: #555;">Thank you for shopping with us!</p>
      </div>

      <hr style="margin: 20px 0;" />

      <p><strong>Order ID:</strong> ${order.orderID}</p>
      <p><strong>Customer:</strong> ${order.checkout?.fullname}</p>
      <p><strong>Amount:</strong> ₹${order.total}</p>
      <p><strong>Status:</strong> ${order.status}</p>

      <div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 25px;">
        <div style="flex: 1; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
          <h4 style="margin-bottom: 10px;">From</h4>
          <p>
            <strong>Shop Name:</strong> Mauval Prints <br/>
            <strong>Address:</strong> No.347,Saibaba colony, Asiriyar Nagar,<br/>Tirupattur - 635601,Tamil Nadu <br/>
            <strong>Phone:</strong> +91 6385381388<br/>
            <strong>Email:</strong> mauvalprint@gmail.com
          </p>
        </div>

        <div style="flex: 1; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
          <h4 style="margin-bottom: 10px;">To</h4>
          <p>
            ${order.checkout?.fullname}<br/>
            ${order.checkout?.street}<br/>
            ${order.checkout?.city}, ${order.checkout?.state} - ${order.checkout?.zip}<br/>
           
            <strong>Phone:</strong> +91 ${order.checkout?.contact}<br/>
            <strong>Email</strong>  ${order.checkout?.email}
          </p>
        </div>
      </div>

      <hr style="margin: 30px 0;" />

      <p style="text-align: center; font-size: 14px; color: #666;">
        This receipt is system-generated. For support, contact tshirtworld@example.com
      </p>
    </div>
  `;

    const printWindow = window.open("", "", "width=900,height=650");
    printWindow.document.write(`
    <html>
      <head>
        <title>Order - ${order.orderID}</title>
      </head>
      <body>${content}</body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-900">All Orders</h2>
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
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
          <div className="overflow-x-auto shadow-sm rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-4">Order ID</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Payment</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedOrders.map((order) => (
                  <React.Fragment key={order.orderID}>
                    <tr className="border-gray-300 hover:bg-gray-50">
                      <td
                        className="px-4 py-4 text-blue-700 cursor-pointer hover:underline"
                        onClick={() => toggleExpand(order.orderID)}
                      >
                        {order.orderID}
                      </td>
                      <td className="px-4 py-4">
                        {order.checkout?.fullname || order.customerName}
                      </td>
                      <td className="px-4 py-4">₹{order.total}</td>
                      <td className="px-4 py-4">
                        {order.paymentID ? "Online" : "Cash on Delivery"}
                      </td>
                      <td className="px-4 py-4">
                        {order.createdAt?.toDate().toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.orderID, e.target.value)
                          }
                          className={`${getStatusBadge(
                            order.status
                          )} w-full  max-w-[150px]`}
                        >
                          {getAvailableStatuses(order.status).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          data-ignore-outside
                          onClick={() => {
                            handlePrint(order);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-3 py-1 rounded text-xs"
                        >
                          Print
                        </button>
                        <button
                            onClick={() => AddressPrint(order)}
                            className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-3 py-1 rounded text-xs"
                          >
                            Address
                          </button>
                      </td>
                    </tr>

                    {/* Cancellation Input */}
                    {cancellationInput[order.orderID] && (
                      <tr>
                        <td colSpan="7" className="px-4 py-2 bg-red-50">
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <input
                              type="text"
                              placeholder="Reason for cancellation"
                              className="border border-gray-300 px-3 py-1 rounded w-full sm:w-1/2"
                              onChange={(e) =>
                                setCancellationInput((prev) => ({
                                  ...prev,
                                  [order.orderID]: {
                                    ...(typeof prev[order.orderID] === "object"
                                      ? prev[order.orderID]
                                      : {}),
                                    reason: e.target.value,
                                  },
                                }))
                              }
                            />
                            <button
                              onClick={() =>
                                handleCancelSubmit(
                                  order.orderID,
                                  cancellationInput[order.orderID]?.reason || ""
                                )
                              }
                              className="bg-red-600 text-white px-4 py-1.5 rounded text-sm"
                            >
                              Submit Cancellation
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Expanded row */}
                    {expandedRows.includes(order.orderID) && (
                      <tr className="bg-gray-50 border-t">
                        <td colSpan="7" className="px-4 py-3 text-sm text-gray-700">
                          <p>
                            <strong>Email:</strong> {order.checkout?.email}
                          </p>
                          <p>
                            <strong>Contact:</strong> {order.checkout?.contact}
                          </p>
                          <p>
                            <strong>Address:</strong> {order.checkout?.street},{" "}
                            {order.checkout?.city}, {order.checkout?.state} -{" "}
                            {order.checkout?.zip}, {order.checkout?.country}
                          </p>
                          <p className="mt-2 font-medium">Cart Items:</p>
                          <ul className="space-y-2 mt-1">
                            {order.cart?.map((item, idx) => (
                              <li key={idx} className="flex gap-2 items-start">
                                <img
                                  src={item.image || item.customizedImage}
                                  alt={item.name}
                                  className="w-10 h-10 object-cover border rounded"
                                />
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p>Qty: {item.quantity}</p>
                                  <p>Color: {item.color}</p>
                                  <p>Size: {item.size}</p>
                                  <p>
                                    ₹{item.price} × {item.quantity} = ₹
                                    {item.price * item.quantity}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
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
                <div key={order.orderID} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-900 text-lg truncate" title={order.orderID}>{order.orderID}</p>
                      <p className="text-sm font-medium text-gray-700 truncate" title={order.checkout?.fullname || order.customerName}>{order.checkout?.fullname || order.customerName}</p>
                    </div>
                    <span className={`${getStatusBadge(order.status)} shrink-0`}>{order.status}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Amount</p>
                      <p className="font-bold text-gray-900 text-base">₹{order.total}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Payment</p>
                      <p className="font-semibold text-gray-800">{order.paymentID ? "Online" : "COD"}</p>
                    </div>
                  </div>
  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium text-gray-800">
                        {order.createdAt?.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Contact:</span>
                      <span className="font-medium text-gray-800">{order.checkout?.contact}</span>
                    </p>
                  </div>
  
                  <div className="mt-1">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.orderID, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer font-medium"
                    >
                      {getAvailableStatuses(order.status).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {cancellationInput[order.orderID] && (
                    <div className="flex flex-col gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                      <input
                        type="text"
                        placeholder="Reason for cancellation..."
                        className="border border-red-300 px-3 py-2 text-sm rounded-lg w-full focus:ring-2 focus:ring-red-400 focus:outline-none bg-white"
                        onChange={(e) =>
                          setCancellationInput((prev) => ({
                            ...prev,
                            [order.orderID]: { reason: e.target.value },
                          }))
                        }
                      />
                      <button
                        onClick={() =>
                          handleCancelSubmit(order.orderID, cancellationInput[order.orderID]?.reason || "")
                        }
                        className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer w-full"
                      >
                        Confirm Cancel
                      </button>
                    </div>
                  )}
  
                  <div className="flex gap-2 mt-auto pt-2">
                    <button onClick={() => handlePrint(order)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-blue-200">
                      Print
                    </button>
                    <button onClick={() => AddressPrint(order)} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-indigo-200">
                      Address
                    </button>
                    <button onClick={() => toggleExpand(order.orderID)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer border border-gray-200 flex items-center justify-center">
                      {expandedRows.includes(order.orderID) ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
  
                  {expandedRows.includes(order.orderID) && (
                    <div className="mt-2 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600 mb-4 space-y-1 bg-gray-50 p-3 rounded-lg">
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Email:</strong> <span className="break-all">{order.checkout?.email}</span></p>
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Address:</strong> <span>{order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}</span></p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-3 text-gray-800 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{order.cart?.length || 0}</span>
                          Cart Items
                        </p>
                        <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {order.cart?.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                              <img
                                src={item.image || item.customizedImage || item.images?.[0]}
                                alt={item.name}
                                className="w-14 h-14 object-cover rounded-md border border-gray-100 bg-gray-50 shrink-0"
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-semibold text-xs text-gray-900 leading-tight truncate" title={item.name}>
                                  {item.name}
                                </span>
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
                                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">Qty: <b>{item.quantity}</b></span>
                                  <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">₹{item.price}</span>
                                  {item.size && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Size: <b>{item.size}</b></span>}
                                </div>
                                {item.color === "" && item.customizedImage && (
                                  <a
                                    href={item.customizedImage}
                                    download={`customized-${item.name || "image"}.jpg`}
                                    className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-[10px] mt-2 inline-block text-center w-fit transition-colors cursor-pointer"
                                  >
                                    Download Custom Image
                                  </a>
                                )}
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

          {/* Pagination Component */}
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
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        currentPage === idx + 1
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {idx + 1}
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

export default AllOrders;
