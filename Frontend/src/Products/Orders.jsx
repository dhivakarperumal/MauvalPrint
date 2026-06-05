import React, { useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../Context/AuthContext";
import { ImSpinner8 } from "react-icons/im";
import { FaTrashAlt, FaBoxOpen, FaPrint } from "react-icons/fa";
import api from "../api";

const Orders = ({ titleorder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason, setReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: "" });

  const { user } = useContext(AuthContext);
  const printRef = useRef();

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/orders/user/${user.uid}`);
        if (data.success) {
          setOrders(data.orders);
        } else {
          toast.error("Error fetching orders");
        }
      } catch (error) {
        console.error("Fetch orders error:", error);
        toast.error("Error fetching orders");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, isOpen]);

  const toggleDrawer = () => {
    if (!user) {
      toast.warn("Login Please");
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleDelete = async (e, orderId) => {
    e.stopPropagation();
    if (!orderId) return;
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
      toast.success("Order deleted!");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const trackingSteps = [
    "Place Order",
    "Paked",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  const getTrackingIndex = (status) => {
    const normalized = status?.toLowerCase() || "";
    if (normalized.includes("cancel")) return 4;
    if (normalized.includes("delivered")) return 3;
    if (normalized.includes("shipped")) return 2;
    if (normalized.includes("paked")) return 1;
    if (normalized.includes("place")) return 0;
    return 0;
  };

  const handlePrint = (order) => {
    const orderHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order Receipt - ${order.orderID}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
          max-width: 800px;
          margin: auto;
        }
        h2 {
          color: #192f59;
        }
        .header, .footer {
          text-align: center;
          margin-bottom: 20px;
        }
        .header img {
          height: 60px;
          
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f5f5f5;
        }
        .section {
          margin-top: 20px;
        }
        .section p {
          margin: 6px 0;
        }
        .footer-note {
          font-size: 13px;
          color: #777;
          margin-top: 30px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${
          window.location.origin
        }/Image/logo1.png" alt="Company Logo" />
        <h2>Mauval Prints</h2>
        <h2>Order Receipt</h2>
        <p>Thank you for shopping with us!</p>
      </div>

      <hr />

      <div class="section">
        <p><strong>Order ID:</strong> ${order.orderID}</p>
        <p><strong>Customer:</strong> ${order.checkout?.fullname}</p>
        <p><strong>Amount Paid:</strong> ₹${order.total}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Phone:</strong> ${order.checkout?.contact}</p>
        <p><strong>Email:</strong> ${order.checkout?.email}</p>
        <p><strong>Delivery Address:</strong><br />
          ${order.checkout?.street},<br />
          ${order.checkout?.city}, ${order.checkout?.state} - ${
      order.checkout?.zip
    },<br />
          ${order.checkout?.country}
        </p>
      </div>

      <div class="section">
        <h3>Cart Items</h3>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Size</th>
              <th>Color</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.cart
              ?.map(
                (item) => `
              <tr>
                <td>
                  <img src="${
                    item.image || item.customizedImage || "/placeholder.jpg"
                  }" 
                       alt="${item.name}" 
                       style="width: 40px; height: 40px; object-fit: cover;" />
                </td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.size || "-"}</td>
                <td>${item.color || "-"}</td>
                <td>₹${item.price}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="footer-note">
        This is a system-generated receipt. For help, contact support@example.com
      </div>
    </body>
    </html>
  `;

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(orderHTML);
    printWindow.document.close();
    printWindow.focus();

    // Give time for images to load
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const openCancelModal = () => {
    setReason("");
    setShowCancelModal(true);
  };

  const submitCancelRequest = async () => {
    if (!reason.trim()) return toast.warn("Please enter a reason.");
    setIsCancelling(true);
    try {
      await api.put(`/orders/${selectedOrder.order_id}/status`, {
        status: "Cancelled",
        reason: reason,
      });

      // Optimistic UI update
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === selectedOrder.order_id
            ? { ...o, status: "Cancelled" }
            : o
        )
      );

      toast.success("Order cancelled.");
      setShowCancelModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };
  const openReviewModal = () => {
    setReviewData({ rating: 0, comment: "" });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim() || reviewData.rating === 0) {
      toast.warn("Please provide a comment and rating.");
      return;
    }

    try {
      await api.post("/reviews", {
        name: selectedOrder.checkout?.fullname,
        product: selectedOrder.cart?.[0]?.name || "Unknown Product",
        rating: reviewData.rating,
        comment: reviewData.comment,
      });

      toast.success("Review submitted!");
      setShowReviewModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review.");
    }
  };

  return (
    <div className="text-black text-left">
      <button
        onClick={toggleDrawer}
        className="flex gap-2 items-center lg:text-2xl  lg:text-white text-black cursor-pointer"
      >
        <FaBoxOpen />
        {titleorder}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay: Click to close */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Sidebar */}
          <div
            className="relative w-full sm:w-[500px] h-full bg-white shadow-xl overflow-y-auto z-50 scrollbar-hide"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="p-4 flex justify-between items-center border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Order History
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl font-bold text-slate-700 hover:text-slate-900 transition"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center h-full">
                  <ImSpinner8 className="animate-spin text-3xl text-slate-700 " />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  No orders found.
                </p>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="border border-slate-200 rounded-2xl bg-slate-50 p-5 cursor-pointer hover:bg-white hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      {/* Left */}
                      <div className="space-y-1">
                        <div className="text-xl font-bold">
                          OrderId: {order.order_id || order.orderID}
                        </div>
                        <p className="text-sm">
                          <strong>Name:</strong> {order.checkout?.fullname}
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <strong>Status:</strong>
                          <span
                            className={`px-3 py-1 rounded-full text-white text-[11px] font-semibold tracking-wide uppercase ${
                              order.status?.toLowerCase().includes("cancel")
                                ? "bg-red-600"
                                : order.status
                                    ?.toLowerCase()
                                    .includes("delivered")
                                ? "bg-green-600"
                                : order.status
                                    ?.toLowerCase()
                                    .includes("shipped")
                                ? "bg-orange-500"
                                : order.status?.toLowerCase().includes("paked")
                                ? "bg-yellow-500 text-slate-800"
                                : "bg-slate-400"
                            }`}
                          >
                            {order.status}
                          </span>
                        </p>
                      </div>

                      {/* Right */}
                      <div className="text-sm text-right space-y-1 self-start md:self-center">
                        <p>
                          <strong>Phone:</strong> {order.checkout?.contact}
                        </p>
                        <p>
                          <strong>Date:</strong> {formatDate(order.created_at || order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center">
          <div
            ref={printRef}
            className="bg-white p-6 rounded-lg max-w-2xl w-full relative overflow-y-auto max-h-[90vh] scrollbar-hide"
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-2 right-4 text-2xl font-bold cursor-pointer"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-2">
              Order #{selectedOrder.order_id || selectedOrder.orderID}
            </h2>
           
            <p className="text-sm mb-2">
              <strong>Name:</strong> {selectedOrder.checkout?.fullname}
              <br />
              <strong>Address:</strong> {selectedOrder.checkout?.street},{" "}
              {selectedOrder.checkout?.city}, {selectedOrder.checkout?.state},{" "}
              {selectedOrder.checkout?.zip}, {selectedOrder.checkout?.country}
              <br />
              <strong>Phone:</strong> {selectedOrder.checkout?.contact}
              <br />
              <strong>Email:</strong> {selectedOrder.checkout?.email}
              <br />
              <strong>Payment ID:</strong> {selectedOrder.payment_id || selectedOrder.paymentID}
              <br />
              <strong>Status:</strong> {selectedOrder.status}
              <br />
              <strong>Ordered On:</strong> {formatDate(selectedOrder.created_at || selectedOrder.createdAt)}
              <br />
             
              <p> <strong>Shipping Charge:</strong>{20}</p>
           
              <p> <strong>Total:</strong>{selectedOrder.total}</p>
            </p>

            <h3 className="font-bold mt-4 mb-2 flex justify-between items-center">
              Product(s)
              <button
                onClick={() => handlePrint(selectedOrder)}
                className="text-sm bg-slate-800 text-white px-3 py-1 rounded cursor-pointer"
              >
                <FaPrint className="inline-block mr-2" /> Print
              </button>
            </h3>

            <div className="space-y-3">
              {selectedOrder.cart?.map((item, i) => (
                <div key={i} className="flex gap-4 border p-2 rounded">
                  <img
                    src={item.image || item.customizedImage || item.images?.[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="text-sm">
                    <p>
                      <strong>{item.name}</strong>
                    </p>
                    <p>Size: {item.size}</p>
                    <p>Qty: {item.quantity}</p>
                    <p>Price: ₹{item.price}</p>
                    <p>Color:{item.color}</p>
                    <p>Subtotal: ₹{item.subtotal}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4">
              <h3 className="font-bold">Tracking:</h3>
              {selectedOrder.status?.toLowerCase() !== "delivered" &&
                !selectedOrder.status?.toLowerCase().includes("cancel") && (
                  <button
                    onClick={openCancelModal}
                    className="text-sm bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              {selectedOrder?.status?.toLowerCase() === "delivered" &&
                !showReviewModal && (
                  <button
                    onClick={openReviewModal}
                    className="px-2 py-1 rounded text-sm bg-primary  text-white  cursor-pointer"
                  >
                    Leave a Review
                  </button>
                )}
            </div>

            <div className="flex justify-between items-center mb-2 mt-3">
              {trackingSteps.map((step, i) => {
                const isCancelled = selectedOrder.status
                  ?.toLowerCase()
                  .includes("cancel");
                const reachedStep = i <= getTrackingIndex(selectedOrder.status);
                const circleColor = isCancelled
                  ? reachedStep
                    ? "bg-red-600"
                    : "bg-gray-300"
                  : reachedStep
                  ? "bg-green-600"
                  : "bg-gray-300";
                const barColor = isCancelled
                  ? i < getTrackingIndex(selectedOrder.status)
                    ? "bg-red-600"
                    : "bg-gray-300"
                  : i < getTrackingIndex(selectedOrder.status)
                  ? "bg-green-600"
                  : "bg-gray-300";

                return (
                  <div key={i} className="flex-1 text-center relative">
                    <div
                      className={`w-6 h-6 rounded-full mx-auto mb-1 z-10 relative ${circleColor}`}
                    />
                    {i < trackingSteps.length - 1 && (
                      <div
                        className={`absolute top-3 left-full h-1 w-full transform -translate-x-1/2 z-0 ${barColor}`}
                      />
                    )}
                    <p className="text-xs mt-2">{step}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                {/* <h3 className="text-lg font-bold mb-2">Cancel Order</h3> */}
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border p-2 rounded mb-4"
                  rows={4}
                  placeholder="Enter cancellation reason"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
                    disabled={isCancelling}
                  >
                    Close
                  </button>
                  <button
                    onClick={submitCancelRequest}
                    className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2 cursor-pointer"
                    disabled={isCancelling}
                  >
                    {isCancelling && (
                      <ImSpinner8 className="animate-spin text-lg " />
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {showReviewModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-2">Leave a Review</h3>

                <label className="block mb-2 font-semibold">Rating:</label>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        setReviewData((prev) => ({ ...prev, rating: num }))
                      }
                      className={`w-8 h-8 rounded-full border cursor-pointer ${
                        reviewData.rating >= num
                          ? "bg-yellow-400"
                          : "bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded mb-4"
                  rows={4}
                  placeholder="Write your review here..."
                />

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
