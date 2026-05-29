import React, { useState, useEffect } from "react";
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
import Head from "./Head";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

const Account = () => {
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

  const navigate = useNavigate();
  const location = useLocation();

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchUserData = async () => {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        setUserInfo(docSnap.data());
      }

      const addressSnapshot = await getDocs(
        collection(db, `users/${user.uid}/address`)
      );
      const addressData = addressSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAddresses(addressData);
    };
    fetchUserData();

    if (location.state?.goTo === "address") {
      setActiveTab("address");
    }
  }, [user]);

  const logout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await signOut(auth);
      navigate("/");
    }
  };

  const updateUserInfo = async () => {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, userInfo);
    alert("Profile updated successfully!");
  };

  const updatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordFields;

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await auth.currentUser.updatePassword(newPassword);
      alert("Password updated successfully");
      setPasswordFields({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert("Error updating password: " + err.message);
    }
  };

  const handleAddressSave = async () => {
    if (editingIndex != null) {
      const addrId = addresses[editingIndex].id;
      const addrRef = doc(db, `users/${user.uid}/address`, addrId);
      await updateDoc(addrRef, newAddress);
    } else {
      const newRef = doc(collection(db, `users/${user.uid}/address`));
      await setDoc(newRef, newAddress);
    }

    const updatedSnapshot = await getDocs(
      collection(db, `users/${user.uid}/address`)
    );
    const addressData = updatedSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAddresses(addressData);
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
  };

  const handleAddressDelete = async (id) => {
    await deleteDoc(doc(db, `users/${user.uid}/address`, id));
    setAddresses(addresses.filter((a) => a.id !== id));
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
                className={`flex items-center gap-2 px-4 py-2 text-lg font-bold border-b-4 transition-all duration-200 ${
                  activeTab === tab.key
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
