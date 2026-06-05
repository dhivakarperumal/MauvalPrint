import React, { useState, useEffect, useContext, useRef } from "react";
import {
  FaUser,
  FaMapMarkerAlt,
  FaLock,
  FaSignOutAlt,
  FaTrashAlt,
  FaEye,
  FaEyeSlash,
  FaEdit,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import api from "../api";
import { toast } from "react-toastify";
import Head from "./Head";
import { FaBoxOpen } from "react-icons/fa";
import { FaPrint } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";

const Account = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("personal");
  const [userInfo, setUserInfo] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    fullname: "",
    contact: "",
    email: "",
    city: "",
    zip: "",
    state: "",
    street: "",
    country: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [reason, setReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: "",
  });

  const printRef = useRef();

  const navigate = useNavigate();
  const location = useLocation();

  const dedupeAddresses = (list) => {
    const seen = new Set();
    return list.filter((addr) => {
      const key = JSON.stringify({
        fullname: addr.fullname?.trim() || "",
        contact: addr.contact?.trim() || "",
        email: addr.email?.trim() || "",
        city: addr.city?.trim() || "",
        zip: addr.zip?.trim() || "",
        state: addr.state?.trim() || "",
        street: addr.street?.trim() || "",
        country: addr.country?.trim() || "",
      });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const loadAddresses = async () => {
    if (!user?.uid) return;
    setLoadingAddresses(true);
    try {
      const { data } = await api.get(`/users/${user.uid}/addresses`);
      const addresses = data.success && Array.isArray(data.addresses) ? data.addresses : [];
      setAddresses(dedupeAddresses(addresses));
    } catch (error) {
      console.error("Error loading addresses:", error);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadAddresses();
    
    const fetchUserData = async () => {
      try {
        const { data } = await api.get(`/users/${user.uid}`);
        if (data?.success) {
          setUserInfo({
            username: data.user?.username || user.username || "",
            email: data.user?.email || user.email || "",
            phone: data.user?.phone || user.phone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserInfo({
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
        });
      }
    };

    fetchUserData();

    if (location.state?.goTo === "address") {
      setActiveTab("address");
    }
  }, [user, navigate, location.state]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);

        const { data } = await api.get(`/orders/user/${user.uid}`);

        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);


  const logout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setUser(null);
      localStorage.removeItem("apiUser");
      localStorage.removeItem("token");
      navigate("/");
      toast.success("Logged out successfully");
    }
  };

  const updateUserInfo = async () => {
    try {
      const { data } = await api.put(`/users/${user.uid}`, {
        username: userInfo.username,
        email: userInfo.email,
        phone: userInfo.phone,
      });
      if (data?.success) {
        toast.success("Profile updated successfully!");
        setUser({ ...user, ...userInfo });
        localStorage.setItem("apiUser", JSON.stringify({ ...user, ...userInfo }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    }
  };

  const updatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordFields;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      const { data } = await api.put(`/users/${user.uid}/password`, {
        currentPassword,
        newPassword,
      });
      if (data?.success) {
        toast.success("Password updated successfully");
        setPasswordFields({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error?.response?.data?.message || "Failed to update password");
    }
  };

  const handleAddressSave = async () => {
    try {
      if (!newAddress.fullname || !newAddress.contact || !newAddress.city) {
        toast.error("Please fill in all required fields");
        return;
      }

      const payload = { ...newAddress };
      delete payload.id;

      if (editingIndex != null) {
        const addressToUpdate = addresses[editingIndex];
        const { data } = await api.put(
          `/users/${user.uid}/addresses/${addressToUpdate.id}`,
          payload
        );
        if (data?.success) {
          const updated = [...addresses];
          updated[editingIndex] = { ...payload, id: addressToUpdate.id };
          setAddresses(dedupeAddresses(updated));
          toast.success("Address updated!");
        }
      } else {
        const { data } = await api.post(`/users/${user.uid}/addresses`, payload);
        if (data?.success) {
          const newAddressWithId = { ...payload, id: data.address_id };
          setAddresses((prev) => dedupeAddresses([newAddressWithId, ...prev]));
          toast.success("Address added!");
        }
      }
      setNewAddress({
        fullname: "",
        contact: "",
        email: "",
        city: "",
        zip: "",
        state: "",
        street: "",
        country: "",
      });
      setEditingIndex(null);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(error?.response?.data?.message || "Failed to save address");
    }
  };

  const handleAddressDelete = async (id) => {
    try {
      await api.delete(`/users/${user.uid}/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted!");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error?.response?.data?.message || "Failed to delete address");
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
          <img src="${window.location.origin
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
            ${order.checkout?.city}, ${order.checkout?.state} - ${order.checkout?.zip
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
                    <img src="${item.image || item.customizedImage || "/placeholder.jpg"
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

  const renderTabContent = () => {
    if (activeTab === "logout") return logout();

    switch (activeTab) {
      case "personal":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">
              Personal Details
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2 space-y-3">
                <p>
                  <strong>Name:</strong> {userInfo.username}
                </p>
                <p>
                  <strong>Email:</strong> {userInfo.email}
                </p>
                <p>
                  <strong>Phone:</strong> {userInfo.phone}
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateUserInfo();
                }}
                className="md:w-1/2 grid grid-cols-1 gap-4"
              >
                <input
                  value={userInfo.username || ""}
                  onChange={(e) =>
                    setUserInfo((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="Username"
                  className="p-2 border rounded"
                />
                <input
                  value={userInfo.email || ""}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Email"
                  className="p-2 border rounded"
                />
                <input
                  value={userInfo.phone || ""}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone"
                  className="p-2 border rounded"
                />
                <button
                  type="submit"
                  className="bg-[var(--color-primary)] text-white px-6 py-2 rounded"
                >
                  Update Profile
                </button>
              </form>
            </div>
          </div>
        );

      case "address":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">
              Address Book
            </h2>
            {loadingAddresses && (
              <div className="p-4 text-sm text-gray-600">Loading addresses...</div>
            )}
            {!loadingAddresses && addresses.length === 0 && (
              <div className="p-4 text-sm text-gray-600">No saved addresses yet.</div>
            )}
            {!loadingAddresses && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr, idx) => (
                  <div
                    key={addr.id}
                    className="border p-4 rounded mb-2 flex justify-between"
                  >
                    <div>
                      <p>
                        <strong>{addr.fullname}</strong> — {addr.contact}
                      </p>
                      <p>
                        {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                      </p>
                      <p>{addr.country}</p>
                    </div>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddress(addr);
                          setEditingIndex(idx);
                        }}
                        className="text-blue-600"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddressDelete(addr.id)}
                        className="text-red-600"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {Object.entries(newAddress).map(([key, val]) => (
                <input
                  key={key}
                  name={key}
                  value={val}
                  placeholder={key}
                  onChange={(e) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="border p-2 rounded"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddressSave}
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded mt-3"
            >
              {editingIndex != null ? "Update Address" : "Add Address"}
            </button>
          </div>
        );

     case "orders":
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">
          My Orders
        </h2>

        {!loadingOrders && orders.length > 0 && (
          <span className="text-sm bg-slate-100 px-3 py-1 rounded-full text-slate-600">
            {orders.length} Orders
          </span>
        )}
      </div>

      {loadingOrders ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-slate-700">
            No Orders Found
          </h3>
          <p className="text-slate-500 mt-2">
            Your order history will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.order_id}
              onClick={() => setSelectedOrder(order)}
              className="group bg-white border border-slate-400 rounded-2xl p-4 sm:p-5 cursor-pointer hover:shadow-xl hover:border-[var(--color-primary)] transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="font-bold text-base sm:text-lg break-all text-slate-800">
                      #{order.order_id || order.orderID}
                    </h3>

                    <span
                      className={`w-fit px-3 py-1 rounded-full text-xs font-semibold tracking-wide
                      ${
                        order.status
                          ?.toLowerCase()
                          .includes("cancel")
                          ? "bg-red-100 text-red-700"
                          : order.status
                              ?.toLowerCase()
                              .includes("delivered")
                          ? "bg-green-100 text-green-700"
                          : order.status
                              ?.toLowerCase()
                              .includes("shipped")
                          ? "bg-orange-100 text-orange-700"
                          : order.status
                              ?.toLowerCase()
                              .includes("paked")
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Customer</p>
                      <p className="font-medium text-slate-800">
                        {order.checkout?.fullname}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500 mb-1">Phone</p>
                      <p className="font-medium text-slate-800">
                        {order.checkout?.contact}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 lg:pl-6 border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                    Order Date
                  </p>

                  <p className="font-medium text-slate-700 text-sm">
                    {new Date(
                      order.created_at || order.createdAt
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(
                      order.created_at || order.createdAt
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="mt-3 text-[var(--color-primary)] text-sm font-semibold group-hover:translate-x-1 transition-transform">
                    View Details →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
      
      case "password":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Change Password</h2>
            {Object.entries(passwordFields).map(([field, value]) => (
              <div key={field} className="relative md:w-150 mb-4">
                <label className="block font-semibold mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type={showPassword[field] ? "text" : "password"}
                  name={field}
                  value={value}
                  onChange={(e) => setPasswordFields((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="border p-2 rounded w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))}
                  className="absolute right-3 top-9 text-gray-600"
                >
                  {showPassword[field] ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            ))}
            <button onClick={updatePassword} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded">Update Password</button>
          </div>
        );

      default:
        return null;
    }
  };



  const tabs = [
    { key: "personal", label: "Personal Details", icon: <FaUser /> },
    { key: "password", label: "Password", icon: <FaLock /> },
    { key: "address", label: "Address", icon: <FaMapMarkerAlt /> },
    {
      key: "orders",
      label: "Orders",
      icon: <FaBoxOpen />
    },
    { key: "logout", label: "Logout", icon: <FaSignOutAlt /> },
  ];

  return (
    <div className="mt-18">
      <Head title="My Account" subtitle="Account" />
      <section className="bg-gray-100 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-6 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-lg font-bold border-b-4 transition-all duration-200 ${activeTab === tab.key
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-gray-500 hover:text-[var(--color-primary)]"
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          {renderTabContent()}
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
                          className={`w-8 h-8 rounded-full border cursor-pointer ${reviewData.rating >= num
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
      </section>
    </div>
  );
};

export default Account;
