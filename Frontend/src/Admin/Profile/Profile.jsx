import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

const Profile = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    photoURL: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth?.currentUser?.uid;
      if (!uid) return;

      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          toast.error("Admin data not found");
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load admin profile");
      }
    };

    fetchData();
  }, []);

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
    const uid = auth?.currentUser?.uid;
    if (!uid) return;

    setLoading(true);

    try {
      await updateDoc(doc(db, "users", uid), {
        name: userData.name,
        phone: userData.phone,
        photoURL: userData.photoURL,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-7 bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Admin Profile</h2>
      <p className="text-sm text-gray-500 mb-6">Update your profile details and image.</p>

      <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="imageUpload" className="cursor-pointer">
              <img
                src={userData.photoURL || "/placeholder.jpg"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border shadow"
              />
            </label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <p className="text-sm text-gray-500">Click image to upload</p>
          </div>

          {/* Profile Form */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm"
                value={userData.name}
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                disabled
                className="mt-1 block w-full bg-gray-100 border px-3 py-2 rounded-md shadow-sm cursor-not-allowed"
                value={userData.email}
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm"
                value={userData.phone}
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className={`w-full py-2 rounded-md text-white transition ${
                loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-900 hover:bg-blue-700"
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
