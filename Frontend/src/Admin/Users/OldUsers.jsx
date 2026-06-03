import React, { useEffect, useState } from "react";
import api from "../../api";
import { FaEye, FaEdit, FaTrash, FaPlus, FaThLarge, FaTable } from "react-icons/fa";
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

      {/* Filters */}
      <div className="flex justify-between flex-col md:flex-row gap-2 md:gap-4 items-center mb-4">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-1/3"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {filter === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>
          )}
          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center border rounded overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`px-3 py-2 transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaTable />
            </button>
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`px-3 py-2 transition-colors cursor-pointer ${
                viewMode === "card"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaThLarge />
            </button>
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
