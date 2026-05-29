// import React, { useState, useEffect } from "react";
// import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
// import { db } from "../../firebase";
// import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
// import toast from "react-hot-toast";

// const NewUsers = () => {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [editMode, setEditMode] = useState(false);

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const snapshot = await getDocs(collection(db, "users"));
//       const todayStr = new Date().toISOString().split("T")[0];

//       const data = snapshot.docs.map((doc) => {
//         const userData = doc.data();
//         let createdDate = null;

//         if (userData.createdAt?.toDate) {
//           createdDate = userData.createdAt.toDate();
//         } else if (typeof userData.createdAt === "string") {
//           createdDate = new Date(userData.createdAt);
//         }

//         return {
//           id: doc.id,
//           ...userData,
//           createdAt: createdDate,
//           name: userData.username || userData.name || "",
//           email: userData.email || "",
//           phone: userData.phone || "",
//           role: userData.role || "",
//         };
//       });

//       const todayUsers = data.filter(
//         (user) =>
//           user.createdAt &&
//           user.createdAt.toISOString().split("T")[0] === todayStr
//       );

//       setUsers(todayUsers);
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       toast.error("Failed to fetch users.");
//     }
//   };

//   const handleView = (user) => {
//     setSelectedUser({ ...user });
//     setEditMode(false);
//     setShowModal(true);
//   };

//   const handleEditClick = (user) => {
//     setSelectedUser({ ...user });
//     setEditMode(true);
//     setShowModal(true);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setSelectedUser((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleUpdate = async () => {
//     try {
//       const userRef = doc(db, "users", selectedUser.id);
//       await updateDoc(userRef, {
//         name: selectedUser.name,
//         email: selectedUser.email,
//         phone: selectedUser.phone,
//         role: selectedUser.role,
//       });

//       setUsers((prev) =>
//         prev.map((u) => (u.id === selectedUser.id ? selectedUser : u))
//       );
//       setShowModal(false);
//       toast.success("User updated successfully!");
//     } catch (error) {
//       console.error("Update failed:", error);
//       toast.error("Failed to update user.");
//     }
//   };

//   const handleDelete = async (userId) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) return;

//     try {
//       await deleteDoc(doc(db, "users", userId));
//       setUsers((prev) => prev.filter((u) => u.id !== userId));
//       toast.success("User deleted successfully!");
//     } catch (error) {
//       console.error("Delete failed:", error);
//       toast.error("Failed to delete user.");
//     }
//   };

//   const renderUsers = (userList) => (
//     <>
//       {/* Mobile Cards */}
//       <div className="md:hidden flex flex-col gap-4 mt-4">
//         {userList.map((user, index) => (
//           <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-2">
//             <div>
//               <p className="font-semibold">{user.name}</p>
//               <p className="text-sm text-gray-600">{user.email}</p>
//               <p className="text-sm text-gray-600">{user.role}</p>
//               <p className="text-sm text-gray-600">{user.phone}</p>
//               <p className="text-xs text-gray-400">{user.createdAt?.toDateString?.()}</p>
//             </div>
//             <div className="flex justify-end gap-3 pt-2">
//               <button onClick={() => handleView(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-blue-600 hover:bg-blue-50">
//                 <FaEye />
//               </button>
//               <button onClick={() => handleEditClick(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-yellow-600 hover:bg-yellow-50">
//                 <FaEdit />
//               </button>
//               <button onClick={() => handleDelete(user.id)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-red-600 hover:bg-red-50">
//                 <FaTrash />
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Desktop Table */}
//       <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto mt-4">
//         <table className="min-w-full text-sm text-left">
//           <thead className="bg-gray-800 text-white">
//             <tr>
//               <th className="p-3">ID</th>
//               <th className="p-3">Name</th>
//               <th className="p-3">Email</th>
//               <th className="p-3">Role</th>
//               <th className="p-3">Phone</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {userList?.map((user, index) => (
//               <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
//                 <td className="p-3">{index + 1}</td>
//                 <td className="p-3">{user.name}</td>
//                 <td className="p-3">{user.email}</td>
//                 <td className="p-3">{user.role}</td>
//                 <td className="p-3">{user.phone}</td>
//                 <td className="p-3">
//                   <div className="flex justify-center gap-2">
//                     <button onClick={() => handleView(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-blue-600 hover:bg-blue-50">
//                       <FaEye />
//                     </button>
//                     <button onClick={() => handleEditClick(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-yellow-600 hover:bg-yellow-50">
//                       <FaEdit />
//                     </button>
//                     <button onClick={() => handleDelete(user.id)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-red-600 hover:bg-red-50">
//                       <FaTrash />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </>
//   );

