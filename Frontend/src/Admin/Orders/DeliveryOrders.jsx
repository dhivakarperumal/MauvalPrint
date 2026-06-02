import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaSearch, FaList, FaThLarge, FaChevronDown, FaChevronUp } from "react-icons/fa";
import api from "../../api";

const getStatusBadge = (status) => {
  const base = "px-2 py-0.5 text-xs rounded font-semibold";
  if (status === "Delivered") return `${base} bg-green-100 text-green-700`;
  return `${base} bg-gray-100 text-gray-700`;
};

const DeliveryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      try {
        const response = await api.get("/orders");
        if (response.data.success) {
          const deliveredOrders = response.data.orders.map(order => ({
            ...order,
            orderID: order.order_id,
            paymentID: order.payment_id,
            createdAt: { toDate: () => new Date(order.created_at || 0) }
          })).filter((order) => order.status === "Delivered");
          setOrders(deliveredOrders);
        } else {
          toast.error(response.data.message || "Failed to load orders");
        }
      } catch (error) {
        console.error("Error fetching delivered orders:", error);
        toast.error("Failed to load orders");
      }
    };

    fetchDeliveredOrders();
  }, []);

  // Filter logic
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filtered = orders.filter((order) => {
      const createdAt = order.createdAt?.toDate?.();
      if (!createdAt) return false;

      const lowerSearch = searchTerm.toLowerCase();

      const matchSearch =
        order.orderID?.toLowerCase().includes(lowerSearch) ||
        (order.checkout?.fullname || order.checkout?.customerName || order.customerName || "")?.toLowerCase().includes(lowerSearch);

      let matchDate = true;
      if (filterType === "Today") {
        matchDate = createdAt.toDateString() === today.toDateString();
      } else if (filterType === "This Week") {
        matchDate = createdAt >= startOfWeek;
      } else if (filterType === "This Month") {
        matchDate = createdAt >= startOfMonth;
      } else if (filterType === "FromTo") {
        if (fromDate && toDate) {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          matchDate = createdAt >= from && createdAt <= to;
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchDate;
    });

    const sorted = (filterType === "All" ? orders : filtered).sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(sorted);
    setCurrentPage(1);
  }, [orders, searchTerm, filterType, fromDate, toDate]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  const handlePrint = (order) => {
    const cartItems = order.cart || order.items || [];

    const content = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ccc; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="/Image/logo.png" alt="Company Logo" style="height: 60px; margin-bottom: 10px;" />
        <h2 style="margin: 0; color: #192f59;">Delivery Order Receipt</h2>
        <p style="color: #555;">Thank you for your purchase! Below are the order details.</p>
      </div>

      <hr style="margin: 20px 0;" />

      <p><strong>Order ID:</strong> ${order.orderID}</p>
      <p><strong>Customer:</strong> ${order.checkout?.fullname || order.checkout?.customerName || order.customerName || order.customerName}</p>
      <p><strong>Amount:</strong> ₹${order.total}</p>
      <p><strong>Status:</strong> ${order.status}</p>

      <p><strong>Delivery Address:</strong><br />
        ${order.checkout?.street || order.address},<br />
        ${order.checkout?.city || ""}, ${order.checkout?.state || ""} - ${order.checkout?.zip || ""},<br />
        ${order.checkout?.country || ""}
      </p>

      <p><strong>Contact:</strong> ${order.checkout?.contact || order.customerPhone}</p>

      <h4 style="margin-top: 30px; color: #192f59;">Ordered Items:</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ccc;">Image</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Product</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Size</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Color</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems
            .map((item) => {
              const actualItem = item.items || item;
              const img =
                actualItem.image ||
                actualItem.customizedImage ||
                "/placeholder.jpg";

              return `
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">
                  <img src="${img}" alt="Image" style="width:40px; height:40px; object-fit:cover;" />
                </td>
                <td style="padding: 8px; border: 1px solid #ccc;">${
                  actualItem.name || actualItem.fullname
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${
                  actualItem.size || "-"
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${
                  actualItem.color || "-"
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${
                  item.quantity
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">₹${
                  item.price
                }</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>

      <hr style="margin: 20px 0;" />

      <p style="text-align: center; font-size: 14px; color: #666;">
        This is a system-generated receipt. For any queries, contact us at support@example.com
      </p>
    </div>
    `;

    const printWindow = window.open("", "", "width=900,height=650");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order - ${order.orderID}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 10px; }
            p, ul { margin: 5px 0; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const downloadExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error("No delivery data to export");
      return;
    }

    const excelData = filteredOrders.map((order, idx) => ({
      "ID": idx + 1,
      "Order ID": order.orderID,
      "Customer Name": order.checkout?.fullname || order.checkout?.customerName || order.customerName || order.customerName,
      Email: order.checkout?.email || "",
      Contact: order.checkout?.contact || order.customerPhone,
      Address: `${order.checkout?.street || order.address}, ${order.checkout?.city || ""}, ${order.checkout?.state || ""} - ${order.checkout?.zip || ""}, ${order.checkout?.country || ""}`,
      "Amount (₹)": order.total,
      Status: order.status,
      "Customer Type": order.shopCustomerType || "Online",
      Items: (order.cart || order.items || [])
        .map((item) => {
          const actualItem = item.items || item;
          return `${actualItem.name || actualItem.fullname} (Size: ${
            actualItem.size || " "
          }, Color: ${actualItem.color || "-"}, Qty: ${item.quantity})`;
        })
        .join("; "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Orders");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Delivery_Orders.xlsx");
  };

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Delivery Orders</h2>
          <p className="text-sm text-gray-500">View and manage delivery orders</p>
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

        {/* Right Side: Filters, Download and View Toggle */}
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

          <button
            onClick={downloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            Download Excel
          </button>

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
          <p className="text-gray-500">No delivered orders found.</p>
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
                    <th className="px-4 py-4">Customer Type</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedOrders.map((order) => (
                    <React.Fragment key={order.orderID}>
                      <tr
                        className="border border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleExpand(order.orderID)}
                      >
                        <td className="px-4 py-4 text-blue-600 underline">{order.orderID}</td>
                        <td className="px-4 py-4">{order.checkout?.fullname || order.checkout?.customerName || order.customerName || order.customerName}</td>
                        <td className="px-4 py-4">₹{order.total}</td>
                        <td className="px-4 py-4">{order.shopCustomerType || "Online"}</td>
                        <td className="px-4 py-4">
                          <span className={getStatusBadge(order.status)}>{order.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
                            className="bg-green-600 hover:bg-green-700 cursor-pointer text-white px-3 py-1 rounded text-xs"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                      {expandedRows.includes(order.orderID) && (
                        <tr>
                          <td colSpan="6" className="bg-gray-50 px-4 py-3">
                            <div className="text-sm text-gray-700 mb-2 space-y-1">
                              <p><strong>Name:</strong> {order.checkout?.fullname || order.checkout?.customerName || order.customerName || order.customerName}</p>
                              <p><strong>Email:</strong> {order.checkout?.email || " "}</p>
                              <p><strong>Address:</strong> {order.checkout?.street || order.address}, {order.checkout?.city || ""}, {order.checkout?.state || ""} - {order.checkout?.zip || ""}, {order.checkout?.country || ""}</p>
                              <p><strong>Contact:</strong> {order.checkout?.contact || order.customerPhone}</p>
                            </div>
                            <div className="mt-2">
                              <strong>Cart Items:</strong>
                              <ul className="space-y-3 ml-6 mt-1">
                                {(order.cart || order.items || []).map((item, idx) => {
                                  const actualItem = item.items || item;
                                  return (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                                      <span className="font-medium">{idx + 1}.</span>
                                      <img
                                        src={actualItem.images?.[0] || actualItem.image || actualItem.customizedImage || "/placeholder.jpg"}
                                        alt={actualItem.name || "Product Image"}
                                        className="w-12 h-12 object-cover rounded border"
                                      />
                                      <div className="flex">
                                        <span className='mx-3'>{actualItem.name}</span>
                                        <span className='mx-3'>Color: {item.color}</span>
                                        <span className='mx-3'>Size: {item.size}</span>
                                        <span className='mx-3'>Qty: {item.quantity}</span>
                                        <span className='mx-3'>Price: ₹{item.price}</span>
                                        <span className='mx-3'>Total: ₹{item.quantity * item.price}</span>
                                      </div>
                                    </li>
                                  );
                                })}
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
                <div key={order.orderID} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-900 text-lg truncate" title={order.orderID}>{order.orderID}</p>
                      <p className="text-sm font-medium text-gray-700 truncate">{order.checkout?.fullname || order.checkout?.customerName || order.customerName || order.customerName}</p>
                    </div>
                    <span className={`${getStatusBadge(order.status)} shrink-0`}>{order.status}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Amount</p>
                      <p className="font-bold text-gray-900 text-base">₹{order.total}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Type</p>
                      <p className="font-semibold text-gray-800">{order.shopCustomerType || "Online"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-green-200"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => toggleExpand(order.orderID)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer border border-gray-200 flex items-center justify-center"
                    >
                      {expandedRows.includes(order.orderID) ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>

                  {expandedRows.includes(order.orderID) && (
                    <div className="mt-2 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600 mb-4 space-y-1 bg-gray-50 p-3 rounded-lg">
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Email:</strong> <span className="break-all">{order.checkout?.email}</span></p>
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Contact:</strong> <span>{order.checkout?.contact || order.customerPhone}</span></p>
                        <p className="flex flex-col sm:flex-row sm:gap-2"><strong className="text-gray-800">Address:</strong> <span>{order.checkout?.street || order.address}, {order.checkout?.city || ""}, {order.checkout?.state || ""} - {order.checkout?.zip || ""}</span></p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-3 text-gray-800 flex items-center gap-2">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{(order.cart || order.items || []).length}</span>
                          Cart Items
                        </p>
                        <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {(order.cart || order.items || []).map((item, idx) => {
                            const actualItem = item.items || item;
                            return (
                              <li key={idx} className="flex items-start gap-3 text-sm bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                                <img
                                  src={actualItem.images?.[0] || actualItem.image || actualItem.customizedImage || "/placeholder.jpg"}
                                  alt={actualItem.name || "Product"}
                                  className="w-14 h-14 object-cover rounded-md border border-gray-100 bg-gray-50 shrink-0"
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-semibold text-xs text-gray-900 leading-tight truncate">{actualItem.name}</span>
                                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">Qty: <b>{item.quantity}</b></span>
                                    <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">₹{item.price}</span>
                                    {item.size && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Size: <b>{item.size}</b></span>}
                                    {item.color && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Color: <b>{item.color}</b></span>}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
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

export default DeliveryOrders;