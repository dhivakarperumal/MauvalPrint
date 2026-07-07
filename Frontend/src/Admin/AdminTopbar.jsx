import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiSearch, FiBell, FiUser, FiLogOut } from "react-icons/fi";

const getTabLabel = (path) => {
  const routes = {
    "/admin": "Dashboard",
    "/admin/products": "All Products",
    "/admin/category": "Category",
    "/admin/productkeywords": "Product Keywords",
    "/admin/addproducts": "Add Product",
    "/admin/videomanagement": "Video Management",
    "/admin/orders": "Orders",
    "/admin/neworders": "New Orders",
    "/admin/allorders": "All Orders",
    "/admin/processingorders": "Processing Orders",
    "/admin/deliveryorders": "Delivery Orders",
    "/admin/cancelorders": "Cancelled Orders",
    "/admin/users": "All Users",
    "/admin/newusers": "New Users",
    "/admin/stockdetails": "Stock Details",
    "/admin/billing": "Billing",
    "/admin/reviews": "Reviews",
    "/admin/dealers": "Dealers",
    "/admin/invoice": "Invoice",
    "/admin/profile": "My Profile",
    "/admin/getorders": "Get Order Details"
  };
  return routes[path] || "Admin";
};

const AdminTopbar = ({
  mobileMenu,
  setMobileMenu,
  searchQuery,
  setSearchQuery,
  suggestions,
  setSuggestions,
  lowStockItems,
  notifications,
  adminName,
  user,
  handleLogout,
  profileRef,
  notificationprofileRef,
  lowStockRef,
  showLowStock,
  setShowLowStock,
  open,
  setOpen,
  profileDropdownOpen,
  setProfileDropdownOpen
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="bg-[#192f59] text-white flex items-center justify-between px-4 h-auto md:h-20 shadow sticky top-0 z-40 py-3">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button
          className="md:hidden text-2xl"
          onClick={() => setMobileMenu(true)}
        >
          <FiMenu />
        </button>
        <h1 className="font-bold text-lg hidden md:block whitespace-nowrap tracking-wide">
          {getTabLabel(location.pathname)}
          <span className="text-sm text-gray-300 block mt-1">
            Hi Welcome to Admin Panel
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6 ml-auto relative" ref={profileRef}>
        <div className="relative hidden md:block mr-2">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="pl-10 pr-4 py-2 w-64 rounded-full text-sm text-black bg-white focus:outline-none shadow-sm border border-gray-200 transition-shadow focus:shadow-md"
          />
          {suggestions.length > 0 && (
            <ul className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-auto">
              {suggestions.map((s) => (
                <li
                  key={s.key}
                  onClick={() => {
                    navigate(s.key);
                    setSearchQuery("");
                    setSuggestions([]);
                    setMobileMenu(false);
                  }}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-800 transition-colors border-b border-gray-100 last:border-0"
                >
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative" ref={lowStockRef}>
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

          {showLowStock && (
            <div className="absolute top-13 right-[-120px] w-[300px] sm:w-[400px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 space-y-3">
              <h1 className="text-lg font-bold text-red-700">Low Stock Alert</h1>
              <div className="hidden sm:block overflow-auto max-h-72 rounded border">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-4 py-2">Product ID</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="text-black">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((product) => (
                        <tr key={product.productId} className="border-t bg-gray-50 hover:bg-gray-100">
                          <td className="px-4 py-2">{product.productId}</td>
                          <td className="px-4 py-2">{product.name}</td>
                          <td className="px-4 py-2 text-right font-semibold text-red-600">
                            {product.totalStock}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-gray-500">
                          No low stock products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden overflow-auto max-h-72 rounded border">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="text-black">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((product) => (
                        <tr key={product.productId} className="border-t hover:bg-gray-100">
                          <td className="px-3 py-2">{product.productId}</td>
                          <td className="px-3 py-2 text-right font-semibold text-red-600">
                            {product.totalStock}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="text-center py-4 text-gray-500">
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

        <div className="relative" ref={notificationprofileRef}>
          <button
            onClick={() => setOpen(!open)}
            className="relative cursor-pointer w-10 h-10 border-2 rounded-full flex items-center justify-center"
          >
            <FiBell className="text-xl" />
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
                        navigate("/admin/allorders");
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
                        <p className="text-xs text-gray-400 mt-1">{order.time}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex cursor-pointer items-center gap-2"
        >
          <p className="border-2 px-3 py-1 rounded-full text-xl font-bold">
            {adminName?.charAt(0).toUpperCase() || "A"}
          </p>
        </button>

        {profileDropdownOpen && (
          <div className="absolute right-2 top-14 w-64 bg-white text-black shadow-md rounded-lg z-50 overflow-hidden">
            <div className="flex flex-col px-4 py-3 border-b border-gray-300 gap-1">
              <p className="font-semibold">
                {user?.username || user?.email || adminName}{" "}
                {user?.role && (
                  <span className="text-xs text-gray-500 mt-1">
                    Role: {user.role}
                  </span>
                )}
              </p>
              {user?.email && (
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              )}
            </div>

            <button
              onClick={() => {
                navigate("/admin/profile");
                setProfileDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-900 text-gray-800 hover:text-white flex items-center gap-2"
            >
              <FiUser className="text-gray-600 group-hover:text-white" />
              My Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 hover:text-red-800 flex items-center gap-2"
            >
              <FiLogOut className="text-red-600 hover:text-red-800" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminTopbar;
