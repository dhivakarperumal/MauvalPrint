import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const response = await api.post("/register", {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      toast.success(response.data?.message || "Registration successful! Redirecting to login...");
      setError("");

      setTimeout(() => {
        onClose();
        onSwitch();
      }, 2000);
    } catch (err) {
      console.error("Registration Error:", err);
      const message =
        err?.response?.data?.message || err.message || "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
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
          <img src={tshirtImg} alt="Register" className="w-full h-auto max-h-[80vh]" />
        </div>

        {/* Form section */}
        <div className="w-full h-auto bg-white md:w-1/2 p-4 md:p-8">
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
            <div className="relative mb-5">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border-b px-2 py-2 pr-10 border-primary placeholder-primary text-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="relative mb-6">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className="w-full border-b px-2 py-2 pr-10 border-primary placeholder-primary text-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
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
