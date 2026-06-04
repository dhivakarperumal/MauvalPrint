import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiLayout,
  FiPackage,
  FiFolder,
  FiTag,
  FiShoppingCart,
  FiShoppingBag,
  FiList,
  FiClock,
  FiTruck,
  FiXCircle,
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiFileText,
  FiStar,
  FiBriefcase,
  FiHome,
} from "react-icons/fi";
import logo from "/Image/logo.png";

const tabLabels = {
  "/admin": { label: "Dashboard", icon: <FiLayout /> },
  "/admin/products": {
    label: "Products",
    icon: <FiPackage />,
    isDropdown: true,
    children: {
      "/admin/products": { label: "All Products", icon: <FiPackage /> },
      "/admin/category": { label: "Category", icon: <FiFolder /> },
      "/admin/productkeywords": { label: "Product Keywords", icon: <FiTag /> },
    },
  },
  "/admin/orders": {
    label: "Orders",
    icon: <FiShoppingCart />,
    isDropdown: true,
    children: {
      "/admin/neworders": { label: "New Orders", icon: <FiShoppingBag /> },
      "/admin/allorders": { label: "All Orders", icon: <FiList /> },
      "/admin/processingorders": { label: "Processing Orders", icon: <FiClock /> },
      "/admin/deliveryorders": { label: "Delivery Orders", icon: <FiTruck /> },
      "/admin/cancelorders": { label: "Cancelled Orders", icon: <FiXCircle /> },
    },
  },
  "/admin/users": {
    label: "Users",
    icon: <FiUsers />,
    isDropdown: true,
    children: {
      "/admin/newusers": { label: "New Users", icon: <FiUserPlus /> },
      "/admin/users": { label: "All Users", icon: <FiUsers /> },
    },
  },
  "/admin/stockdetails": { label: "Stock Details", icon: <FiSearch /> },
  "/admin/billing": { label: "Billing", icon: <FiFileText /> },
  "/admin/getorders": { label: "Get Order Details", icon: <FiSearch /> },
  "/admin/reviews": { label: "Reviews", icon: <FiStar /> },
  "/admin/dealers": {
    label: "Dealers",
    icon: <FiBriefcase />,
    isDropdown: true,
    children: {
      "/admin/dealers": { label: "All Dealers", icon: <FiBriefcase /> },
      "/admin/invoice": { label: "Invoice", icon: <FiFileText /> },
    },
  },
};

const SidebarItem = ({ icon, label, to, active, onClick, count, isChild, isParentActive }) => (
  <Link
    to={to || "#"}
    onClick={onClick}
    className={`group flex items-center justify-between px-4 py-3 w-full transition-all duration-300 ease-in-out cursor-pointer overflow-hidden relative ${
      isChild ? "text-sm rounded-lg my-0.5 ml-2 w-[calc(100%-8px)]" : "text-base rounded-xl my-1"
    } ${
      active
        ? "bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white shadow-lg shadow-cyan-900/30 font-semibold"
        : isParentActive
        ? "bg-white/5 text-cyan-50 font-medium"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`}
  >
    {active && !isChild && (
      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400 rounded-r-md shadow-[0_0_12px_rgba(34,211,238,0.8)]"></span>
    )}
    <div className="flex items-center gap-3 relative z-10">
      <span
        className={`text-xl transition-all duration-300 ${
          active
            ? "scale-110 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]"
            : isParentActive
            ? "text-cyan-400 scale-105"
            : "group-hover:scale-110 group-hover:text-cyan-400"
        }`}
      >
        {icon}
      </span>
      <span className="tracking-wide">{label}</span>
    </div>
    {count > 0 && (
      <span className="relative z-10 bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
        {count}
      </span>
    )}
  </Link>
);

const AdminSidebar = ({ mobileMenu, setMobileMenu, sidebarRef, counts }) => {
  const [openDropdown, setOpenDropdown] = useState({});
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside
      className={`fixed md:relative z-50 bg-[#0f1c35] w-[300px] h-screen text-white transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.15)] border-r border-white/5 ${
        mobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      ref={sidebarRef}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
            <span className="text-xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-sm">
              Mauval Print
            </span>
          </div>
          <button
            className="md:hidden text-2xl text-gray-400 hover:text-white cursor-pointer transition-colors"
            onClick={() => setMobileMenu(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6 space-y-1">
          {Object.entries(tabLabels).map(([key, value]) => {
            const isParentActive =
              value.isDropdown && Object.keys(value.children).some((path) => currentPath === path);

            if (value.isDropdown) {
              return (
                <div key={key}>
                  <SidebarItem
                    icon={value.icon}
                    label={value.label}
                    active={false}
                    isParentActive={isParentActive}
                    onClick={() =>
                      setOpenDropdown((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  />
                  {openDropdown[key] && (
                    <div className="ml-5 space-y-1 mt-1 pl-2">
                      {Object.entries(value.children).map(([childKey, child]) => (
                        <SidebarItem
                          key={childKey}
                          to={childKey}
                          icon={child.icon}
                          label={child.label}
                          active={currentPath === childKey}
                          count={counts[childKey] || 0}
                          onClick={() => setMobileMenu(false)}
                          isChild={true}
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
                to={key}
                icon={value.icon}
                label={value.label}
                active={currentPath === key}
                count={counts[key] || 0}
                onClick={() => setMobileMenu(false)}
              />
            );
          })}
          <div className="pt-6 pb-2">
            <Link
              to="/"
              className="group flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl shadow-sm hover:bg-white/10 hover:shadow-md transition-all duration-300 w-full"
            >
              <FiHome className="group-hover:scale-110 transition-transform duration-300 text-blue-400" />
              Back Home
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
