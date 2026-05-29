import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import tshirtImg from "/Image/register.png";

export default function Register({ onClose, onSwitch }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    // ✅ Basic validation
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    try {
      // ✅ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // ✅ Assign role
      const role =
        form.email.toLowerCase() === "vasanthloagn2525@gmail.com"
          ? "admin"
          : "user";

      // ✅ Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: form.username,
        email: form.email,
        phone: form.phone,
        role,
        createdAt: new Date().toISOString(),
      });

      toast.success("Registration successful! Redirecting to login...");
      setError("");

      // ✅ Redirect to login modal
      setTimeout(() => {
        onClose();
        onSwitch();
      }, 2000);
    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.message);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50">
      <div className="relative flex w-full max-w-5xl rounded-lg bg-gray-300 shadow-lg overflow-hidden">
        <button
          className="absolute top-4 right-4 text-2xl text-primary cursor-pointer"
          onClick={onClose}
        >
          <IoClose />
        </button>

        {/* Left side image */}
        <div className="hidden md:flex w-1/2 bg-white/60 items-center justify-center">
          <img src={tshirtImg} alt="Register" className="w-full h-[90vh]" />
        </div>

        {/* Form section */}
        <div className="w-full h-[95vh] bg-white md:w-1/2 p-4 md:p-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/Image/logo.png"
              className="w-18 h-18 md:w-23 md:h-23 text-center  rounded-full"
              alt="Logo"
            />
          </div>

          <h2 className="text-xl font-semibold text-center text-primary uppercase mb-4">
            Create Account
          </h2>

          {error && <div className="text-red-600 mb-4 text-center">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-3">
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              className="w-full border-b mb-6 px-2 py-2 border-primary placeholder-primary text-primary"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#283b53] text-white py-2 rounded cursor-pointer"
            >
              Register
            </button>
          </form>

          <p className="text-center mt-3 text-sm text-black">
            Already have an account?{" "}
            <button
              onClick={onSwitch}
              className="text-primary underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
