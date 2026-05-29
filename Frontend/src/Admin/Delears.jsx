// import React, { useState, useEffect } from "react";
// import { db } from "../firebase";
// import { collection, addDoc, getDocs } from "firebase/firestore";
// import toast from "react-hot-toast";

// const Dealers = () => {
//   const [dealer, setDealer] = useState({
//     dealerName: "",
//     gstNumber: "",
//     phone: "",
//     email: "",
//     address: "",
//     invoiceNumber: "",
//   });

//   const [dealersList, setDealersList] = useState([]);
//   const [invoiceOptions, setInvoiceOptions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showForm, setShowForm] = useState(true);

//   const fetchDealers = async () => {
//     try {
//       const snapshot = await getDocs(collection(db, "dealers"));
//       const data = snapshot.docs.map((doc, index) => ({
//         id: doc.id,
//         dealerId: `MD${String(index + 1).padStart(3, "0")}`,
//         ...doc.data(),
//       }));
//       setDealersList(data);
//     } catch (error) {
//       console.error("Error fetching dealers:", error);
//       toast.error("Failed to fetch dealers.");
//     }
//   };

//   const fetchInvoiceOptions = async () => {
//     try {
//       const snapshot = await getDocs(collection(db, "invoices"));
//       const data = snapshot.docs.map((doc) => doc.data().invoiceNo);
//       setInvoiceOptions(data);
//     } catch (error) {
//       console.error("Error fetching invoice numbers:", error);
//       toast.error("Failed to load invoice numbers.");
//     }
//   };

//   useEffect(() => {
//     fetchDealers();
//     fetchInvoiceOptions();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setDealer((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const newDealer = {
//       ...dealer,
//       createdAt: new Date().toISOString(),
//     };

//     try {
//       await addDoc(collection(db, "dealers"), newDealer);
//       toast.success("Dealer added successfully!");
//       setDealer({
//         dealerName: "",
//         gstNumber: "",
//         phone: "",
//         email: "",
//         address: "",
//         invoiceNumber: "",
//       });
//       fetchDealers();
//     } catch (error) {
//       console.error("Error adding dealer:", error);
//       toast.error("Failed to add dealer.");
//     }

//     setLoading(false);
//   };

//   const toggleView = () => setShowForm((prev) => !prev);

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-blue-900">Dealer Details</h2>
//         <p className="text-sm text-gray-500">View and manage dealer records</p>
//       </div>

//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//         <h2 className="text-2xl font-bold text-gray-700">
//           {showForm ? "Add Dealer" : "Dealer Details"}
//         </h2>
//         <div className="flex flex-row gap-3">
//           <button
//             className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium ${
//               showForm
//                 ? "bg-blue-900 text-white"
//                 : "bg-gray-300 text-blue-900 hover:bg-gray-200"
//             }`}
//             onClick={() => setShowForm(true)}
//           >
//             Add Dealer
//           </button>
//           <button
//             className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium ${
//               !showForm
//                 ? "bg-blue-900 text-white"
//                 : "bg-gray-300 text-blue-900 hover:bg-gray-200"
//             }`}
//             onClick={toggleView}
//           >
//             Show Dealers
//           </button>
//         </div>
//       </div>

//       {showForm ? (
//         <form
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded shadow"
//         >
//           <div className="text-gray-700 font-semibold col-span-full mb-2">
//             Dealer ID:{" "}
//             <span className="text-black">
//               MD{String(dealersList.length + 1).padStart(3, "0")}
//             </span>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Dealer Name *
//             </label>
//             <input
//               name="dealerName"
//               value={dealer.dealerName}
//               onChange={handleChange}
//               placeholder="Enter dealer's name"
//               required
//               className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               GST Number *
//             </label>
//             <input
//               name="gstNumber"
//               value={dealer.gstNumber}
//               onChange={handleChange}
//               placeholder="Enter GST number"
//               required
//               className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Phone Number *
//             </label>
//             <input
//               name="phone"
//               value={dealer.phone}
//               onChange={handleChange}
//               placeholder="Enter phone number"
//               required
//               className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Email Address *
//             </label>
//             <input
//               name="email"
//               type="email"
//               value={dealer.email}
//               onChange={handleChange}
//               placeholder="Enter email address"
//               required
//               className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Address *
//             </label>
//             <textarea
//               name="address"
//               value={dealer.address}
//               onChange={handleChange}
//               placeholder="Enter full address"
//               required
//               rows={3}
//               className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Select Invoice Number *
//             </label>
//             <select
//               name="invoiceNumber"
//               value={dealer.invoiceNumber}
//               onChange={handleChange}
//               required
//               className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             >
//               <option value="">Select invoice number</option>
//               {invoiceOptions.map((inv) => (
//                 <option key={inv} value={inv}>
//                   {inv}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="md:col-span-2 flex justify-end mt-4">
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded cursor-pointer"
//             >
//               {loading ? "Adding..." : "Add Dealer"}
//             </button>
//           </div>
//         </form>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
//           {dealersList.length > 0 ? (
//             dealersList.map((d) => (
//               <div
//                 key={d.id}
//                 className="bg-white shadow rounded-lg p-4 border border-gray-200"
//               >
//                 <p>
//                   <strong>ID:</strong> {d.dealerId}
//                 </p>
//                 <p>
//                   <strong>Name:</strong> {d.dealerName}
//                 </p>
//                 <p>
//                   <strong>GST:</strong> {d.gstNumber}
//                 </p>
//                 <p>
//                   <strong>Phone:</strong> {d.phone}
//                 </p>
//                 <p>
//                   <strong>Email:</strong> {d.email}
//                 </p>
//                 <p>
//                   <strong>Address:</strong> {d.address}
//                 </p>
//                 <p>
//                   <strong>Invoice No.:</strong> {d.invoiceNumber}
//                 </p>
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-gray-500 col-span-full">
//               No dealer details found.
//             </p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dealers;


