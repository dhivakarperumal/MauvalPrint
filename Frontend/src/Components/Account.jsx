import React, { useState, useEffect, useContext } from "react";
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

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Load addresses from localStorage
    const savedAddresses = JSON.parse(localStorage.getItem(`addresses_${user.uid}`) || "[]");
    setAddresses(savedAddresses);

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

      let updatedAddresses = [...addresses];
      if (editingIndex != null) {
        updatedAddresses[editingIndex] = { ...newAddress, id: addresses[editingIndex].id };
      } else {
        updatedAddresses.push({ ...newAddress, id: `addr_${Date.now()}` });
      }

      const savedAddresses = JSON.parse(localStorage.getItem(`addresses_${user.uid}`) || "[]");
      if (editingIndex != null) {
        savedAddresses[editingIndex] = updatedAddresses[editingIndex];
      } else {
        savedAddresses.push(updatedAddresses[updatedAddresses.length - 1]);
      }
      localStorage.setItem(`addresses_${user.uid}`, JSON.stringify(savedAddresses));

      setAddresses(updatedAddresses);
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
      toast.success(editingIndex != null ? "Address updated!" : "Address added!");
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const handleAddressDelete = async (id) => {
    try {
      const updatedAddresses = addresses.filter((a) => a.id !== id);
      const savedAddresses = updatedAddresses.map(({ id, ...rest }) => rest);
      localStorage.setItem(`addresses_${user.uid}`, JSON.stringify(savedAddresses));
      setAddresses(updatedAddresses);
      toast.success("Address deleted!");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
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
                    onClick={() => {
                      setNewAddress(addr);
                      setEditingIndex(idx);
                    }}
                    className="text-blue-600"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleAddressDelete(addr.id)}
                    className="text-red-600"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
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
              onClick={handleAddressSave}
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded mt-3"
            >
              {editingIndex != null ? "Update Address" : "Add Address"}
            </button>
          </div>
        );

      case "orders":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">
              My Orders
            </h2>

            {loadingOrders ? (
              <p>Loading...</p>
            ) : orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.order_id}
                    onClick={() => setSelectedOrder(order)}
                    className="border border-slate-200 rounded-2xl bg-slate-50 p-5 cursor-pointer hover:bg-white hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold">
                          Order #{order.order_id}
                        </h3>

                        <p>
                          {order.checkout?.fullname}
                        </p>

                        <p>
                          Status: {order.status}
                        </p>
                      </div>

                      <div>
                        ₹{order.total}
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
        </div>
      </section>
    </div>
  );
};

export default Account;
