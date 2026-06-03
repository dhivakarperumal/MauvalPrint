import React, { useState, useEffect } from "react";
import api from "../../api";
import { FaEye, FaEdit, FaTrash, FaThLarge, FaTable, FaUsers, FaUserCheck, FaUserTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const NewUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("today"); 
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, search, filter, customFrom, customTo]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users");
      const users = (data.users || []).map((user) => {
        const createdAt = user.created_at ? new Date(user.created_at) : null;
        return {
          id: user.id,
          ...user,
          createdAt,
          name: user.username || user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "",
        };
      });

      setUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users.");
    }
  };

  const applyFilters = () => {
    let temp = [...users];

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Filter by time
    temp = temp.filter((user) => {
      if (!user.createdAt) return false;
      const userDateStr = user.createdAt.toISOString().split("T")[0];

      if (filter === "today") return userDateStr === todayStr;

      if (filter === "week") {
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastDayOfWeek = new Date(now.setDate(firstDayOfWeek.getDate() + 6));
        return user.createdAt >= firstDayOfWeek && user.createdAt <= lastDayOfWeek;
      }

      if (filter === "month") {
        return (
          user.createdAt.getFullYear() === now.getFullYear() &&
          user.createdAt.getMonth() === now.getMonth()
        );
      }

      if (filter === "custom") {
        if (customFrom && customTo) {
          const from = new Date(customFrom);
          const to = new Date(customTo);
          to.setHours(23, 59, 59, 999);
          return user.createdAt >= from && user.createdAt <= to;
        }
        return true;
      }

      return true;
    });

    // Search filter
    if (search.trim() !== "") {
      temp = temp.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.phone.includes(search)
      );
    }

    setFilteredUsers(temp);
    setCurrentPage(1); // reset to first page
  };

  const handleView = (user) => {
    setSelectedUser({ ...user });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
    setEditMode(true);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/users/${selectedUser.id}`, {
        username: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone,
        role: selectedUser.role,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? selectedUser : u))
      );
      setShowModal(false);
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete user.");
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="p-4 min-h-screen">
      <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-1">New Users</h2>
      <p className="text-sm text-gray-500 mb-4">Manage New Users registered users.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* All Users */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-lg p-5 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <FaUsers size={22} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">All Users</p>
            <p className="text-2xl font-bold">{filteredUsers.length}</p>
          </div>
        </div>
        {/* Active Users */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-xl shadow-lg p-5 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <FaUserCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">Active Users</p>
            <p className="text-2xl font-bold">{filteredUsers.filter((u) => u.status === "active").length}</p>
          </div>
        </div>
        {/* Inactive Users */}
        <div className="bg-gradient-to-br from-red-600 to-red-400 rounded-xl shadow-lg p-5 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <FaUserTimes size={22} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">Inactive Users</p>
            <p className="text-2xl font-bold">{filteredUsers.filter((u) => u.status === "inactive").length}</p>
          </div>
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

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {currentUsers.length > 0 ? (
          currentUsers.map((user, index) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-2">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-600">{user.role}</p>
                <p className="text-sm text-gray-600">{user.phone}</p>
                <p className="text-xs text-gray-400">{user.createdAt?.toDateString?.()}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => handleView(user)} className="text-gray-600 border p-2 cursor-pointer rounded hover:text-blue-600 hover:bg-blue-50"><FaEye /></button>
                <button onClick={() => handleEditClick(user)} className="text-gray-600 border p-2 cursor-pointer rounded hover:text-yellow-600 hover:bg-yellow-50"><FaEdit /></button>
                <button onClick={() => handleDelete(user.id)} className="text-gray-600 border p-2 cursor-pointer rounded hover:text-red-600 hover:bg-red-50"><FaTrash /></button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">No users found.</div>
        )}
      </div>

      {/* Desktop Table View */}
      {viewMode === "table" && (
        <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3">S No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Phone</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => (
                  <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="p-3">{indexOfFirstUser + index + 1}</td>
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3">{user.phone}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleView(user)} className="text-gray-600 border p-2 cursor-pointer rounded hover:text-blue-600 hover:bg-blue-50"><FaEye /></button>
                        <button onClick={() => handleEditClick(user)} className="text-gray-600 border p-2 cursor-pointer rounded hover:text-yellow-600 hover:bg-yellow-50"><FaEdit /></button>
                        <button onClick={() => handleDelete(user.id)} className="text-gray-600 border p-2 cursor-pointer rounded hover:text-red-600 hover:bg-red-50"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Desktop Card View */}
      {viewMode === "card" && (
        <div className="hidden md:block">
          {currentUsers.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentUsers.map((user, ind) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-4 flex flex-col gap-3 cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-blue-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400">#{indexOfFirstUser + ind + 1}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="truncate" title={user.email}>
                      <span className="font-medium text-gray-700">Email:</span> {user.email}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Phone:</span> {user.phone || "\u2014"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Role:</span>{" "}
                      <span className="capitalize">{user.role || "\u2014"}</span>
                    </p>
                    <p className="text-xs text-gray-400">{user.createdAt?.toDateString?.()}</p>
                  </div>
                  <div className="flex items-center justify-end mt-auto pt-2 border-t border-gray-100">
                    <div className="flex gap-1">
                      <button onClick={() => handleView(user)} className="text-gray-500 cursor-pointer hover:text-blue-600 border p-1.5 rounded" title="View"><FaEye size={13} /></button>
                      <button onClick={() => handleEditClick(user)} className="text-gray-500 cursor-pointer hover:text-yellow-600 border p-1.5 rounded" title="Edit"><FaEdit size={13} /></button>
                      <button onClick={() => handleDelete(user.id)} className="text-gray-500 cursor-pointer hover:text-red-600 border p-1.5 rounded" title="Delete"><FaTrash size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">No users found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {currentUsers.length > 0 && (
        <div className="flex justify-end gap-2 p-3">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-3 py-1 cursor-pointer border rounded bg-gray-900 text-white"
          >
            Prev
          </button>
          <span className="border border-gray-300 px-3 py-1">
            {currentPage}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-3 py-1 cursor-pointer bg-gray-900 text-white border rounded"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-blue-900">
              {editMode ? "Edit User" : "User Details"}
            </h3>
            <div className="space-y-2">
              <input
                name="name"
                value={selectedUser.name}
                onChange={handleInputChange}
                readOnly={!editMode}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
                placeholder="Name"
              />
              <input
                name="email"
                value={selectedUser.email}
                onChange={handleInputChange}
                readOnly={!editMode}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
                placeholder="Email"
              />
              <select
                name="role"
                value={selectedUser.role}
                onChange={(e) => setSelectedUser((prev) => ({ ...prev, role: e.target.value }))}
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
                onChange={handleInputChange}
                readOnly={!editMode}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
                placeholder="Phone"
              />
            </div>
            {editMode && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpdate}
                  className="bg-blue-900 cursor-pointer text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Update
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewUsers;
