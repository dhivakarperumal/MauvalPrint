// import React, { useEffect, useState } from "react";
// import { collection, getDocs, deleteDoc, updateDoc, doc, setDoc,serverTimestamp } from "firebase/firestore";
// import { db, auth } from "../../firebase"; 
// import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
// import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
// import toast from "react-hot-toast";

// const OldUsers = ({ setActiveTab }) => {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [editMode, setEditMode] = useState(false);
//   const [addMode, setAddMode] = useState(false);

//   // Fetch users from Firestore
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, "users"));
//         const data = snapshot.docs.map((doc) => {
//           const user = doc.data();
//           return {
//             id: doc.id,
//             uid: user.uid || "", // store UID from Auth
//             name: user.fullName || user.name || user.username || "",
//             email: user.email || "",
//             phone: user.phone || "",
//             role: user.role || ""
//           };
//         });
//         setUsers(data);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         toast.error("Failed to fetch users.");
//       }
//     };
//     fetchUsers();
//   }, []);

//   // View user
//   const handleView = (user) => {
//     setSelectedUser(user);
//     setEditMode(false);
//     setAddMode(false);
//   };

//   // Edit user
//   const handleEdit = (user) => {
//     setSelectedUser({ ...user });
//     setEditMode(true);
//     setAddMode(false);
//   };

//   // Add user
//   const handleAddUser = () => {
//     setSelectedUser({ name: "", email: "", phone: "", role: "", password: "" });
//     setAddMode(true);
//     setEditMode(true);
//   };

//   // Generate password: name + last 2 digits of phone
//   const generatePassword = (name, phone) => {
//     if (!name || !phone) return "";
//     const lastTwo = phone.slice(-2);
//     return name.replace(/\s+/g, "").toLowerCase() + lastTwo;
//   };

//   const handleUpdate = async () => {
//   try {
//     let userToSave = { ...selectedUser };

//     if (addMode) {
//       // Auto-generate password
//       userToSave.password = generatePassword(userToSave.name, userToSave.phone);

//       // Create user in Firebase Auth
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         userToSave.email,
//         userToSave.password
//       );
//       const uid = userCredential.user.uid;

//       // Save user data in Firestore with UID and date
//       await setDoc(doc(db, "users", uid), {
//         uid,
//         username: userToSave.name,
//         email: userToSave.email,
//         phone: userToSave.phone,
//         role: userToSave.role,
//         password: userToSave.password,
//         createdAt: serverTimestamp(), // store creation date
//         updatedAt: serverTimestamp()  // initial updatedAt
//       });

//       setUsers((prev) => [...prev, { ...userToSave, id: uid, uid }]);
//       toast.success(`User added! Password: ${userToSave.password}`);
//     } else {
//       // Update Firestore data only
//       await updateDoc(doc(db, "users", userToSave.id), {
//         fullName: userToSave.name,
//         email: userToSave.email,
//         phone: userToSave.phone,
//         role: userToSave.role,
//         updatedAt: serverTimestamp() // update timestamp
//       });

//       setUsers((prev) =>
//         prev.map((u) => (u.id === userToSave.id ? { ...userToSave } : u))
//       );
//       toast.success("User updated successfully!");
//     }

//     setSelectedUser(null);
//     setEditMode(false);
//     setAddMode(false);
//   } catch (error) {
//     console.error("Error saving user:", error);
//     toast.error("Failed to save user. " + error.message);
//   }
// };

//   // Delete user (Firestore + Auth)
//   const handleDelete = async (user) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) return;
//     try {
//       // Delete from Firestore
//       await deleteDoc(doc(db, "users", user.id));

//       // Optionally delete from Firebase Auth
//       // Note: This requires admin privileges on server or callable function
//       // deleteUser(user.uid) // only works in backend or admin context

//       setUsers((prev) => prev.filter((u) => u.id !== user.id));
//       toast.success("User deleted successfully!");
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       toast.error("Failed to delete user.");
//     }
//   };

//   return (
//     <div className="p-4 min-h-screen relative">
//       <div className="flex justify-between items-center mb-4">
//         <div>
//           <h2 className="text-2xl font-bold text-blue-900 mb-1">Old Users</h2>
//           <p className="text-sm text-gray-500">View, edit, add, or delete users.</p>
//         </div>
//         <button
//           onClick={handleAddUser}
//           className="px-6 bg-blue-900 text-white rounded py-2 flex items-center justify-center gap-2 hover:bg-blue-800"
//         >
//           <FaPlus /> Add User
//         </button>
//       </div>

