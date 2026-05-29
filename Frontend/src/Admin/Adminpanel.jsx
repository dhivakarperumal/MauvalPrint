import React, { useEffect, useState, useRef, useContext } from "react";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaBookOpen,
  FaClipboardList,
  FaUserFriends,
  FaMoneyBillWave,
  FaFileAlt,
  FaPalette,
  FaPlusCircle,
  FaShoppingCart,
  FaRegUserCircle,
  FaReceipt,
  FaBars,
  FaSearch,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaHome,
  FaTags
} from "react-icons/fa";
import { TiUserAdd } from "react-icons/ti";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import api from "../api";
import { AuthContext } from "../Context/AuthContext";

// Components
import Dashboard from "./Dashboard";
import ProductList from "./Products/Products";
import AddProducts from "./Products/AddProducts";
import OurDesings from "./Products/OurDesings";
import ProductKeywords from "./Products/ProductKeywords";

import NewOrders from "./Orders/NewOrders";
import AllOrders from "./Orders/AllOrders";
import ProccesingOrders from "./Orders/ProccesingOrders";
import DeliveryOrders from "./Orders/DeliveryOrders";
import CancelOrders from "./Orders/CancleOrders";

import AddUser from "./Users/AddUser";
import NewUsers from "./Users/NewUsers";
import OldUsers from "./Users/OldUsers";

import AddStock from "./Stock/AddStock";
import StockDetails from "./Stock/StockDetails";

import Billing from "./Billing";
import Reviews from "./Reviews";
import Category from "./Categorey";
import Invoice from "./Invoice";
import Dealers from "./Delears";
import Profile from "./Profile/Profile";
import GetOrdersDetails from "./GetOrdersDetails";

import logo from "/Image/logo.png";

const tabLabels = {
  dashboard: { label: "Dashboard", icon: <FaTachometerAlt /> },
  allProducts: {
    label: "Products",
    icon: <FaBookOpen />,
    isDropdown: true,
    children: {
      allProducts: { label: "All Products", icon: <FaBookOpen /> },
      category: { label: "Category", icon: <FaFileAlt /> },
      ourDesigns: { label: "Our Designs", icon: <FaPalette /> },
      productKeywords: { label: "Product Keywords", icon: <FaTags /> },
    },
  },
  orders: {
    label: "Orders",
    icon: <FaClipboardList />,
    isDropdown: true,
    children: {
      newOrders: { label: "New Orders", icon: <FaShoppingCart /> },
      allOrders: { label: "All Orders", icon: <FaClipboardList /> },
      processingOrders: { label: "Processing Orders", icon: <FaClipboardList /> },
      deliveryOrders: { label: "Delivery Orders", icon: <FaClipboardList /> },
      cancelOrders: { label: "Cancelled Orders", icon: <FaFileAlt /> },
    },
  },
  customers: {
    label: "Users",
    icon: <FaUserFriends />,
    isDropdown: true,
    children: {
      newUsers: { label: "New Users", icon: <FaUserFriends /> },
      users: { label: "All Users", icon: <FaRegUserCircle /> },
    },
  },
  stock: {
    label: "Stock",
    icon: <FaBoxOpen />,
    isDropdown: true,
    children: {
      addStock: { label: "Add Stock", icon: <FaPlusCircle /> },
      stockDetails: { label: "Stock Details", icon: <FaBoxOpen /> },
    },
  },
  billing: { label: "Billing", icon: <FaMoneyBillWave /> },
  getOrders: { label: "Get Order Details", icon: <FaReceipt /> },
  reviews: { label: "Reviews", icon: <FaFileAlt /> },
  dealers: {
    label: "Dealers",
    icon: <FaUserFriends />,
    isDropdown: true,
    children: {
      dealers: { label: "All Dealers", icon: <FaUserFriends /> },
      invoice: { label: "Invoice", icon: <FaFileAlt /> },
    },
  },
};

