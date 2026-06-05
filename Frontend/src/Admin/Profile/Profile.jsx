import React, { useState, useEffect, useContext } from "react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../Context/AuthContext";

const Profile = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    photoURL: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const { data } = await api.get("/users");
        const users = data?.users || [];
        const currentUser = users.find(
          (u) =>
            u.user_id === user.user_id ||
            u.user_id === user.uid ||
            u.id === user.id ||
            u.id === user.uid
        );

        if (currentUser) {
          setUserData({
            id: currentUser.id,
            name: currentUser.username || currentUser.name || "",
            email: currentUser.email || "",
            phone: currentUser.phone || "",
            photoURL: currentUser.photoURL || "",
            role: currentUser.role || user.role || "",
          });
        } else {
          setUserData({
            id: user.id || "",
            name: user.username || user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            photoURL: user.photoURL || "",
            role: user.role || "",
          });
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load admin profile");
      }
    };

    fetchData();
  }, [user]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData((prev) => ({
          ...prev,
          photoURL: reader.result,
        }));
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Image compression failed:", err);
      toast.error("Image upload failed");
    }
  };

  const handleUpdate = async () => {
    if (!userData.id) {
      toast.error("Unable to update profile");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/users/${userData.id}`, {
        username: userData.name,
        phone: userData.phone,
      });
      toast.success("Profile updated successfully");
      if (updateUserProfile) {
        updateUserProfile({ username: userData.name, phone: userData.phone });
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl bg-white border border-slate-200/70 p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-sky-600">My Profile</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900">Admin Profile</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-500">
                Update your profile details and image. Your email and role are displayed as read-only.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-5 py-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Tip:</span> Keep your profile image square to preserve the rounded preview style.
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-sky-600 via-slate-900 to-slate-700 p-6 text-center text-white shadow-lg">
              <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-inner">
                <label htmlFor="imageUpload" className="cursor-pointer block h-full">
                  <img
                    src={userData.photoURL || "/placeholder.jpg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </label>
              </div>
              <p className="text-lg font-semibold">Profile Image</p>
              <p className="text-sm text-slate-200 mt-1">Click the avatar to upload a new picture.</p>
              <div className="mt-6 rounded-2xl bg-white/15 px-4 py-3 text-xs text-slate-100">
                {userData.name || "Admin User"}
              </div>
            </div>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Name</label>
                <input
                  type="text"
                  className="mt-3 block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={userData.name}
                  onChange={(e) =>
                    setUserData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  disabled
                  className="mt-3 block w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 shadow-sm"
                  value={userData.email}
                />
                <p className="mt-2 text-xs text-slate-400">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Role</label>
                <input
                  type="text"
                  disabled
                  className="mt-3 block w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 shadow-sm"
                  value={userData.role}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Phone</label>
                <input
                  type="tel"
                  className="mt-3 block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={userData.phone}
                  onChange={(e) =>
                    setUserData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
            </div>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className={`mt-8 inline-flex w-full items-center justify-center rounded-3xl px-6 py-4 text-sm font-semibold text-white shadow-lg transition ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-700"
              }`}
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