//   return (
//     <div className="p-4 min-h-screen">
//       <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-1">New Users</h2>
//       <p className="text-sm text-gray-500 mb-4">Users who registered today</p>
//       {users.length > 0 ? renderUsers(users) : <p>No users found.</p>}

//       {showModal && selectedUser && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
//           <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 relative">
//             <button
//               onClick={() => setShowModal(false)}
//               className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
//             >
//               ✕
//             </button>
//             <h3 className="text-lg font-bold text-blue-900">
//               {editMode ? "Edit User" : "User Details"}
//             </h3>
//             <div className="space-y-2">
//               <input
//                 name="name"
//                 value={selectedUser.name}
//                 onChange={handleInputChange}
//                 readOnly={!editMode}
//                 className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
//                 placeholder="Name"
//               />
//               <input
//                 name="email"
//                 value={selectedUser.email}
//                 onChange={handleInputChange}
//                 readOnly={!editMode}
//                 className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
//                 placeholder="Email"
//               />
//               <select
//                 name="role"
//                 value={selectedUser.role}
//                 onChange={(e) => setSelectedUser((prev) => ({ ...prev, role: e.target.value }))}
//                 disabled={!editMode}
//                 className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
//               >
//                 <option value="">Select Role</option>
//                 <option value="admin">Admin</option>
//                 <option value="user">User</option>
//               </select>
//               <input
//                 name="phone"
//                 value={selectedUser.phone}
//                 onChange={handleInputChange}
//                 readOnly={!editMode}
//                 className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
//                 placeholder="Phone"
//               />
//             </div>
//             {editMode && (
//               <div className="flex justify-end">
//                 <button
//                   onClick={handleUpdate}
//                   className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
//                 >
//                   Update
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default NewUsers;


import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { FaEye, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";

const NewUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

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
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => {
        const userData = doc.data();
        let createdDate = null;

        if (userData.createdAt?.toDate) {
          createdDate = userData.createdAt.toDate();
        } else if (typeof userData.createdAt === "string") {
          createdDate = new Date(userData.createdAt);
        }

        return {
          id: doc.id,
          ...userData,
          createdAt: createdDate,
          name: userData.username || userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          role: userData.role || "",
        };
      });

      setUsers(data);
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
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        name: selectedUser.name,
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
      await deleteDoc(doc(db, "users", userId));
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
      <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-1">Users</h2>
       <p className="text-sm text-gray-500 mb-4">Manage New Users registered users.</p>

      {/* Filters */}
      <div className="flex justify-between flex-col md:flex-row gap-2 md:gap-4 items-center mb-4">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-1/3"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
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
      </div>

      {/* Users */}
      {currentUsers.length > 0 ? (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4 mt-4">
            {currentUsers.map((user, index) => (
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
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto mt-4">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, index) => (
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
                ))}
              </tbody>
            </table>

           
          </div>

           {/* Pagination */}
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
                className="px-3 py-1 cursor-pointer bg-gray-900 text-white border rounded "
              >
                Next
              </button>
            </div>
        </>
      ) : (
        <p>No users found.</p>
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
