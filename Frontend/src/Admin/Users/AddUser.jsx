import React, { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function AddUser() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!form.email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role,
        createdAt: new Date().toISOString(),
      });

      toast.success("User added successfully!");
      setForm({
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "user",
      });
      setError("");
    } catch (err) {
      console.error("Firebase Error:", err);
      setError(err.message);
      toast.error("Failed to add user.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold  text-center text-primary uppercase mb-4">
          Add New User
        </h2>
        {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleAddUser} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border-b px-2 py-2 border-primary placeholder-primary text-primary"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border-b px-2 py-2 border-primary placeholder-primary text-primary"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border-b px-2 py-2 border-primary placeholder-primary text-primary"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border-b px-2 py-2 border-primary placeholder-primary text-primary"
            required
          />
          <select
            name="role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border-b px-2 py-2 border-primary text-primary bg-white"
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            {/* <option value="moderator">Moderator</option> */}
          </select>
          <button
            type="submit"
            className="w-full cursor-pointer bg-[#283b53] text-white py-2 rounded"
          >
            Add User
          </button>
        </form>
      </div>
    </div>
  );
}