//       {/* Desktop Table */}
//       <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
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
//             {users.map((user, index) => (
//               <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
//                 <td className="p-3">{index + 1}</td>
//                 <td className="p-3">{user.name}</td>
//                 <td className="p-3">{user.email}</td>
//                 <td className="p-3">{user.role}</td>
//                 <td className="p-3">{user.phone}</td>
//                 <td className="p-3">
//                   <div className="flex justify-center gap-2">
//                     <button
//                       onClick={() => handleView(user)}
//                       className="text-gray-600 hover:text-blue-600 border border-gray-300 cursor-pointer rounded p-2"
//                       title="View"
//                     >
//                       <FaEye />
//                     </button>
//                     <button
//                       onClick={() => handleEdit(user)}
//                       className="text-gray-600 hover:text-yellow-600 border border-gray-300 cursor-pointer rounded p-2"
//                       title="Edit"
//                     >
//                       <FaEdit />
//                     </button>
//                     <button
//                       onClick={() => handleDelete(user)}
//                       className="text-gray-600 hover:text-red-600 border border-gray-300 cursor-pointer rounded p-2"
//                       title="Delete"
//                     >
//                       <FaTrash />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Mobile Card Layout */}
//       <div className="md:hidden space-y-4">
//         {users.map((user) => (
//           <div key={user.id} className="bg-white shadow rounded-lg p-4 space-y-2">
//             <div>
//               <h3 className="font-bold text-blue-900">{user.name}</h3>
//               <p className="text-sm text-gray-500">{user.email}</p>
//               <p className="text-sm text-gray-500">{user.role}</p>
//               <p className="text-sm">Phone: {user.phone}</p>
//             </div>
//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => handleView(user)}
//                 className="text-gray-600 border p-2 rounded hover:text-blue-600 hover:bg-blue-50"
//               >
//                 <FaEye />
//               </button>
//               <button
//                 onClick={() => handleEdit(user)}
//                 className="text-gray-600 border p-2 rounded hover:text-yellow-600 hover:bg-yellow-50"
//               >
//                 <FaEdit />
//               </button>
//               <button
//                 onClick={() => handleDelete(user)}
//                 className="text-gray-600 border p-2 rounded hover:text-red-600 hover:bg-red-50"
//               >
//                 <FaTrash />
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Modal */}
//       {selectedUser && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
//           <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 relative">
//             <button
//               onClick={() => {
//                 setSelectedUser(null);
//                 setAddMode(false);
//                 setEditMode(false);
//               }}
//               className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
//             >
//               ✕
//             </button>
//             <h3 className="text-lg font-bold text-blue-900">
//               {addMode ? "Add User" : editMode ? "Edit User" : "User Details"}
//             </h3>
//             <div className="space-y-2">
//               <input
//                 name="name"
//                 value={selectedUser.name}
//                 onChange={(e) =>
//                   setSelectedUser((prev) => ({ ...prev, name: e.target.value }))
//                 }
//                 readOnly={!editMode}
//                 className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
//                 placeholder="Name"
//               />
//               <input
//                 name="email"
//                 value={selectedUser.email}
//                 onChange={(e) =>
//                   setSelectedUser((prev) => ({ ...prev, email: e.target.value }))
//                 }
//                 readOnly={!editMode}
//                 className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
//                 placeholder="Email"
//               />
//               <select
//                 name="role"
//                 value={selectedUser.role}
//                 onChange={(e) =>
//                   setSelectedUser((prev) => ({ ...prev, role: e.target.value }))
//                 }
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
//                 onChange={(e) =>
//                   setSelectedUser((prev) => ({ ...prev, phone: e.target.value }))
//                 }
//                 readOnly={!editMode}
//                 className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editMode && "bg-gray-100"}`}
//                 placeholder="Phone"
//               />
//               {addMode && (
//                 <input
//                   name="password"
//                   value={generatePassword(selectedUser.name, selectedUser.phone)}
//                   readOnly
//                   className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
//                   placeholder="Password"
//                 />
//               )}
//             </div>
//             <div className="flex justify-end gap-2">
//               {editMode && (
//                 <button
//                   onClick={handleUpdate}
//                   className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
//                 >
//                   {addMode ? "Add" : "Update"}
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default OldUsers;


import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";

const OldUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);

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
    applyFilters();
  }, [users, search, filter, customFrom, customTo]);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => {
        const user = doc.data();
        let createdAt = user.createdAt?.toDate
          ? user.createdAt.toDate()
          : user.createdAt
          ? new Date(user.createdAt)
          : null;

        return {
          id: doc.id,
          uid: user.uid || "",
          name: user.fullName || user.name || user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "",
          createdAt,
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

    // Time filters
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

    // Search
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
    setSelectedUser({ name: "", email: "", phone: "", role: "", password: "" });
    setAddMode(true);
    setEditMode(true);
  };

  const handleUpdate = async () => {
    try {
      let userToSave = { ...selectedUser };

      if (addMode) {
        userToSave.password = generatePassword(userToSave.name, userToSave.phone);

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userToSave.email,
          userToSave.password
        );
        const uid = userCredential.user.uid;

        await setDoc(doc(db, "users", uid), {
          uid,
          username: userToSave.name,
          email: userToSave.email,
          phone: userToSave.phone,
          role: userToSave.role,
          password: userToSave.password,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setUsers((prev) => [...prev, { ...userToSave, id: uid, uid }]);
        toast.success(`User added! Password: ${userToSave.password}`);
      } else {
        await updateDoc(doc(db, "users", userToSave.id), {
          fullName: userToSave.name,
          email: userToSave.email,
          phone: userToSave.phone,
          role: userToSave.role,
          updatedAt: serverTimestamp(),
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
      toast.error("Failed to save user. " + error.message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", user.id));
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
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
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
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
        {currentUsers.map((user, index) => (
          <div key={user.id} className="bg-white shadow rounded-lg p-4 space-y-2">
            <div>
              <h3 className="font-bold text-blue-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
              <p className="text-sm">Phone: {user.phone}</p>
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
