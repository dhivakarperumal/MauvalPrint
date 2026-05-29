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

// Utility function to style status
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
    case "Add More":
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return base;
  }
};

const NewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [cancellationInput, setCancellationInput] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch today's orders initially
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const today = new Date().toDateString();

        const fetched = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          docId: doc.id,
        }));

        const todayOrders = fetched.filter((order) => {
          const createdAt = order.createdAt?.toDate();
          return (
            createdAt &&
            createdAt.toDateString() === today &&
            order.status !== "Delivered" &&
            order.status !== "Cancelled"
          );
        });

        setOrders(todayOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load today’s orders");
      }
    };

    fetchOrders();
  }, []);

  // Apply search + filter logic
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filtered = orders.filter((order) => {
      const createdAt = order.createdAt?.toDate?.();
      const lowerSearch = searchTerm.toLowerCase();

      const matchSearch =
        order.orderID?.toLowerCase().includes(lowerSearch) ||
        order.checkout?.fullname?.toLowerCase().includes(lowerSearch);

      let matchDate = true;
      if (filterType === "Today") {
        matchDate = createdAt?.toDateString() === today.toDateString();
      } else if (filterType === "This Week") {
        matchDate = createdAt >= startOfWeek;
      } else if (filterType === "This Month") {
        matchDate = createdAt >= startOfMonth;
      } else if (filterType === "FromTo" && fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        matchDate = createdAt >= from && createdAt <= to;
      }

      return matchSearch && matchDate;
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filterType, fromDate, toDate]);

  // Toggle order detail visibility
  const toggleExpand = (orderID) => {
    setExpandedRows((prev) =>
      prev.includes(orderID)
        ? prev.filter((row) => row !== orderID)
        : [...prev, orderID]
    );
  };

  // Status update
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

  // Cancel order with reason
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
    <div className="p-4 min-h-screen">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">Today's Orders</h2>
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
      <div className="overflow-x-auto shadow rounded-lg">
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
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No new orders today.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <React.Fragment key={order.orderID}>
                  <tr className="border border-gray-300 rounded px-4 py-2 w-full md:w-1/3">
                    <td
                      className="px-4 py-4 text-blue-700 cursor-pointer hover:underline"
                      onClick={() => toggleExpand(order.orderID)}
                    >
                      {order.orderID}
                    </td>
                    <td className="px-4 py-4">{order.checkout?.fullname}</td>
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
                        )} w-full max-w-[150px]`}
                      >
                        <option value="Place Order">Place Order</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Add More">Add More</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 flex gap-2">
                      <button
                        onClick={() => handlePrint(order)}
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

                  {cancellationInput[order.orderID] && (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 bg-red-50">
                        <div className="flex flex-col sm:flex-row gap-3">
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

                  {expandedRows.includes(order.orderID) && (
                    <tr className="bg-gray-50 border-t">
                      <td colSpan="7" className="px-4 py-3">
                        <div className="text-sm text-gray-700 mb-2 space-y-1">
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
                        </div>
                        <div className="mt-2">
                          <p className="font-medium text-sm mb-1">
                            Cart Items:
                          </p>
                          <ul className="space-y-3">
                            {order.cart?.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 text-sm text-gray-700"
                              >
                                <span className="font-medium">{idx + 1}.</span>
                                <img
                                  src={
                                    item.image ||
                                    item.customizedImage ||
                                    item.images?.[0]
                                  }
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold ">
                                    {item.name}{" "}
                                    {item.color === "" && (
                                      <a
                                        href={
                                          item.customizedImage || item.image
                                        }
                                        download={`customized-${
                                          item.name || "image"
                                        }.jpg`}
                                        className="text-white bg-gray-800 ml-2  py-2 px-3 rounded-lg mt-1 text-xs"
                                      >
                                        Download Image
                                      </a>
                                    )}
                                  </span>
                                  <span className="mt-3">
                                    Qty: {item.quantity} | Price: ₹{item.price}{" "}
                                    | Size: {item.size} | Color: {item.color}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NewOrders;
