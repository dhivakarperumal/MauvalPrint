import React, { useEffect, useState } from "react";
import api from "../../api";
import { FaEye, FaEdit, FaTrash, FaPlus, FaThLarge, FaTable, FaUsers, FaUserCheck, FaUserTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const OldUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); 
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let temp = [...users];
    const now = new Date();

    temp = temp.filter((user) => {
      if (!user.createdAt) return true;

      const userDate = user.createdAt;

      if (filter === "today") {
        return userDate.toDateString() === now.toDateString();
      }

      if (filter === "week") {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        return userDate >= firstDay && userDate <= lastDay;
      }

      if (filter === "month") {
        return (
          userDate.getMonth() === now.getMonth() &&
          userDate.getFullYear() === now.getFullYear()
        );
      }

      if (filter === "custom" && customFrom && customTo) {
        const from = new Date(customFrom);
        const to = new Date(customTo);
        to.setHours(23, 59, 59, 999);
        return userDate >= from && userDate <= to;
      }

      return true;
    });

    if (search.trim() !== "") {
      temp = temp.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.phone.includes(search)
      );
    }

    setFilteredUsers(temp);
    setCurrentPage(1);
  }, [users, search, filter, customFrom, customTo]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users");
      const dataUsers = (data.users || []).map((user) => {
        return {
          id: user.id,
          user_id: user.user_id || user.id,
          name: user.username || user.fullName || user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "",
          status: user.status || "active",
          createdAt: user.created_at ? new Date(user.created_at) : null,
        };
      });
      setUsers(dataUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users.");
    }
  };

  // Generate password
  const generatePassword = (name, phone) => {
    if (!name || !phone) return "";
    const lastTwo = phone.slice(-2);
    return name.replace(/\s+/g, "").toLowerCase() + lastTwo;
  };

  // CRUD Handlers
  const handleView = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setAddMode(false);
  };

  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setEditMode(true);
    setAddMode(false);
  };

  const handleAddUser = () => {
    setSelectedUser({ name: "", email: "", phone: "", role: "", password: "", status: "active" });
    setAddMode(true);
    setEditMode(true);
  };

  const handleUpdate = async () => {
    try {
      const userToSave = { ...selectedUser };

      if (addMode) {
        const password = generatePassword(userToSave.name, userToSave.phone);
        const payload = {
          username: userToSave.name,
          email: userToSave.email,
          phone: userToSave.phone,
          password,
          confirmPassword: password,
        };

        const { data } = await api.post("/register", payload);
        const newUser = {
          id: data.user_id || data.data?.user_id || userToSave.email,
          user_id: data.user_id || data.data?.user_id || userToSave.email,
          name: userToSave.name,
          email: userToSave.email,
          phone: userToSave.phone,
          role: userToSave.role || "user",
          status: userToSave.status || "active",
          createdAt: new Date(),
        };

        setUsers((prev) => [...prev, newUser]);
        toast.success(`User added! Password: ${password}`);
      } else {
        await api.put(`/users/${userToSave.id}`, {
          username: userToSave.name,
          email: userToSave.email,
          phone: userToSave.phone,
          role: userToSave.role,
          status: userToSave.status,
        });

        setUsers((prev) =>
          prev.map((u) => (u.id === userToSave.id ? { ...userToSave } : u))
        );
        toast.success("User updated successfully!");
      }

      setSelectedUser(null);
      setEditMode(false);
      setAddMode(false);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user. " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "inactive" ? "active" : "inactive";
    try {
      console.log(`=== STATUS TOGGLE REQUEST ===`);
      console.log(`User Object:`, user);
      console.log(`User ID:`, user.id);
      console.log(`User ID Type:`, typeof user.id);
      console.log(`New Status:`, newStatus);
      console.log(`Full URL: /users/${user.id}/status`);
      
      const response = await api.patch(`/users/${user.id}/status`, {
        status: newStatus,
      });
      
      console.log("Status update response:", response.data);
      
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error toggling status - Full Error:", error);
      console.error("Error Response:", error.response?.data);
      console.error("Error Status:", error.response?.status);
      toast.error("Failed to update user status. " + (error.response?.data?.message || error.message));
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="p-4 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-1">Old Users</h2>
          <p className="text-sm text-gray-500">Manage all registered users.</p>
        </div>
        <button
          onClick={handleAddUser}
          className="px-6 bg-blue-900 cursor-pointer text-white rounded py-2 flex items-center gap-2 hover:bg-blue-800"
        >
          <FaPlus /> Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* All Users */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-lg p-6 text-white flex justify-between items-center">
          <div className="flex flex-col z-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 opacity-90 text-blue-50">Total Users</p>
            <p className="text-5xl font-black mb-4 drop-shadow-md italic tracking-tighter">{users.length}</p>
            <p className="text-xs opacity-80 text-blue-50">All registered users</p>
          </div>
          <div className="z-10 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
            <FaUsers size={28} className="drop-shadow-md text-white" />
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-400/30 rounded-full blur-xl"></div>
        </div>
        {/* Active Users */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-xl shadow-lg p-6 text-white flex justify-between items-center">
          <div className="flex flex-col z-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 opacity-90 text-emerald-50">Active Users</p>
            <p className="text-5xl font-black mb-4 drop-shadow-md italic tracking-tighter">{users.filter((u) => u.status === "active").length}</p>
            <p className="text-xs opacity-80 text-emerald-50">Currently active</p>
          </div>
          <div className="z-10 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
            <FaUserCheck size={28} className="drop-shadow-md text-white" />
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-400/30 rounded-full blur-xl"></div>
        </div>
        {/* Inactive Users */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-400 rounded-xl shadow-lg p-6 text-white flex justify-between items-center">
          <div className="flex flex-col z-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 opacity-90 text-purple-50">Inactive Users</p>
            <p className="text-5xl font-black mb-4 drop-shadow-md italic tracking-tighter">{users.filter((u) => u.status === "inactive").length}</p>
            <p className="text-xs opacity-80 text-purple-50">Currently inactive</p>
          </div>
          <div className="z-10 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
            <FaUserTimes size={28} className="drop-shadow-md text-white" />
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-400/30 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search Input with Icon */}
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3 flex-wrap ml-auto">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-200 bg-gray-50 px-4 py-2.5 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Custom Date Range */}
            {filter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            )}

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-gray-200"></div>

            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-2 rounded-md transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaTable size={14} />
              </button>
              <button
                onClick={() => setViewMode("card")}
                title="Card View"
                className={`p-2 rounded-md transition-all cursor-pointer ${
                  viewMode === "card"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaThLarge size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      {viewMode === "table" && (
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3">S No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, ind) => (
                <tr
                  key={user.id}
                  onDoubleClick={() => handleToggleStatus(user)}
                  className={`border-t border-gray-200 hover:bg-gray-50 ${
                    user.status === "inactive" ? "bg-red-50" : ""
                  } cursor-pointer`}
                >
                  <td className="p-3 break-all max-w-xs">{ind + 1}</td>
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.role}</td>
                  <td className="p-3">{user.phone}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleView(user)}
                        className="text-gray-600 cursor-pointer hover:text-blue-600 border p-2 rounded"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-gray-600 cursor-pointer hover:text-yellow-600 border p-2 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-gray-600 cursor-pointer hover:text-red-600 border p-2 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Desktop Card View */}
      {viewMode === "card" && (
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentUsers.map((user, ind) => (
            <div
              key={user.id}
              onDoubleClick={() => handleToggleStatus(user)}
              className={`bg-white rounded-xl shadow hover:shadow-md transition-shadow p-4 flex flex-col gap-3 cursor-pointer border ${
                user.status === "inactive" ? "border-red-200 bg-red-50" : "border-gray-100"
              }`}
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-blue-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400">#{ind + 1}</p>
                </div>
              </div>
              {/* Info */}
              <div className="text-sm text-gray-600 space-y-1">
                <p className="truncate" title={user.email}>
                  <span className="font-medium text-gray-700">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Phone:</span> {user.phone || "—"}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Role:</span>{" "}
                  <span className="capitalize">{user.role || "—"}</span>
                </p>
              </div>
              {/* Status + Actions */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                    user.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleView(user)}
                    className="text-gray-500 cursor-pointer hover:text-blue-600 border p-1.5 rounded"
                    title="View"
                  >
                    <FaEye size={13} />
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-gray-500 cursor-pointer hover:text-yellow-600 border p-1.5 rounded"
                    title="Edit"
                  >
                    <FaEdit size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="text-gray-500 cursor-pointer hover:text-red-600 border p-1.5 rounded"
                    title="Delete"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

          <div className="flex justify-end gap-2 p-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1 border cursor-pointer rounded bg-gray-900 text-white"
              >
                Prev
              </button>
              <span className="border cursor-pointer border-gray-300 px-3 py-1">
                {currentPage} 
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1 cursor-pointer bg-gray-900 text-white border rounded "
              >
                Next
              </button>
            </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {currentUsers.map((user) => (
          <div
            key={user.id}
            onDoubleClick={() => handleToggleStatus(user)}
            className={`bg-white shadow rounded-lg p-4 space-y-2 cursor-pointer ${user.status === "inactive" ? "bg-red-50" : ""}`}
          >
            <div>
              <p className="text-xs text-gray-400 break-all">ID: {user.user_id}</p>
              <h3 className="font-bold text-blue-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
              <p className="text-sm">Phone: {user.phone}</p>
              <p className="text-sm mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                    user.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleView(user)}
                className="text-gray-600 border cursor-pointer p-2 rounded hover:text-blue-600 hover:bg-blue-50"
              >
                <FaEye />
              </button>
              <button
                onClick={() => handleEdit(user)}
                className="text-gray-600 border p-2 cursor-pointer rounded hover:text-yellow-600 hover:bg-yellow-50"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(user)}
                className="text-gray-600 border p-2 cursor-pointer rounded hover:text-red-600 hover:bg-red-50"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 relative">
            <button
              onClick={() => {
                setSelectedUser(null);
                setAddMode(false);
                setEditMode(false);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-blue-900">
              {addMode ? "Add User" : editMode ? "Edit User" : "User Details"}
            </h3>
            <div className="space-y-2">
              <input
                name="name"
                value={selectedUser.name}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev, name: e.target.value }))
                }
                readOnly={!editMode}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
                placeholder="Name"
              />
              <input
                name="email"
                value={selectedUser.email}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev, email: e.target.value }))
                }
                readOnly={!editMode}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
                placeholder="Email"
              />
              <select
                name="role"
                value={selectedUser.role}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev, role: e.target.value }))
                }
                disabled={!editMode}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <input
                name="phone"
                value={selectedUser.phone}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev, phone: e.target.value }))
                }
                readOnly={!editMode}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
                placeholder="Phone"
              />
              {addMode && (
                <input
                  name="password"
                  value={generatePassword(selectedUser.name, selectedUser.phone)}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                  placeholder="Password"
                />
              )}
            </div>
            {editMode && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpdate}
                  className="bg-blue-900 cursor-pointer text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  {addMode ? "Add" : "Update"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OldUsers;
