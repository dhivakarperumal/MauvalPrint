import React, { useState, useContext, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { AuthContext } from "../Context/AuthContext";
import tshirtImg from "/Image/login.png";
import { toast } from "react-toastify";

export default function Login({ onClose, onSwitch }) {
  const { loginWithEmail } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedChecked = localStorage.getItem("rememberMe") === "true";
    if (savedEmail && savedChecked) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(form.email, form.password);
      toast.success("Login successful!");

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.setItem("rememberMe", "false");
      }

      onClose();
      // navigate("/"); // uncomment if you want redirect
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Invalid email or password";
      toast.error(errorMessage);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50">
      <div className="relative flex w-full max-w-4xl rounded-lg bg-gray-300 shadow-lg overflow-hidden">
        <button
          className="absolute top-4 right-4 text-2xl text-primary cursor-pointer"
          onClick={onClose}
        >
          <IoClose />
        </button>

        <div className="hidden md:flex w-1/2 bg-white/60 items-center justify-center">
          <img
            src={tshirtImg}
            alt="T-shirt"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="w-full bg-white md:w-1/2 p-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/Image/logo.png"
              alt="Logo"
              className="w-20 h-20 text-center  rounded-full"
            />
          </div>
          <h2 className="text-xl font-semibold text-center text-primary uppercase mb-4">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border-b px-4 py-2 border-primary mb-5 placeholder-primary text-primary"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border-b px-4 py-2 mb-2 border-primary placeholder-primary text-primary"
              required
            />

            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center text-sm text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#283b53] text-white py-2 rounded cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="my-4 text-center text-gray-500">or</div>

          <p className="text-center mt-3 text-sm text-black">
            Don't have an account?{" "}
            <button
              onClick={onSwitch}
              className="text-primary underline cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