import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";

const Dealers = () => {
  const [dealer, setDealer] = useState({
    dealerName: "",
    gstNumber: "",
    phone: "",
    email: "",
    address: "",
    invoiceNumber: "",
  });

  const [dealersList, setDealersList] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const fetchDealers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "dealers"));
      const data = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        dealerId: `MD${String(index + 1).padStart(3, "0")}`,
        ...doc.data(),
      }));
      setDealersList(data);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      toast.error("Failed to fetch dealers.");
    }
  };

  const fetchInvoiceOptions = async () => {
    try {
      const snapshot = await getDocs(collection(db, "invoices"));
      const data = snapshot.docs.map((doc) => doc.data().invoiceNo);
      setInvoiceOptions(data);
    } catch (error) {
      console.error("Error fetching invoice numbers:", error);
      toast.error("Failed to load invoice numbers.");
    }
  };

  useEffect(() => {
    fetchDealers();
    fetchInvoiceOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDealer((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setDealer({
      dealerName: "",
      gstNumber: "",
      phone: "",
      email: "",
      address: "",
      invoiceNumber: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update dealer
        const ref = doc(db, "dealers", editingId);
        await updateDoc(ref, dealer);
        toast.success("Dealer updated successfully!");
      } else {
        // Add dealer
        await addDoc(collection(db, "dealers"), dealer);
        toast.success("Dealer added successfully!");
      }
      resetForm();
      fetchDealers();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving dealer:", error);
      toast.error("Failed to save dealer.");
    }

    setLoading(false);
  };

  const handleEdit = (d) => {
    setDealer({
      dealerName: d.dealerName,
      gstNumber: d.gstNumber,
      phone: d.phone,
      email: d.email,
      address: d.address,
      invoiceNumber: d.invoiceNumber,
    });
    setEditingId(d.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this dealer?")) {
      try {
        await deleteDoc(doc(db, "dealers", id));
        toast.success("Dealer deleted!");
        fetchDealers();
      } catch (error) {
        console.error("Error deleting dealer:", error);
        toast.error("Failed to delete dealer.");
      }
    }
  };

  const toggleView = () => setShowForm((prev) => !prev);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Dealer Details</h2>
        <p className="text-sm text-gray-500">View and manage dealer records</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-700">
          {showForm ? (editingId ? "Edit Dealer" : "Add Dealer") : "Dealer Details"}
        </h2>
        <div className="flex flex-row gap-3">
          <button
            className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium ${
              showForm
                ? "bg-blue-900 text-white"
                : "bg-gray-300 text-blue-900 hover:bg-gray-200"
            }`}
            onClick={() => setShowForm(true)}
          >
            Add Dealer
          </button>
          <button
            className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium ${
              !showForm
                ? "bg-blue-900 text-white"
                : "bg-gray-300 text-blue-900 hover:bg-gray-200"
            }`}
            onClick={toggleView}
          >
            Show Dealers
          </button>
        </div>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded shadow"
        >
          <div className="text-gray-700 font-semibold col-span-full mb-2">
            Dealer ID:{" "}
            <span className="text-black">
              MD{String(dealersList.length + 1).padStart(3, "0")}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dealer Name *
            </label>
            <input
              name="dealerName"
              value={dealer.dealerName}
              onChange={handleChange}
              placeholder="Enter dealer's name"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number *
            </label>
            <input
              name="gstNumber"
              value={dealer.gstNumber}
              onChange={handleChange}
              placeholder="Enter GST number"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              name="phone"
              value={dealer.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              name="email"
              type="email"
              value={dealer.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              name="address"
              value={dealer.address}
              onChange={handleChange}
              placeholder="Enter full address"
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Invoice Number *
            </label>
            <select
              name="invoiceNumber"
              value={dealer.invoiceNumber}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select invoice number</option>
              {invoiceOptions.map((inv) => (
                <option key={inv} value={inv}>
                  {inv}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded cursor-pointer"
            >
              {loading ? "Saving..." : editingId ? "Update Dealer" : "Add Dealer"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {dealersList.length > 0 ? (
            dealersList.map((d) => (
              <div
                key={d.id}
                className="bg-white shadow rounded-lg p-4 border border-gray-200"
              >
                <p>
                  <strong>ID:</strong> {d.dealerId}
                </p>
                <p>
                  <strong>Name:</strong> {d.dealerName}
                </p>
                <p>
                  <strong>GST:</strong> {d.gstNumber}
                </p>
                <p>
                  <strong>Phone:</strong> {d.phone}
                </p>
                <p>
                  <strong>Email:</strong> {d.email}
                </p>
                <p>
                  <strong>Address:</strong> {d.address}
                </p>
                <p>
                  <strong>Invoice No.:</strong> {d.invoiceNumber}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(d)}
                    className="text-gray-600 border p-2 rounded cursor-pointer flex items-center justify-center"
                    title="Edit Dealer"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-gray-600 border p-2 rounded cursor-pointer flex items-center justify-center"
                    title="Delete Dealer"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              No dealer details found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dealers;
