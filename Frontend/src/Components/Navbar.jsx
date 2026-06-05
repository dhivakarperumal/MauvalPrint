// Navbar.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUserCircle,
  FaHeart,
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { MdOutlineManageAccounts, MdAdminPanelSettings } from "react-icons/md";
import { IoIosLogOut, IoIosArrowDown } from "react-icons/io";
import logo from "/Image/logo.png";
import { AuthContext } from "../Context/AuthContext";
import Login from "./Login";
import RegisterPage from "./Register";
import Search from "./Search";
import CartSidebar from "../Products/CartSidebar";
import Wishlist from "../Products/Wishlist";
import Orders from "../Products/Orders";
import api from "../api";
import { toast } from "react-toastify";
import PageContainer from "./PageContainer";

export default function Navbar() {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isMobilePagesOpen, setIsMobilePagesOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);
  const [customizeDropdownOpen, setCustomizeDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [customizeData, setCustomizeData] = useState([]);
  const [isMobileCustomizeOpen, setIsMobileCustomizeOpen] = useState(false);

  const {
    products,
    user,
    logout,
    cart = [],
    wishlist = [],
  } = useContext(AuthContext);
  const navigate = useNavigate();

  const customizeRef = useRef(null);
  const pagesRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/products");
        const products = data?.products || [];

        const filtered = ["round neck", "collared"];
        const grouped = [];

        filtered.forEach((cat) => {
          const categoryProducts = products.filter(
            (p) => p.category?.toLowerCase() === cat
          );
          if (categoryProducts.length) {
            const subSet = new Set();
            categoryProducts.forEach((p) =>
              subSet.add(p.subcategory?.toLowerCase())
            );

            grouped.push({
              name: cat,
              cname:
                cat === "round neck"
                  ? "Round Neck"
                  : "Collared",
              subcategories: [...subSet],
              products: categoryProducts,
            });
          }
        });

        setCustomizeData(grouped);
      } catch (error) {
        console.error("Error fetching product categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setOrdersCount(0);
      return;
    }

    const fetchOrderCount = async () => {
      try {
        const { data } = await api.get(`/orders/user/${user.uid}`);
        if (data.success && Array.isArray(data.orders)) {
          setOrdersCount(data.orders.length);
        } else {
          setOrdersCount(0);
        }
      } catch (error) {
        console.error("Error fetching order count:", error);
        setOrdersCount(0);
      }
    };

    fetchOrderCount();
  }, [user?.uid]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customizeRef.current && !customizeRef.current.contains(e.target)) {
        setCustomizeDropdownOpen(false);
        setHoveredCategory(null);
      }
      if (pagesRef.current && !pagesRef.current.contains(e.target)) {
        setIsPagesOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setAccountDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const requireLogin = (setter) => {
    if (!user) {
      toast.warn("Login Please");
    } else {
      setter(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setAccountDropdownOpen(false);
  };

  const iconBase =
    "h-5 w-5 transition-transform duration-200 hover:-translate-y-0.5";
  const linkBase = "nav-link text-white text-sm md:text-base font-medium";

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#283b53] text-white shadow-md py-2">
      <PageContainer>
        <nav className="flex items-center justify-between py-1">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-18 h-18 sm:w-14 sm:h-14 md:w-16 md:h-16">
              <img
                src={logo}
                alt="Mauval Print Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wide">
              Mauval Print
            </span>
          </Link>





          {/* Desktop Menu */}
          <ul className="hidden lg:flex items-center gap-6">
            <li className={linkBase}>
              <Link to="/">Home</Link>
            </li>
            <li className={linkBase}>
              <Link to="/products">Products</Link>
            </li>
            <li className="relative" ref={customizeRef}>
              <button
                className="group flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setCustomizeDropdownOpen(!customizeDropdownOpen);
                  setIsPagesOpen(false);
                  setAccountDropdownOpen(false);
                }}
              >
                Customize <FaChevronDown className="text-sm" />
              </button>
              {customizeDropdownOpen && (
                <div className="absolute top-6 left-0 mt-2 flex z-50">
                  <ul className="bg-white text-black w-48 shadow-md">
                    {customizeData.map((category) => (
                      <li
                        key={category.name}
                        className="hover:bg-gray-100 px-4 py-2 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(category)}
                      >
                        {category.cname}
                      </li>
                    ))}
                  </ul>
                  {hoveredCategory && (
                    <ul className="absolute top-10 left-full bg-white text-black ml-1 w-48 shadow-md">
                      {hoveredCategory.subcategories.map((sub) => (
                        <li
                          key={sub}
                          className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                          onClick={() => {
                            navigate(
                              `/products?subcategory=${encodeURIComponent(sub).charAt(0).toUpperCase() +
                              encodeURIComponent(sub).slice(1)
                              }`
                            );
                            setCustomizeDropdownOpen(false);
                            setHoveredCategory(null);
                          }}
                        >
                          {sub.charAt(0).toUpperCase() + sub.slice(1)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
            <li className={linkBase}>
              <Link to="/designs">Designs</Link>
            </li>

          </ul>

          {/* Icons */}
          <div className="flex items-center gap-4 lg:gap-6">
            <button className="cursor-pointer sm-hidden" onClick={() => setShowSearch(true)}>
              <FaSearch className={iconBase} />
            </button>
            <button
              onClick={() => requireLogin(setShowWishlist)}
              className="relative cursor-pointer"
            >
              <FaHeart className={iconBase} />
              {user && wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px]">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => requireLogin(setShowCart)}
              className="relative cursor-pointer"
            >
              <FaShoppingCart className={iconBase} />
              {user && cart.length > 0 && (
                <span className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-xs">
                  {cart.length}
                </span>
              )}
            </button>
            <div className="relative cursor-pointer hidden mt-2 lg:block">
              <Orders show={showOrders} onClose={() => setShowOrders(false)} />
              {user && ordersCount > 0 && (
                <span className="absolute -top-1 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-xs">
                  {ordersCount}
                </span>
              )}
            </div>

            {/* User */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  if (!user) {
                    setShowLogin(true);
                  } else {
                    setAccountDropdownOpen(!accountDropdownOpen);
                    setCustomizeDropdownOpen(false);
                    setIsPagesOpen(false);
                  }
                }}
                className="h-6 w-6 rounded-full bg-white text-[#283b53] flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                {user?.username?.charAt(0).toUpperCase() || (
                  <FaUserCircle className="text-2xl" />
                )}
              </button>
              {user && accountDropdownOpen && (
                <ul className="absolute top-8 right-0 mt-2 w-48 bg-white text-gray-800 text-sm py-2 shadow-lg z-50 rounded space-y-1">
                  <li>
                    <Link
                      to="/account"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                    >
                      <MdOutlineManageAccounts /> Account
                    </Link>
                  </li>
                  {user.role === "admin" && (
                    <li>
                      <Link
                        to="/admin"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      >
                        <MdAdminPanelSettings /> Admin Panel
                      </Link>
                    </li>
                  )}
                  <li className="lg:hidden ml-4 flex items-center cursor-pointer text-black hover:bg-gray-100 py-2">
                    <Orders
                      titleorder={"My Orders"}
                      show={showOrders}
                      onClose={() => setShowOrders(false)}
                    />
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <IoIosLogOut /> Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md"
          >
            {isOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
        </nav>
      </PageContainer>

      {/* Search, Login, Register, Cart, Wishlist */}
      {showSearch && (
        <div className="absolute left-1/2 top-full z-40 w-full -translate-x-1/2 bg-primary px-4 py-3 shadow-md lg:max-w-xl">
          <div className="relative w-full">
            <Search
              placeholder="Search for products..."
              onSelect={(product) => {
                setShowSearch(false);
                navigate(`/productdetails/${product.product_id}`);
              }}
            />
            <button
              onClick={() => setShowSearch(false)}
              className="absolute top-0 right-2 text-primary text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="lg:hidden bg-[#283b53] text-white w-full min-h-screen px-4 py-3 space-y-4">
          <ul className="space-y-6">
            <li>
              <Link to="/" onClick={() => setIsOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/products" onClick={() => setIsOpen(false)}>
                Products
              </Link>
            </li>
            <li>
              <button
                onClick={() => setIsMobileCustomizeOpen(!isMobileCustomizeOpen)}
                className="flex items-center gap-2"
              >
                Customize <IoIosArrowDown className="text-xs" />
              </button>

              {isMobileCustomizeOpen && (
                <ul className="ml-4 space-y-1 mt-1">
                  {customizeData.map((category) => (
                    <li key={category.name}>
                      <p className="font-semibold">{category.cname}</p>
                      <ul className="ml-10">
                        {category.subcategories.map((sub) => (
                          <li key={sub}>
                            <button
                              onClick={() => {
                                // Capitalize first letter and encode
                                const formattedSub = sub.charAt(0).toUpperCase() + sub.slice(1);
                                navigate(`/products?subcategory=${encodeURIComponent(formattedSub)}`);

                                // Close dropdowns
                                setIsOpen(false);
                                setIsMobileCustomizeOpen(false);
                              }}
                              className="text-left w-full hover:text-primary transition"
                            >
                              {sub}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li>
              <Link to="/designs" onClick={() => setIsOpen(false)}>
                Designs
              </Link>
            </li>
            {/* <li>
              <button
                onClick={() => setIsMobilePagesOpen(!isMobilePagesOpen)}
                className="flex items-center gap-2"
              >
                Pages <IoIosArrowDown className="text-xs" />
              </button>
              {isMobilePagesOpen && (
                <ul className="ml-4 space-y-1 mt-1">
                  <li>
                    <Link to="/about" onClick={() => setIsOpen(false)}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" onClick={() => setIsOpen(false)}>
                      Contact Us
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link to="/services" onClick={() => setIsOpen(false)}>
                Services
              </Link>
            </li> */}
            <li className="flex gap-4">
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaFacebookF />
              </a>
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaInstagram />
              </a>
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaLinkedinIn />
              </a>
            </li>
            <li className="flex items-start gap-2">
              <FaMapMarkerAlt className="mt-1" />
              <span>
                No.347,Saibaba colony,
                <br />
                Asiriyar Nagar, Tirupattur - 635601
              </span>
            </li>
          </ul>
        </div>
      )}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitch={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      {showRegister && (
        <RegisterPage
          onClose={() => setShowRegister(false)}
          onSwitch={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      <CartSidebar show={showCart} onClose={() => setShowCart(false)} />
      <Wishlist show={showWishlist} onClose={() => setShowWishlist(false)} />
    </header>
  );
}
