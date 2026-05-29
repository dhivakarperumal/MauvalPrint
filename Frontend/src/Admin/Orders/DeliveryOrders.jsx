import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("status", "==", "Delivered")
        );
        const querySnapshot = await getDocs(q);
        const deliveredOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(deliveredOrders);
      } catch (error) {
        console.error("Error fetching delivered orders:", error);
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
        order.checkout?.fullname?.toLowerCase().includes(lowerSearch);

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
          to.setHours(23, 59, 59, 999); // Include the full day
          matchDate = createdAt >= from && createdAt <= to;
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchDate;
    });

    // Sort by newest first
    const sorted = (filterType === "All" ? orders : filtered).sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, filterType, fromDate, toDate]);

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
      <p><strong>Customer:</strong> ${order.checkout?.fullname || order.customerName}</p>
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
      "Customer Name": order.checkout?.fullname || order.customerName,
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
    <div className="p-4 min-h-screen ">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Delivery Orders</h2>
        <p className="text-sm text-gray-500">View and manage delivery orders</p>
      </div>

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

        <div className="flex justify-end">
          <button
            onClick={downloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-sm"
          >
            Download Excel
          </button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {paginatedOrders.map((order) => (
          <div
            key={order.orderID}
            onClick={() => toggleExpand(order.orderID)}
            className="border-gray-300 bg-white shadow rounded-xl p-4 gap-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-blue-800">{order.orderID}</h3>
                <p className="text-sm text-gray-700">{order.checkout?.fullname || order.customerName}</p>
              </div>
              <span className={getStatusBadge(order.status)}>{order.status}</span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              <strong>Amount:</strong> ₹{order.total}
            </p>


            {expandedRows.includes(order.orderID) && (
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                <div className="text-sm text-gray-700 mb-2 space-y-1">
          
                  
                  <div className="text-sm text-gray-700 mb-2 space-y-1">
                        <p><strong>Name:</strong> {order.checkout?.fullname || order.customerName}</p>
                        <p><strong>Email:</strong> {order.checkout?.email || " "}</p>
                        <p><strong>Address:</strong> {order.checkout?.street || order.address}, {order.checkout?.city || ""}, {order.checkout?.state || ""} - {order.checkout?.zip || ""}, {order.checkout?.country || ""}</p>
                        <p><strong>Contact:</strong> {order.checkout?.contact || order.customerPhone}</p>
                      </div>
                 
                  <p className="px-4 py-4">{order.shopCustomerType || "Online"}</p>
                  <p className="px-4 py-4">
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </p>
                </div>

                <p className="mt-2"><strong>Cart Items:</strong></p>
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
                        <div className="flex flex-col">
                          <span className="font-semibold">{actualItem.fullname}</span>
                          <span>Color: {item.color}</span>
                          <span>Size: {item.size}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>Price: ₹{item.price}</span>
                          <span>Total: ₹{item.quantity * item.price}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrint(order);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"
              >
                Print
              </button>
            </div>
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

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto shadow rounded-lg mt-6">
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
                  className=" border border-gray-300 rounded px-4 py-2 w-full md:w-1/3"
                  onClick={() => toggleExpand(order.orderID)}
                >
                  <td className="px-4 py-4 text-blue-600 underline">{order.orderID}</td>
                  <td className="px-4 py-4">{order.checkout?.fullname || order.customerName}</td>
                  <td className="px-4 py-4">₹{order.total}</td>
                  <td className="px-4 py-4">{order.shopCustomerType || "Online"}</td>
                  <td className="px-4 py-4">
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(order);
                      }}
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
                        <p><strong>Name:</strong> {order.checkout?.fullname || order.customerName}</p>
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
                              <li key={idx} className="flex items-start gap-3  text-sm text-gray-700">
                                <span className="font-medium">{idx + 1}.</span>
                                <img
                          src={actualItem.images?.[0] || actualItem.image || actualItem.customizedImage || "/placeholder.jpg"}
                          alt={actualItem.name || "Product Image"}
                          className="w-12 h-12 object-cover rounded border"
                        />
                                <div className="flex ">
                                  <span className='mx-3' >{actualItem.name}</span>
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

export default DeliveryOrders;