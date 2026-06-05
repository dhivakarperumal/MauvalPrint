import React, { useEffect, useState, useRef, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import { AuthContext } from "../Context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

const AdminPanel = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef();
  const notificationprofileRef = useRef();
  const sidebarRef = useRef(null);
  const lowStockRef = useRef(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [open, setOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({
    "/admin/products": 0,
    "/admin/neworders": 0,
    "/admin/newusers": 0,
    "/admin/stockdetails": 0,
  });

  const [adminName, setAdminName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Logout
  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Redirect non-admin users away from admin panel
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Unauthorized access");
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch Products & Low Stock
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const { data } = await api.get('/products');
        if (!data || !data.products) return;

        const productList = [];
        const lowStockList = [];

        data.products.forEach((product) => {
          let stockByVariant = {};
          try {
            stockByVariant = product.stock_by_variant
              ? (typeof product.stock_by_variant === 'string' ? JSON.parse(product.stock_by_variant) : product.stock_by_variant)
              : {};
          } catch (e) {}

          let totalStock = 0;
          Object.values(stockByVariant).forEach((qty) => {
            totalStock += parseInt(qty, 10) || 0;
          });

          productList.push({ ...product, totalStock });

          if (totalStock < 5) lowStockList.push({ ...product, totalStock });
        });

        setProducts(productList);
        setLowStockItems(lowStockList);

        setCounts((prev) => ({
          ...prev,
          "/admin/products": productList.length,
          "/admin/stockdetails": lowStockList.length,
        }));
      } catch (error) {
        toast.error("Failed to fetch products");
        console.error(error);
      }
    };

    fetchStock();
  }, []);

  // Fetch Orders (New Orders)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/orders");
        const orders = data?.orders || [];
        const todayStr = new Date().toISOString().split("T")[0];

        const todayOrders = orders
          .map((o) => {
            const createdAt = o.created_at ? new Date(o.created_at) : new Date(o.createdAt || Date.now());
            return { ...o, id: o.order_id || o.id, createdAt };
          })
          .filter(
            (order) =>
              order.createdAt.toISOString().split("T")[0] === todayStr &&
              ["Place Order", "Placed"].includes(order.status)
          );

        setNotifications(todayOrders);
        setCounts((prev) => ({ ...prev, "/admin/neworders": todayOrders.length }));
      } catch (error) {
        console.error(error);
      }
    };

    fetchOrders();
  }, []);

  // Fetch New Users (today)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/");
        const users = data?.users || [];
        const todayStr = new Date().toISOString().split("T")[0];

        const newUsers = users.filter((u) => {
          const createdAt = u.created_at ? new Date(u.created_at) : new Date(u.createdAt || Date.now());
          return createdAt.toISOString().split("T")[0] === todayStr;
        });

        setCounts((prev) => ({ ...prev, "/admin/newusers": newUsers.length }));
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch Admin Info
  useEffect(() => {
    if (user) {
      setAdminName(user.username || user.email || "Admin");
    }
  }, [user]);

  // Search Suggestions (simplified for layout)
  useEffect(() => {
    if (!searchQuery.trim()) return setSuggestions([]);
    const q = searchQuery.toLowerCase();
    const mockSuggestions = [
      { key: "/admin/products", label: "All Products" },
      { key: "/admin/orders", label: "Orders" },
      { key: "/admin/addproducts", label: "Add Product" },
    ].filter(s => s.label.toLowerCase().includes(q));
    setSuggestions(mockSuggestions);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest("[data-ignore-outside]")) return;

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target) &&
        (!sidebarRef.current || !sidebarRef.current.contains(e.target)) &&
        (!notificationprofileRef.current || !notificationprofileRef.current.contains(e.target)) &&
        (!lowStockRef.current || !lowStockRef.current.contains(e.target))
      ) {
        setProfileDropdownOpen(false);
        setShowLowStock(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        sidebarRef={sidebarRef}
        counts={counts}
      />

      <div className="flex-1 flex flex-col md:ml-0 min-h-screen">
        <AdminTopbar
          mobileMenu={mobileMenu}
          setMobileMenu={setMobileMenu}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          lowStockItems={lowStockItems}
          notifications={notifications}
          adminName={adminName}
          user={user}
          handleLogout={handleLogout}
          profileRef={profileRef}
          notificationprofileRef={notificationprofileRef}
          lowStockRef={lowStockRef}
          showLowStock={showLowStock}
          setShowLowStock={setShowLowStock}
          open={open}
          setOpen={setOpen}
          profileDropdownOpen={profileDropdownOpen}
          setProfileDropdownOpen={setProfileDropdownOpen}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          {/* Render child routes */}
          <Outlet context={{
            selectedProduct,
            setSelectedProduct,
            products,
            setProducts
          }} />

          <div className="p-0">
            <footer className="bg-[#192f59] text-white text-sm py-4 px-6 text-center shadow-inner mt-auto">
              © {new Date().getFullYear()} T-Shirt Admin Panel. All rights reserved. | Built by Q-Techx Solutions
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
