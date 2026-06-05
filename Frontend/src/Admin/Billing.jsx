import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaSearch, FaList, FaThLarge, FaClipboardList, FaRupeeSign } from "react-icons/fa";
import api from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; 

const Billing = ({ setActiveTab }) => {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [derivedCategory, setDerivedCategory] = useState("");
  const [availableQty, setAvailableQty] = useState(0);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [shopCustomerType, setShopCustomerType] = useState("");

  const [orderSaved, setOrderSaved] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shopOrders, setShopOrders] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? "card" : "table");
  const [filterType, setFilterType] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setViewMode("card");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredOrders = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filtered = shopOrders.filter((order) => {
      const createdAt = new Date(order.created_at || 0);
      const lowerSearch = searchTerm.toLowerCase();

      const matchSearch =
        order.order_id?.toLowerCase().includes(lowerSearch) ||
        (order.checkout?.fullname || order.checkout?.customerName || order.customerName || "")?.toLowerCase().includes(lowerSearch);

      let matchDate = true;
      if (filterType === "Today") {
        matchDate = createdAt.toDateString() === today.toDateString();
      } else if (filterType === "This Week") {
        matchDate = createdAt >= startOfWeek;
      } else if (filterType === "This Month") {
        matchDate = createdAt >= startOfMonth;
      } else if (filterType === "FromTo" && fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        matchDate = createdAt >= from && createdAt <= to;
      }

      return matchSearch && matchDate;
    });

    return filtered;
  }, [shopOrders, searchTerm, filterType, fromDate, toDate]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
  }, [filteredOrders]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filteredOrders, currentPage, totalPages]);

  const invoiceRef = useRef();
  const navigate = useNavigate();

  const getCheckoutData = (order) => {
    if (!order) return {};
    if (typeof order.checkout === "string") {
      try {
        return JSON.parse(order.checkout || "{}");
      } catch {
        return {};
      }
    }
    return order.checkout || {};
  };

  const getOrderItems = (order) => {
    if (!order) return [];
    if (Array.isArray(order.cart) && order.cart.length > 0) return order.cart;
    if (Array.isArray(order.items) && order.items.length > 0) return order.items;
    const checkout = getCheckoutData(order);
    return Array.isArray(checkout.items) ? checkout.items : [];
  };

  const getOrderItemImage = (item) => {
    if (!item) return "/placeholder.jpg";
    if (item.image) return item.image;
    if (item.customizedImage) return item.customizedImage;
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (item.images_by_variant) {
      const variants = parseVariants(item.images_by_variant);
      const variantKey = item.color && item.size ? `${item.color}-${item.size}` : "";
      if (variantKey && Array.isArray(variants[variantKey]) && variants[variantKey].length > 0) {
        return variants[variantKey][0];
      }
      const flatImages = Object.values(variants).flat().filter(Boolean);
      if (flatImages.length > 0) return flatImages[0];
    }
    return "/placeholder.jpg";
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowOrderDetails(false);
  };

  const getVariantImage = (imagesByVariant, selectedColor, selectedSize) => {
    if (!imagesByVariant) return "";
    let parsed = imagesByVariant;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = {};
      }
    }
    if (typeof parsed !== "object" || !parsed) return "";

    if (selectedColor && selectedSize) {
      const variantKey = `${selectedColor}-${selectedSize}`;
      const variantImages = parsed[variantKey];
      if (Array.isArray(variantImages) && variantImages.length > 0) return variantImages[0];
    }

    const flatImages = Object.values(parsed).flat().filter(Boolean);
    return flatImages[0] || "";
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get("/products");
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to fetch products");
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchShopOrders = async () => {
      try {
        const response = await api.get("/orders");
        if (response.data.success) {
          const shopCustOrders = response.data.orders.filter((o) => {
            const checkout = typeof o.checkout === "string" ? JSON.parse(o.checkout) : (o.checkout || {});
            return checkout.shopCustomerType === "ShopCustomer" || checkout.shopCustomerType === "ShopCustome" || checkout.customerName;
          });
          shopCustOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          setShopOrders(shopCustOrders);
        }
      } catch (err) {
        console.error("Failed to fetch shop orders");
      }
    };
    if (!showPopup) {
      fetchShopOrders();
    }
  }, [showPopup]);

  const parseVariants = (raw) => {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  };

  const getCartQtyForVariant = (productId, color, size) => {
    if (!productId || !color || !size) return 0;
    return cart.reduce((sum, item) => {
      const itemId = item.product_id || item.productId;
      if (itemId === productId && item.color === color && item.size === size) {
        return sum + (Number(item.quantity) || 0);
      }
      return sum;
    }, 0);
  };

  const getVariantAvailableQty = (product, color, size) => {
    const variants = parseVariants(product.stock_by_variant);
    const key = `${color}-${size}`;
    const rawQty = Number(variants[key] || 0);
    const reservedQty = getCartQtyForVariant(product.product_id || product.productId, color, size);
    return Math.max(rawQty - reservedQty, 0);
  };

  const handleProductSelect = (id) => {
    setSelectedId(id);
    const product = products.find((p) => p.product_id === id);
    if (!product) return;

    setCategory(product.category || "");
    setDerivedCategory(product.category || "");

    const variantKeys = Object.keys(parseVariants(product.stock_by_variant));
    const colors = Array.from(
      new Set(variantKeys.map((key) => key.split("-")[0]))
    );
    const sizes = Array.from(
      new Set(variantKeys.map((key) => key.split("-")[1]))
    );

    setAvailableColors(colors);
    setAvailableSizes(sizes);
    setColor(colors.length === 1 ? colors[0] : "");
    setSize(sizes.length === 1 ? sizes[0] : "");
    setAvailableQty(0);
  };

  useEffect(() => {
    if (!selectedId || !color || !size) {
      setAvailableQty(0);
      return;
    }

    const product = products.find((p) => p.product_id === selectedId);
    if (!product) return;

    setAvailableQty(getVariantAvailableQty(product, color, size));
  }, [selectedId, color, size, products, cart]);

  const handleAddToCart = () => {
    if (!selectedId || quantity < 1 || !color || !size || !category) {
      toast.error("Please select a product with valid details");
      return;
    }

    const product = products.find((p) => p.product_id === selectedId);
    if (!product) return;

    const available = getVariantAvailableQty(product, color, size);

    if (available < quantity) {
      toast.error("Selected variant is out of stock or insufficient quantity.");
      return;
    }

    const existing = cart.find(
      (item) =>
        item.product_id === selectedId &&
        item.color === color &&
        item.size === size &&
        item.category === category
    );
    if (existing) {
      toast.error("This product variant is already in the cart.");
      return;
    }

    const images = (() => {
      if (Array.isArray(product.images)) return product.images;
      try { return JSON.parse(product.images || "[]"); } catch { return []; }
    })();

    const defaultVariantImage = getVariantImage(product.images_by_variant, color, size);

    const cartItem = {
      ...product,
      quantity,
      color,
      size,
      category,
      price: product.sale_price,
      image: images[0] || defaultVariantImage || product.customizedImage || "/placeholder.jpg",
      uid: `${selectedId}-${color}-${size}-${Date.now()}`,
    };

    setCart((prev) => [...prev, cartItem]);
    toast.success("Product added to cart!");

    // Reset selection
    setSelectedId("");
    setQuantity(1);
    setColor("");
    setSize("");
    setCategory("");
    setAvailableColors([]);
    setAvailableSizes([]);
    setDerivedCategory("");
    setAvailableQty(0);
  };

  const handleRemove = (uid) => {
    setCart((prev) => prev.filter((item) => item.uid !== uid));
    toast.success("Product removed from cart!");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal ;

  const handlePrintAndSave = async () => {
    if (!customerName || !customerPhone || !shopCustomerType || cart.length === 0) {
      toast.error("Please fill in all customer details and add products to cart.");
      return;
    }

    try {
      // Reduce stock for each sold item using the dedicated reduce-stock route
      for (let item of cart) {
        await api.put(`/products/${item.product_id || item.productId}/reduce-stock`, {
          color: item.color?.trim(),
          size: item.size?.trim(),
          quantity: Number(item.quantity),
        });
      }

      const minimalCart = cart.map((item) => ({
        productId: item.productId || item.id,
        name: item.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        image: item.image || "",
        customizedImage: item.customizedImage || "",
      }));

      await api.post("/orders", {
        customerName,
        customerPhone,
        gstNumber,
        address,
        shopCustomerType,
        items: minimalCart,
        subtotal,
        total,
        status: "Delivered",
      });

      toast.success("Order saved successfully!");
      if (typeof setActiveTab === "function") {
        setActiveTab();
      } else {
        navigate("/admin/billing");
      }

      setCustomerName("");
      setCustomerPhone("");
      setGstNumber("");
      setAddress("");
      setShopCustomerType("");
      setCart([]);
      setOrderSaved(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save order. Please try again.");
    }
    
  };



  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold text-blue-900">T-Shirt Billing</h2>
        <button 
          onClick={() => {
            setCustomerName("");
            setCustomerPhone("");
            setGstNumber("");
            setAddress("");
            setShopCustomerType("");
            setCart([]);
            setOrderSaved(false);
            setSelectedId("");
            setQuantity(1);
            setColor("");
            setSize("");
            setCategory("");
            setAvailableColors([]);
            setAvailableSizes([]);
            setDerivedCategory("");
            setAvailableQty(0);
            setShowPopup(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors shadow-md cursor-pointer self-start sm:self-auto"
        >
          + Add New Bill
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Generate invoices with multiple items and customer info.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* All Orders Card */}
        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex flex-col justify-between group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4 blur-xl"></div>
          <div className="absolute bottom-0 right-10 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 blur-lg"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 shadow-sm">All Orders</p>
              <p className="text-4xl font-black text-white drop-shadow-md tracking-tighter">{filteredOrders.length}</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <FaClipboardList size={22} className="text-white drop-shadow-sm" />
            </div>
          </div>
          
          <div className="mt-6 relative z-10">
            <p className="text-xs text-white/90 mb-2 font-medium">Total shop customer bills</p>
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
            </div>
          </div>
        </div>
        
        {/* Total Revenue Card */}
        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-md flex flex-col justify-between group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4 blur-xl"></div>
          <div className="absolute bottom-0 right-10 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 blur-lg"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 shadow-sm">Total Revenue</p>
              <p className="text-4xl font-black text-white drop-shadow-md tracking-tighter">₹{totalRevenue.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <FaRupeeSign size={22} className="text-white drop-shadow-sm" />
            </div>
          </div>
          
          <div className="mt-6 relative z-10">
            <p className="text-xs text-white/90 mb-2 font-medium">Current results</p>
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full md:w-1/3 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {filterType === "FromTo" && (
            <div className="flex gap-2">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          )}

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
            <option value="All">All</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="FromTo">From - To</option>
          </select>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
            <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${viewMode === "table" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`} title="Table View">
              <FaList />
            </button>
            <button onClick={() => setViewMode("card")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${viewMode === "card" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`} title="Card View">
              <FaThLarge />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Display */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-64 bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No shop customer bills found.</p>
          <button onClick={() => setShowPopup(true)} className="mt-2 text-blue-600 hover:underline text-sm font-medium cursor-pointer">Create one now</button>
        </div>
      ) : !isMobile && viewMode === "table" ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openOrderDetails(order)}>
                    <td className="px-4 py-4 font-bold text-blue-700">{order.order_id}</td>
                    <td className="px-4 py-4">{order.checkout?.customerName || order.checkout?.fullname || "Unknown"}</td>
                    <td className="px-4 py-4">{order.checkout?.customerPhone || order.checkout?.contact || "-"}</td>
                    <td className="px-4 py-4">{order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">₹{order.total}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">{order.status || "Delivered"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentItems.map((order) => (
            <div key={order.order_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                  <p className="font-extrabold text-blue-900 text-lg">{order.order_id}</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-bold rounded px-2 py-1 shrink-0">{order.status || "Delivered"}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    {(order.checkout?.customerName || order.checkout?.fullname || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 truncate">{order.checkout?.customerName || order.checkout?.fullname || "Unknown"}</p>
                    <p className="text-xs text-gray-500 truncate">{order.checkout?.customerPhone || order.checkout?.contact || "No Contact"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100/50">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Amount</p>
                    <p className="font-bold text-gray-900 text-base">₹{order.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                    <p className="font-semibold text-gray-700 text-sm">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => openOrderDetails(order)} className="text-blue-700 font-semibold text-sm hover:underline">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-4 mt-2 mb-8 bg-white border border-gray-200 rounded-xl shadow-sm gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md text-sm py-1 px-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Showing {filteredOrders.length === 0 ? 0 : indexOfFirst + 1} to {Math.min(indexOfLast, filteredOrders.length)} of {filteredOrders.length} items
            </p>
          </div>
          
          {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => {
                const page = idx + 1;
                const shouldShow = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
                
                if (!shouldShow) {
                  if ((page === 2 && currentPage > 4) || (page === totalPages - 1 && currentPage < totalPages - 3)) {
                    return <span key={page} className="px-2 text-gray-400 font-medium">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              Next
            </button>
          </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-blue-900 text-white">
              <div>
                <h3 className="text-xl font-bold">Order Details</h3>
                <p className="text-sm text-blue-100">Order #{selectedOrder.order_id}</p>
              </div>
              <button onClick={closeOrderDetails} className="text-white/90 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Customer</h4>
                  <p className="mt-2 text-gray-900 font-semibold">{getCheckoutData(selectedOrder).customerName || getCheckoutData(selectedOrder).fullname || "Unknown"}</p>
                  <p className="text-sm text-gray-600">{getCheckoutData(selectedOrder).customerPhone || getCheckoutData(selectedOrder).contact || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</h4>
                  <p className="mt-2 text-gray-900 whitespace-pre-line">{getCheckoutData(selectedOrder).address || "Not provided"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
                  <p className="mt-2 font-semibold text-gray-900">{selectedOrder.order_id}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                  <p className="mt-2 font-semibold text-gray-900">₹{selectedOrder.total}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <p className="mt-2 font-semibold text-gray-900">{selectedOrder.status || "Delivered"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Items</h4>
                <div className="mt-3 space-y-3">
                  {getOrderItems(selectedOrder).map((item, index) => {
                    const orderItem = item?.item || item;
                    const quantity = orderItem.quantity || orderItem.qty || 1;
                    const price = parseFloat(orderItem.price || orderItem.amount || 0) || 0;
                    return (
                      <div key={index} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center gap-4">
                          <img
                            src={getOrderItemImage(orderItem)}
                            alt={orderItem.name || orderItem.productName || "Item image"}
                            onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{orderItem.name || orderItem.productName || "Item"}</p>
                            <p className="text-sm text-gray-500">
                              {orderItem.color ? `Color: ${orderItem.color}` : ""}
                              {orderItem.color && orderItem.size ? " • " : ""}
                              {orderItem.size ? `Size: ${orderItem.size}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-700">
                          <p>Qty: {quantity}</p>
                          <p className="font-semibold">₹{price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Total: ₹{(price * quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:w-[600px] lg:w-[700px] h-full bg-gray-50 shadow-2xl relative flex flex-col overflow-y-auto animate-[slideIn_0.3s_ease-out]">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 flex justify-between items-center text-white sticky top-0 z-10 shadow-md">
              <div>
                <h3 className="text-xl font-bold">Add New Bill</h3>
                <p className="text-blue-200 text-sm mt-1">Generate invoices with multiple items and customer info.</p>
              </div>
              <button 
                onClick={() => setShowPopup(false)}
                className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
    <input
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
      placeholder="Enter customer name"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
    <input
      value={customerPhone}
      onChange={(e) => setCustomerPhone(e.target.value)}
      placeholder="Enter phone number"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
    <input
      value={gstNumber}
      onChange={(e) => setGstNumber(e.target.value)}
      placeholder="Enter GST number"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
    <textarea
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Enter address"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
    <select
      value={shopCustomerType}
      onChange={(e) => setShopCustomerType(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select Type</option>
      <option value="ShopCustomer">Shop Customer</option>
    </select>
  </div>
</div>


        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <select value={selectedId} onChange={(e) => handleProductSelect(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name} - ₹{p.sale_price}
              </option>
            ))}
          </select>
          <input value={derivedCategory} disabled className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={availableColors.length === 0}>
            <option value="">Select Color</option>
            {availableColors.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={availableSizes.length === 0}>
            <option value="">Select Size</option>
            {availableSizes.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input type="number" value={quantity} min="1" onChange={(e) => setQuantity(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        {color && size && (
          <p className="text-sm text-gray-600 mt-2">Available Qty: <strong>{availableQty}</strong></p>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={handleAddToCart} className="bg-blue-900 cursor-pointer text-white py-2 px-4 rounded hover:bg-blue-800">Add to Cart</button>
        </div>
      </div>

      {cart.length > 0 && !orderSaved && (
        <div ref={invoiceRef} className=" p-0 rounded ">
  {/* Desktop Table */}
  <div className="overflow-x-auto  bg-white rounded  hidden md:block">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
        <tr>
          <th className="p-2">Image</th>
          <th className="p-2">Product</th>
          <th className="p-2">Category</th>
          <th className="p-2">Color</th>
          <th className="p-2">Size</th>
          <th className="p-2 text-center">Qty</th>
          <th className="p-2 text-right">Price</th>
          <th className="p-2 text-right">Total</th>
          <th className="p-2 text-right no-print">Action</th>
        </tr>
      </thead>
      <tbody>
        {cart.map((item) => (
          <tr key={item.uid} className="border-t">
            <td className="p-2">
              <img
                src={item.image || item.customizedImage || item.images?.[0] || "/placeholder.jpg"}
                alt={item.name}
                className="w-12 h-12 object-cover rounded border"
                onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
              />
            </td>
            <td className="p-2">{item.name}</td>
            <td className="p-2">{item.category}</td>
            <td className="p-2">{item.color}</td>
            <td className="p-2">{item.size}</td>
            <td className="p-2 text-center">{item.quantity}</td>
            <td className="p-2 text-right">₹{item.price}</td>
            <td className="p-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
            <td className="p-2 text-right no_print">
              <button onClick={() => handleRemove(item.uid)} className="text-red-600 hover:underline">Remove</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Mobile Card View */}
  <div className="md:hidden space-y-4">
    {cart.map((item) => (
      <div key={item.uid} className=" rounded-lg p-4 shadow-md bg-white">
        <div className="flex items-center gap-4">
          <img
            src={item.image || item.customizedImage || item.images?.[0] || "/placeholder.jpg"}
            alt={item.name}
            className="w-16 h-16 object-cover rounded border"
            onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
          />
          <div className="flex-1">
            <h4 className="text-lg font-semibold">{item.name}</h4>
            <p className="text-sm text-gray-500">{item.category}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-gray-700">
          <div><span className="font-semibold">Color:</span> {item.color}</div>
          <div><span className="font-semibold">Size:</span> {item.size}</div>
          <div><span className="font-semibold">Qty:</span> {item.quantity}</div>
          <div><span className="font-semibold">Price:</span> ₹{item.price}</div>
          <div className="col-span-2"><span className="font-semibold">Total:</span> ₹{(item.price * item.quantity).toFixed(2)}</div>
        </div>
        <div className="text-right mt-2">
          <button onClick={() => handleRemove(item.uid)} className="text-red-600 text-sm underline">Remove</button>
        </div>
      </div>
    ))}
  </div>

  {/* Totals Section */}
  <div className="text-right mt-6 space-y-1 no_prints">
    <div>Subtotal: ₹{subtotal.toFixed(2)}</div>
    
    <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
    <button
      onClick={handlePrintAndSave}
      className="bg-gray-900 cursor-pointer hover:bg-gray-700 text-white px-6 py-2 rounded mt-2"
    >
      Save & Print Invoice
    </button>
  </div>
</div>

      )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;