const SidebarItem = ({ icon, label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between gap-3 px-4 py-2 rounded w-full transition font-medium cursor-pointer ${active ? "bg-white text-blue-900" : "hover:bg-gray-600 text-white"
      }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {count > 0 && (
      <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </button>
);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState({});
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef();
  const notificationprofileRef = useRef();

  const [selectedProduct, setSelectedProduct] = useState(null);


  const [products, setProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({
    allProducts: 0,
    newOrders: 0,
    newUsers: 0,
    stockDetails: 0,
  });

  const [adminName, setAdminName] = useState("");
  const [adminImage, setAdminImage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const { user, logout } = useContext(AuthContext);

  const sidebarRef = useRef(null);
  const lowStockRef = useRef(null);
  const [showLowStock, setShowLowStock] = useState(false);
  // const [openNotifications, setOpenNotifications] = useState(false);
  const [open, setOpen] = useState(false)

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

        // Update counts
        setCounts((prev) => ({
          ...prev,
          allProducts: productList.length,
          stockDetails: lowStockList.length,
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
        const snapshot = await getDocs(collection(db, "orders"));
        const todayStr = new Date().toISOString().split("T")[0];

        const todayOrders = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt);
            return { ...data, id: doc.id, createdAt };
          })
          .filter(
            (order) =>
              order.createdAt.toISOString().split("T")[0] === todayStr &&
              ["Place Order", "Placed"].includes(order.status)
          );

        setNotifications(todayOrders);

        setCounts((prev) => ({ ...prev, newOrders: todayOrders.length }));
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
        const snapshot = await getDocs(collection(db, "users"));
        const todayStr = new Date().toISOString().split("T")[0];

        const newUsers = snapshot.docs.filter((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
          return createdAt.toISOString().split("T")[0] === todayStr;
        });

        setCounts((prev) => ({ ...prev, newUsers: newUsers.length }));
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
      setAdminImage("https://randomuser.me/api/portraits/men/75.jpg");
    }
  }, [user]);

  // Search Suggestions
  useEffect(() => {
    if (!searchQuery.trim()) return setSuggestions([]);
    const q = searchQuery.toLowerCase();
    const results = [];
    Object.entries(tabLabels).forEach(([key, value]) => {
      if (value.label.toLowerCase().includes(q)) results.push({ key, label: value.label });
      if (value.isDropdown) {
        Object.entries(value.children).forEach(([childKey, child]) => {
          if (child.label.toLowerCase().includes(q))
            results.push({ key: childKey, label: child.label });
        });
      }
    });
    setSuggestions(results);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest("[data-ignore-outside]")) return; // 👈 add this line at the top

if (
  profileRef.current &&
  !profileRef.current.contains(e.target) &&
  (!sidebarRef.current || !sidebarRef.current.contains(e.target)) &&
  (!notificationprofileRef.current || !notificationprofileRef.current.contains(e.target)) &&
  (!lowStockRef.current || !lowStockRef.current.contains(e.target))
) {
  setProfileDropdownOpen(false);
  setShowLowStock(false);
  setOpen(false); // close notifications if open
  // ❌ remove setOpenDropdown({}) so sidebar tabs don’t close
}

    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;

      case "allProducts":
        return (
          <ProductList
            setSelectedProduct={setSelectedProduct}
            setActiveTab={setActiveTab}
          />
        );

      case "addProduct":
        return (
          <AddProducts
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            setActiveTab={setActiveTab}
          />
        );
      // case "allProducts": return <ProductList setActiveTab={setActiveTab} />;
      // case "addProduct": return <AddProducts setActiveTab={setActiveTab} />;
      case "ourDesigns": return <OurDesings />;
      case "productKeywords": return <ProductKeywords />;
      case "newOrders": return <NewOrders />;
      case "allOrders": return <AllOrders />;
      case "processingOrders": return <ProccesingOrders />;
      case "deliveryOrders": return <DeliveryOrders />;
      case "cancelOrders": return <CancelOrders />;
      // case "billing": return <Billing />;
      case "billing": 
        return (
        <Billing 
          setActiveTab={setActiveTab} />
        );
      case "reviews": return <Reviews />;
      case "addUser": return <AddUser />;
      case "newUsers": return <NewUsers />;
      case "users": return <OldUsers />;
      case "addStock": return <AddStock />;
      case "stockDetails": return <StockDetails />;
      case "category": return <Category />;
      case "invoice": return <Invoice />;
      case "dealers": return <Dealers />;
      case "profile": return <Profile />;
      case "getOrders": return <GetOrdersDetails />;
      default: return <h2 className="text-red-500">Page not found</h2>;
    }
  };

  const getTabLabel = (key) => {
  // direct/top-level
  if (tabLabels[key]?.label) return tabLabels[key].label;

  // search in children
  for (const group of Object.values(tabLabels)) {
    if (group.isDropdown && group.children && group.children[key]?.label) {
      return group.children[key].label;
    }
  }

  // fallback labels for routes that aren't in tabLabels
  const fallback = {
    addProduct: "Add Product",
    profile: "My Profile",
  };
  return fallback[key] || "Admin";
};


  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 bg-[#192f59] w-64 h-screen text-white transition-transform duration-300 ease-in-out ${mobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        ref={sidebarRef}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
            <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
            <button className="md:hidden text-xl cursor-pointer" onClick={() => setMobileMenu(false)}>✕</button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2.5">
            {Object.entries(tabLabels).map(([key, value]) => {
              if (value.isDropdown) {
                return (
                  <div key={key}>
                    <SidebarItem
                      icon={value.icon}
                      label={value.label}
                      active={Object.keys(value.children).includes(activeTab)}
                      onClick={() =>
                        setOpenDropdown((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                    />
                    {openDropdown[key] && (
                      <div className="ml-6 space-y-1 mt-1">
                        {Object.entries(value.children).map(([childKey, child]) => (
                          <SidebarItem
                            key={childKey}
                            icon={child.icon}
                            label={child.label}
                            active={activeTab === childKey}
                            count={counts[childKey] || 0}
                            onClick={() => {
                              setActiveTab(childKey);
                              setMobileMenu(false);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <SidebarItem
                  key={key}
                  icon={value.icon}
                  label={value.label}
                  active={activeTab === key}
                  count={counts[key] || 0}
                  onClick={() => {
                    setActiveTab(key);
                    setMobileMenu(false);
                  }}
                />
              );
            })}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg shadow hover:bg-primary-dark transition-colors"
            >
              <FaHome />
              Back Home
            </Link>
          </nav>


        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-0 min-h-screen">
        <header className="bg-[#192f59] text-white flex items-center justify-between px-4 h-auto md:h-20 shadow sticky top-0 z-40 py-3">
          <div className="flex items-center   gap-4 w-full md:w-auto">
            <button
              className="md:hidden text-2xl"
              onClick={() => setMobileMenu(true)}
            >
              <FaBars />
            </button>
            {/* <h1 className="font-bold text-lg whitespace-nowrap">
              {tabLabels[activeTab]?.label || "Admin"}
            </h1> */}
            <h1 className="font-bold text-lg whitespace-nowrap">
  {getTabLabel(activeTab)}
</h1>

            <div className="relative hidden md:block">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu..."
                className="pl-10 pr-4 py-2 w-64 rounded-md text-sm text-black bg-white focus:outline-none shadow"
              />
              {suggestions.length > 0 && (
                <ul className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                  {suggestions.map((s) => (
                    <li
                      key={s.key}
                      onClick={() => {
                        setActiveTab(s.key);
                        setSearchQuery("");
                        setSuggestions([]);
                        setMobileMenu(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right section */}
          <div
            className="flex items-center gap-4 md:gap-6 ml-auto relative"
            ref={profileRef}
          >
            <div className="relative">
              {/* Low Stock Alert Button */}
              <button
                onClick={() => setShowLowStock((prev) => !prev)}
                className="relative bg-white cursor-pointer text-[#192f59] font-bold w-10 h-10 font-serif rounded-full shadow hover:bg-gray-100 text-lg"
                title="Stock Details"
              >
                S
                {lowStockItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full shadow z-10">
                    {lowStockItems.length}
                  </span>
                )}
              </button>

              {/* Low Stock Alert Popup */}
              {showLowStock && (
                <div className="absolute top-13 right-[-120px] w-[300px] sm:w-[400px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 space-y-3">
                  <h1 className="text-lg font-bold text-red-700">
                    Low Stock Alert
                  </h1>

                  {/* Table for Desktop */}
                  <div className="hidden sm:block overflow-auto max-h-72 rounded border">
                    <table className="min-w-full text-sm text-left">
                      <thead className="bg-black">
                        <tr>
                          <th className="px-4 py-2">Product ID</th>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.length > 0 ? (
                          lowStockItems.map((product) => (
                            <tr
                              key={product.productId}
                              className="border-t bg-gray-50 hover:bg-gray-100"
                            >
                              <td className="px-4 py-2 text-black ">
                                {product.productId}
                              </td>
                              <td className="px-4 py-2 text-black ">
                                {product.name}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-red-600">
                                {product.totalStock}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="text-center py-4 text-gray-500"
                            >
                              No low stock products found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Compact Table for Mobile */}
                  <div className="sm:hidden overflow-auto max-h-72 rounded border">
                    <table className="min-w-full text-sm text-left">
                      <thead className="bg-black">
                        <tr>
                          <th className="px-3 py-2">ID</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.length > 0 ? (
                          lowStockItems.map((product) => (
                            <tr
                              key={product.productId}
                              className="border-t  hover:bg-gray-100"
                            >
                              <td className="px-3 py-2 text-black">
                                {product.productId}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-red-600">
                                {product.totalStock}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="2"
                              className="text-center py-4 text-gray-500"
                            >
                              No low stock products.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Icon */}
            <div className="relative" ref={notificationprofileRef}  >

              <button
                onClick={() => setOpen(!open)}
                className="relative  cursor-pointer w-10 h-10 border-2 rounded-full flex items-center justify-center"
              >
                <FaBell className="text-xl" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute right-[-50px] top-12 w-[90vw] max-w-xs sm:max-w-sm bg-white shadow-xl rounded-lg z-50 overflow-hidden border border-gray-200">
                  <ul className="divide-y max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="p-4 text-gray-500 text-sm text-center">
                        No new orders today
                      </li>
                    ) : (
                      notifications.map((order) => (
                        <li
                          key={order.orderID}
                          onClick={() => {
                            setActiveTab("allOrders");
                            setOpen(false);
                          }}
                          className="flex gap-3 p-4 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-gray-600 font-bold">
                            📦
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {order.checkout?.fullname}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              Placed an order - #{order.orderID}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {order.time}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Profile Button */}
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex  cursor-pointer items-center gap-2"
            >
              {/* <img
                src={adminImage}
                alt="profile"
                className="w-10 h-10 rounded-full border-2 p-1.5 object-cover max-w-[120px]"
              /> */}
              <p className="border-2 px-3 py-1 rounded-full text-xl font-bold ">
                {adminName?.charAt(0).toUpperCase() || "A"}
              </p>
              
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-2 top-14 w-64 bg-white text-black shadow-md rounded-lg z-50 overflow-hidden">
                <div className="flex flex-col px-4 py-3 border-b border-gray-300 gap-1">
                  <p className="font-semibold">{user?.username || user?.email || adminName} {user?.role && (
                    <span className="text-xs text-gray-500 mt-1">Role: {user.role}</span>
                  )}</p>
                  {user?.email && (
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  )}
                  
                </div>

                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-900 text-gray-800 hover:text-white flex items-center gap-2"
                >
                  <FaUserCircle className="text-gray-600 group-hover:text-white" />
                  My Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 hover:text-red-800 flex items-center gap-2"
                >
                  <FaSignOutAlt className="text-red-600 hover:text-red-800" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50  ">
          {renderContent()}

          <div className="p-0">
            <footer className="bg-[#192f59] text-white text-sm py-4 px-6 text-center shadow-inner">
              © {new Date().getFullYear()} T-Shirt Admin Panel. All rights
              reserved. | Built by Q-Techx Solutions
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
