import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  FaSearch, FaList, FaThLarge, FaChevronDown, FaChevronUp,
  FaShoppingCart, FaBoxOpen, FaTruck, FaCheckCircle, FaTimesCircle, FaClipboardList, FaPlus,
} from "react-icons/fa";
import api from "../../api";
import Billing from "../Billing";
import ImagePreviewModal from "./ImagePreviewModal";
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
    "Packed": ["Packed", "Shipped", "Delivered", "Cancelled"],
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
  const [viewMode, setViewMode] = useState(
    window.innerWidth < 768 ? "card" : "table"
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const openImagePreview = (src, name) => {
    if (!src) return;
    setPreviewImage({ src, name });
  };

  const closeImagePreview = () => setPreviewImage(null);

  const printPreviewImage = (src) => {
    if (!src) return;
    const printWindow = window.open("", "", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Image</title>
          <style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#fff}img{max-width:100%;max-height:100%;object-fit:contain;}</style>
        </head>
        <body>
          <img src="${src}" alt="Image Preview" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ── Status counts ─────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { "Place Order": 0, Packed: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
    orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return { ...counts, Total: orders.length };
  }, [orders]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Fetch orders from MySQL backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        if (response.data.success) {
          const orderList = response.data.orders.map(order => ({
            ...order,
            orderID: order.order_id,
            paymentID: order.payment_id,
            createdAt: { toDate: () => new Date(order.created_at || 0) }
          }));
          setOrders(orderList);
        } else {
          toast.error(response.data.message || "Failed to load orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      }
    };
    fetchOrders();
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (mobile) {
        setViewMode("card");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
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
        (order.checkout?.fullname || order.checkout?.customerName || order.customerName || "")?.toLowerCase().includes(lowerSearch);

      // Status filter
      const matchStatus = statusFilter === "All" || order.status === statusFilter;

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

      return matchSearch && matchDate && matchStatus;
    });

    // Sort by newest first
    const sorted = filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, filterType, fromDate, toDate, statusFilter]);

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
      await api.put(`/orders/${orderID}/status`, { status: newStatus });

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
      await api.put(`/orders/${orderID}/status`, { status: "Cancelled", reason });

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

      toast.success("Order cancelled successfully");
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
        <p><strong>Customer:</strong> ${order.checkout?.fullname || order.checkout?.customerName || order.customerName || "Unknown"}</p>
        <p><strong>Amount:</strong> ₹${order.total}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        

        <p><strong>Delivery Address:</strong><br />
          ${order.checkout?.street},<br />
          ${order.checkout?.city}, ${order.checkout?.state} - ${order.checkout?.zip
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
            <img src="${item.image || item.customizedImage || "/placeholder.jpg"
            }"
                 alt="${item.name}"
                 style="width: 40px; height: 40px; object-fit: cover;" />
          </td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.name}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.quantity
            }</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.size || "-"
            }</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.color || "-"
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
            ${order.checkout?.fullname || order.checkout?.customerName || order.customerName || "Unknown"}<br/>
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
        <div>
          <h2 className="text-2xl font-bold text-blue-900">All Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all customer orders</p>
        </div>

      </div>

      {/* ── Status Count Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { key: "Total", label: "Total Orders", icon: FaClipboardList, gradient: "from-gray-700 to-gray-900", lightBg: "bg-gray-50", border: "border-gray-200", textColor: "text-gray-800", iconBg: "bg-gray-100" },
          { key: "Place Order", label: "Place Order", icon: FaShoppingCart, gradient: "from-blue-500 to-blue-700", lightBg: "bg-blue-50", border: "border-blue-200", textColor: "text-blue-800", iconBg: "bg-blue-100" },
          { key: "Packed", label: "Packed", icon: FaBoxOpen, gradient: "from-purple-500 to-purple-700", lightBg: "bg-purple-50", border: "border-purple-200", textColor: "text-purple-800", iconBg: "bg-purple-100" },
          { key: "Shipped", label: "Shipped", icon: FaTruck, gradient: "from-indigo-500 to-indigo-700", lightBg: "bg-indigo-50", border: "border-indigo-200", textColor: "text-indigo-800", iconBg: "bg-indigo-100" },
          { key: "Delivered", label: "Delivered", icon: FaCheckCircle, gradient: "from-emerald-500 to-emerald-700", lightBg: "bg-emerald-50", border: "border-emerald-200", textColor: "text-emerald-800", iconBg: "bg-emerald-100" },
          { key: "Cancelled", label: "Cancelled", icon: FaTimesCircle, gradient: "from-red-500 to-red-700", lightBg: "bg-red-50", border: "border-red-200", textColor: "text-red-800", iconBg: "bg-red-100" },
        ].map(({ key, label, icon: Icon, gradient, lightBg, border, textColor, iconBg }) => {
          const count = key === "Total" ? statusCounts.Total : statusCounts[key];
          const isActive = (key === "Total" && statusFilter === "All") || statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key === "Total" ? "All" : key)}
              className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 cursor-pointer group ${isActive
                ? `bg-gradient-to-br ${gradient} text-white shadow-lg scale-[1.02]`
                : `${lightBg} ${border} border hover:shadow-md hover:-translate-y-0.5`
                }`}
            >
              {/* Background decoration */}
              {isActive && (
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              )}

              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : iconBg} transition-colors`}>
                  <Icon size={16} className={isActive ? "text-white" : textColor} />
                </div>
                {isActive && key !== "Total" && (
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Active</span>
                )}
              </div>

              <p className={`text-2xl font-extrabold relative z-10 ${isActive ? "text-white" : textColor}`}>
                {count}
              </p>
              <p className={`text-[11px] font-medium mt-0.5 relative z-10 ${isActive ? "text-white/80" : "text-gray-500"}`}>
                {label}
              </p>
            </button>
          );
        })}
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

          <div className="hidden md:flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
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
          {!isMobile && viewMode === "table" ? (
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
                          {order.checkout?.fullname || order.checkout?.customerName || order.customerName || "Unknown"}
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
                                    onClick={() => openImagePreview(item.customizedImage || item.image, item.name)}
                                    className="w-10 h-10 object-cover border rounded cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedOrders.map((order) => (
                <div key={order.orderID} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                      <p className="font-extrabold text-blue-900 text-lg truncate" title={order.orderID}>{order.orderID}</p>
                    </div>
                    <span className={`${getStatusBadge(order.status)} shrink-0 shadow-sm border border-black/5`}>{order.status}</span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col gap-5">
                    {/* Customer Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                        {(order.checkout?.fullname || order.checkout?.customerName || order.customerName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800 truncate" title={order.checkout?.fullname || order.checkout?.customerName || order.customerName}>
                          {order.checkout?.fullname || order.checkout?.customerName || order.customerName || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{order.checkout?.contact || "No Contact"}</p>
                      </div>
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100/50">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Amount</p>
                        <p className="font-bold text-gray-900 text-base">₹{order.total} <span className="text-[10px] text-gray-500 font-normal">({order.paymentID ? "Online" : "COD"})</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                        <p className="font-semibold text-gray-700 text-sm">
                          {order.createdAt?.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    {/* Status Select */}
                    <div className="mt-auto">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Update Status</label>
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.orderID, e.target.value)}
                          className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                        >
                          {getAvailableStatuses(order.status).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <FaChevronDown size={10} />
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Input */}
                    {cancellationInput[order.orderID] && (
                      <div className="flex flex-col gap-2 bg-red-50 p-4 rounded-xl border border-red-100 shadow-inner mt-2">
                        <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Cancellation Reason</label>
                        <input
                          type="text"
                          placeholder="Why is this order cancelled?"
                          className="border border-red-200 px-3 py-2 text-sm rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:outline-none bg-white shadow-sm placeholder:text-gray-400"
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
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer w-full shadow-md mt-1"
                        >
                          Confirm Cancellation
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
                    <button onClick={() => handlePrint(order)} className="flex-1 bg-white hover:bg-blue-50 text-blue-700 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-gray-200 shadow-sm flex items-center justify-center gap-1.5">
                      <FaClipboardList size={12} /> Print
                    </button>
                    <button onClick={() => AddressPrint(order)} className="flex-1 bg-white hover:bg-indigo-50 text-indigo-700 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-gray-200 shadow-sm flex items-center justify-center gap-1.5">
                      <FaTruck size={12} /> Address
                    </button>
                    <button onClick={() => toggleExpand(order.orderID)} className={`w-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer border shadow-sm ${expandedRows.includes(order.orderID) ? 'bg-gray-800 text-white border-gray-800' : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {expandedRows.includes(order.orderID) ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>
                  </div>

                  {/* Expanded Section */}
                  {expandedRows.includes(order.orderID) && (
                    <div className="bg-gray-50/50 p-5 border-t border-gray-100">
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-50 pb-2">Delivery Details</h4>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <p className="flex gap-2"><strong className="text-gray-800 w-16 shrink-0">Email:</strong> <span className="break-all">{order.checkout?.email || "-"}</span></p>
                          <p className="flex gap-2"><strong className="text-gray-800 w-16 shrink-0">Address:</strong> <span>{order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}</span></p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cart Items</h4>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">{order.cart?.length || 0}</span>
                        </div>
                        <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {order.cart?.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:border-blue-100 transition-colors">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                <img
                                  src={item.image || item.customizedImage || item.images?.[0]}
                                  alt={item.name}
                                  onClick={() => openImagePreview(item.customizedImage || item.image || item.images?.[0], item.name)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                />
                              </div>
                              <div className="flex flex-col flex-1 min-w-0 py-0.5">
                                <span className="font-bold text-xs text-gray-800 leading-tight truncate mb-1" title={item.name}>
                                  {item.name}
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-auto">
                                  <span className="bg-gray-50 border border-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px] font-medium">Qty: <b className="text-gray-900">{item.quantity}</b></span>
                                  {item.size && <span className="bg-gray-50 border border-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px] font-medium">Size: <b className="text-gray-900">{item.size}</b></span>}
                                </div>
                                <div className="mt-1.5 font-bold text-green-700 text-xs">₹{item.price}</div>
                                {(item.customizedImage || item.image || item.images?.[0]) && (
                                  <a
                                    href={item.customizedImage || item.image || item.images?.[0]}
                                    download={`customized-${item.name || "image"}.jpg`}
                                    className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-[10px] mt-2 inline-block text-center w-fit transition-colors shadow-sm font-medium"
                                  >
                                    Download Image
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

          <ImagePreviewModal
            isOpen={!!previewImage}
            imageSrc={previewImage?.src}
            imageName={previewImage?.name}
            onClose={closeImagePreview}
            onPrint={printPreviewImage}
          />

          {/* Pagination Component */}
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
                  Showing {filteredOrders.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
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
                    {[...Array(totalPages)].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === idx + 1
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
              )}
            </div>
          )}
        </>
      )}

      {/* Add New Bill Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:w-[600px] h-full bg-white shadow-2xl relative flex flex-col overflow-y-auto animate-[slideIn_0.3s_ease-out]">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 flex justify-between items-center text-white sticky top-0 z-10 shadow-md">
              <div>
                <h3 className="text-xl font-bold">Add New Bill</h3>
                <p className="text-blue-200 text-sm mt-1">Create a new invoice and order</p>
              </div>
              <button
                onClick={() => {
                  setShowAddBillModal(false);
                  // Refresh orders if needed
                  api.get("/orders").then((res) => {
                    if (res.data.success) {
                      setOrders(res.data.orders.map(order => ({
                        ...order,
                        orderID: order.order_id,
                        paymentID: order.payment_id,
                        createdAt: { toDate: () => new Date(order.created_at || 0) }
                      })));
                    }
                  });
                }}
                className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="add-bill-modal-wrapper">
                <Billing setActiveTab={() => {
                  setShowAddBillModal(false);
                  // Refresh orders
                  api.get("/orders").then((res) => {
                    if (res.data.success) {
                      setOrders(res.data.orders.map(order => ({
                        ...order,
                        orderID: order.order_id,
                        paymentID: order.payment_id,
                        createdAt: { toDate: () => new Date(order.created_at || 0) }
                      })));
                    }
                  });
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        /* Hide the big headers and extra padding inside Billing when rendered in modal */
        .add-bill-modal-wrapper .min-h-screen { min-height: auto; padding: 1.5rem; background: transparent; }
        .add-bill-modal-wrapper .max-w-7xl > div.flex.justify-between { display: none; }
        .add-bill-modal-wrapper .max-w-7xl > p { display: none; }
        .add-bill-modal-wrapper .bg-white.shadow { box-shadow: none; padding: 0; background: transparent; border-radius: 0; }
        .add-bill-modal-wrapper .bg-white { background: white; padding: 1.5rem; border-radius: 1rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
      `}</style>
    </div>
  );
};

export default AllOrders;
