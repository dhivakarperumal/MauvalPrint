import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import emailjs from "@emailjs/browser";

import logoimg from '/Image/lo.png'

import Head from "../Components/Head";
import { AuthContext } from "../Context/AuthContext";
import api from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageContainer from "../Components/PageContainer";

const SHIPPING_FLAT = 30;

const Checkout = () => {
  const { cart, clearCart, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const form = useRef();
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef();
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(null);
  const [buyNowProduct, setBuyNowProduct] = useState([]);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return;
      try {
        const { data } = await api.get(`/users/${user.uid}/addresses`);
        if (data.success && data.addresses) {
          const uniqueAddresses = [];
          const seen = new Set();
          data.addresses.forEach((addr) => {
            const key = `${addr.fullname}-${addr.contact}-${addr.zip}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueAddresses.push(addr);
            }
          });
          setSavedAddresses(uniqueAddresses);
          if (uniqueAddresses.length) {
            setSelectedAddressIdx(0);
            handleAddressSelect(0, uniqueAddresses);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      }
    };
    loadAddresses();
  }, [user]);

  const isFromCart = location?.state?.fromCart;
  useEffect(() => {
    const state = location?.state;
    const { orderId } = location.state || {};

    if (state?.buyNowProduct && state?.fromCart === false) {
      setBuyNowProduct([state.buyNowProduct]);
    } else {
      setBuyNowProduct([]);
    }
  }, [location]);

  const itemsToShow =
    buyNowProduct.length && !isFromCart ? buyNowProduct : cart;
  const getSubtotal = () =>
    itemsToShow.reduce((t, i) => t + i.price * i.quantity, 0);
  const subtotal = getSubtotal();
  const totalQuantity = itemsToShow.reduce((sum, i) => sum + i.quantity, 0);
  const shippingCost = totalQuantity * SHIPPING_FLAT;
  const grandTotal = subtotal;
  const payable = grandTotal;

  const handleAddressSelect = (index, data = savedAddresses) => {
    setSelectedAddressIdx(index);
    const addr = data[index];
    if (!form.current) return;
    form.current.fullname.value = addr.fullname;
    form.current.email.value = addr.email;
    form.current.contactno.value = addr.contact;
    form.current.streetaddress.value = addr.street;
    form.current.city.value = addr.city;
    form.current.state.value = addr.state;
    form.current.zipcode.value = addr.zip;
    form.current.country.value = addr.country;
  };

  const filteredAddresses = savedAddresses.filter((a) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (a.fullname || "").toString().toLowerCase().includes(q) ||
      (a.contact || "").toString().toLowerCase().includes(q) ||
      (a.street || "").toString().toLowerCase().includes(q) ||
      (a.city || "").toString().toLowerCase().includes(q) ||
      (a.zip || "").toString().toLowerCase().includes(q)
    );
  });

  const reverseGeocode = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { headers: { "User-Agent": "MauvalPrint/1.0" } });
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      const addr = data.address || {};
      return {
        fullname: user?.displayName || "My Location",
        email: user?.email || "",
        contact: user?.phoneNumber || "",
        street: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(", ") || addr.display_name || "",
        city: addr.city || addr.town || addr.village || "",
        state: addr.state || "",
        zip: addr.postcode || "",
        country: addr.country || "",
        lat,
        lon,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newAddr = await reverseGeocode(latitude, longitude);
        if (newAddr) {
          // prepend and select
          const updated = [newAddr, ...savedAddresses];
          setSavedAddresses(updated);
          // attempt to persist to backend
          try {
            if (user) await api.post(`/users/${user.uid}/addresses`, newAddr);
          } catch (err) {
            console.error("Failed to save located address:", err);
          }
          setIsLocating(false);
          setSearchTerm("");
          setSelectedAddressIdx(0);
          handleAddressSelect(0, updated);
          toast.success("Location added and selected.");
        } else {
          setIsLocating(false);
          toast.error("Could not determine address from location.");
        }
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        toast.error("Unable to get your location.");
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };
  // close suggestions on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment gateway is not loaded. Please try again.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to place an order.");
      return;
    }

    if (itemsToShow.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsSavingOrder(true);
    const FD = new FormData(form.current);

    // -------------------- SHIPPING ADDRESS --------------------
    const shipping = {
      fullname: FD.get("fullname"),
      email: FD.get("email"),
      contact: FD.get("contactno"),
      street: FD.get("streetaddress"),
      city: FD.get("city"),
      state: FD.get("state"),
      zip: FD.get("zipcode"),
      country: FD.get("country"),
    };

    // -------------------- BILLING ADDRESS --------------------
    const billing = useDifferentAddress
      ? {
        fullname: FD.get("billingname"),
        email: FD.get("billingemail"),
        contact: FD.get("billingphone"),
        street: FD.get("billingstreet"),
        city: FD.get("billingcity"),
        state: FD.get("billingstate"),
        zip: FD.get("billingzip"),
        country: FD.get("billingcountry"),
      }
      : shipping;

    // -------------------- TRIM CART ITEMS --------------------
    const trimmedCart = itemsToShow.map((item) => ({
      productId: item.productId || item.id || "",
      name: item.name || "",
      price: item.price || 0,
      quantity: item.quantity || 0,
      color: item.selectedColor || "",
      size: item.selectedSize || "",
      image: item.customizedImage || item.image || item.images?.[0] || "",
      subtotal: (item.price || 0) * (item.quantity || 0),
    }));

    const dateStr = new Date().toLocaleString();

    // -------------------- RAZORPAY OPTIONS --------------------
    const options = {
      key: "rzp_test_StTyzINJPsVmoj",
      amount: Math.round(payable * 100),
      currency: "INR",
      name: "MAUVAL PRINT",
      description: "Order Payment",

      handler: async (response) => {
        const paymentID = response.razorpay_payment_id;

        try {
          const isCustomLogoPrint = trimmedCart.some((item) =>
            item.name.toLowerCase().includes("custom logo print")
          );

          // -------------------- ORDER DATA --------------------
          const orderData = {
            checkout: { ...billing, paymentID, date: dateStr },
            cart: trimmedCart,
            total: payable,
            paymentID,
            isCustomLogoPrint,
            userId: user.uid,
            userEmail: user.email,
          };

          // -------------------- SAVE ORDER TO MYSQL --------------------
          const { data: orderRes } = await api.post("/orders/web-checkout", orderData);
          if (!orderRes.success) {
            throw new Error(orderRes.message || "Failed to place order.");
          }
          const finalOrderID = orderRes.order_id;

          // -------------------- UPDATE STOCK --------------------
          await Promise.all(
            trimmedCart.map(async (item) => {
              if (!item.productId || !item.color || !item.size) return;
              try {
                await api.put(`/products/${item.productId}/reduce-stock`, {
                  color: item.color,
                  size: item.size,
                  quantity: item.quantity,
                });
              } catch (err) {
                console.error(`Failed to reduce stock for ${item.name}`, err);
              }
            })
          );

          // -------------------- SAVE ADDRESS IF NEW --------------------
          const normalize = (str) => (str || "").toString().trim().toLowerCase();

          const addressExists = savedAddresses.some(
            (a) =>
              normalize(a.fullname) === normalize(billing.fullname) &&
              normalize(a.email) === normalize(billing.email) &&
              normalize(a.contact) === normalize(billing.contact) &&
              normalize(a.street) === normalize(billing.street) &&
              normalize(a.city) === normalize(billing.city) &&
              normalize(a.state) === normalize(billing.state) &&
              normalize(a.zip) === normalize(billing.zip) &&
              normalize(a.country) === normalize(billing.country)
          );

          if (!addressExists) {
            try {
              await api.post(`/users/${user.uid}/addresses`, billing);
            } catch (err) {
              console.error("Failed to save address:", err);
            }
          }

          // -------------------- SEND CONFIRMATION EMAIL --------------------
          const productList = trimmedCart
            .map(
              (i, idx) =>
                `${idx + 1}. ${i.name} × ${i.quantity} = ₹${i.subtotal.toFixed(
                  2
                )}`
            )
            .join("\n");

          const customerAddress = `${billing.street}, ${billing.city}, ${billing.state} - ${billing.zip}, ${billing.country}`;

          await emailjs.send(
            "service_og8nym3", // ✅ Replace with your EmailJS service ID
            "template_wg4hmri", // ✅ Replace with your EmailJS template ID
            {
              to_email: billing.email,
              to_name: billing.fullname,
              order_id: finalOrderID,
              order_date: dateStr,
              order_total: payable.toFixed(2),
              product_list: productList,
              customer_name: billing.fullname,
              customer_phone: billing.contact,
              customer_email: billing.email,
              customer_address: customerAddress,
              brand_name: "Mauval Prints",
            },
            "8pXJStvSRj2dXy57f" // ✅ Replace with your EmailJS public key
          );

          // -------------------- CLEANUP --------------------
          clearCart();
          setBuyNowProduct([]);
          toast.success("Order placed successfully! Confirmation email sent.");

          setTimeout(() => {
            setIsSavingOrder(false);
            form.current.reset();
            navigate("/");
          }, 1500);
        } catch (err) {
          console.error("Order error:", err);
          setIsSavingOrder(false);
          toast.error("Failed to place order. Try again.");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };


  const inputCls =
    "border-b border-gray-300 focus:outline-none focus:border-slate-800 p-2 bg-white w-full transition-colors";

  return (

    <section className="bg-primary/5 mt-17">
      {/* breadcrumb */}
      <Head title="Checkout" subtitle="Checkout" />
      <PageContainer>
        <div className="py-4 lg:py-10">
          {/* Saved addresses */}
          {savedAddresses.length > 0 && (
            <div className=" mb-8">
              <h2 className="text-xl font-semibold mb-4">Choose a Saved Address</h2>

              <div className="flex items-start gap-3 mb-4">
                <div className="relative w-full" ref={searchWrapperRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiSearch />
                  </div>
                  <input
                    placeholder="Search saved addresses..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    className="border rounded-lg px-12 py-3 w-full placeholder-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />

                  {showSuggestions && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Saved Addresses</div>
                      {filteredAddresses.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-600">No saved addresses</div>
                      ) : (
                        filteredAddresses.map((addr, sidx) => {
                          const origIndex = savedAddresses.findIndex((sa) =>
                            (sa.street === addr.street && sa.contact === addr.contact && sa.zip === addr.zip) || (sa.lat && addr.lat && sa.lat === addr.lat && sa.lon === addr.lon)
                          );
                          const onSelectSuggestion = () => {
                            if (origIndex !== -1) handleAddressSelect(origIndex);
                            else handleAddressSelect(sidx, filteredAddresses);
                            setShowSuggestions(false);
                          };
                          return (
                            <div
                              key={sidx}
                              onClick={onSelectSuggestion}
                              className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-start border-b last:border-b-0"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{addr.fullname} <span className="text-gray-500">– {addr.contact}</span></div>
                                <div className="text-sm text-gray-600">{addr.street}{addr.street ? ', ' : ''}{addr.city} {addr.state} – {addr.zip}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
              
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                    className="px-5 py-3 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800"
                  >
                    {isLocating ? "Locating..." : "Use my location"}
                  </button>
                </div>
              </div>

             
            </div>
          )}

          {/* Main form & summary */}
          <form ref={form} onSubmit={handlePayment} className="">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* ---------------- Shipping details ---------------- */}
              <div className="w-full lg:w-2/3 border p-6 rounded-xl border-slate-800 bg-white shadow">
                <h1 className="text-2xl font-semibold mb-6">Shipping Details</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="fullname"
                    placeholder="Full Name"
                    className={inputCls}
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className={inputCls}
                    required
                  />
                  <input
                    name="contactno"
                    placeholder="Contact No"
                    className={inputCls}
                    required
                  />
                  <input
                    name="streetaddress"
                    placeholder="Street Address"
                    className={inputCls}
                    required
                  />

                  <input
                    name="city"
                    placeholder="City"
                    className={inputCls}
                    required
                  />
                  <select name="state" className={inputCls} required>
                    <option value="">Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Dadra and Nagar Haveli and Daman & Diu">Dadra and Nagar Haveli and Daman & Diu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Puducherry">Puducherry</option>
                  </select>
                  <input
                    name="zipcode"
                    placeholder="Zip Code"
                    className={inputCls}
                    required
                  />

                  <select name="country" className={inputCls} required>
                    <option value="">Select Country</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Australia">Australia</option>

                  </select>
                </div>

                {/* Billing choice */}
                <div className="flex flex-col md:flex-row gap-4 pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryAddress"
                      className="accent-slate-800 "
                      value="same"
                      checked={!useDifferentAddress}
                      onChange={() => setUseDifferentAddress(false)}
                    />
                    <span>Same as shipping address</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryAddress"
                      className="accent-slate-800 "
                      value="different"
                      checked={useDifferentAddress}
                      onChange={() => setUseDifferentAddress(true)}
                    />
                    <span>Use different billing address</span>
                  </label>
                </div>

                {/* Billing form */}
                {useDifferentAddress && (
                  <div className="mt-6 border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Billing Address
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="billingname"
                        placeholder="Billing Name"
                        className={inputCls}
                        required
                      />
                      <input
                        name="billingemail"
                        type="email"
                        placeholder="Billing Email"
                        className={inputCls}
                        required
                      />
                      <input
                        name="billingphone"
                        placeholder="Billing Phone"
                        className={inputCls}
                        required
                      />
                      <input
                        name="billingstreet"
                        placeholder="Billing Street"
                        className={inputCls}
                        required
                      />

                      <input
                        name="billingcity"
                        placeholder="Billing City"
                        className={inputCls}
                        required
                      />

                      <select name="billingstate" className={inputCls} required>
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Dadra and Nagar Haveli and Daman & Diu">Dadra and Nagar Haveli and Daman & Diu</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                        <option value="Ladakh">Ladakh</option>
                        <option value="Lakshadweep">Lakshadweep</option>
                        <option value="Puducherry">Puducherry</option>
                      </select>



                      <input
                        name="billingzip"
                        placeholder="Billing Zip"
                        className={inputCls}
                        required
                      />

                      <select name="billingcountry" className={inputCls} required>
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Australia">Australia</option>

                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------- Summary card ---------------- */}
              <div className="w-full lg:w-1/3 bg-white shadow-md rounded-lg p-6 h-fit sticky top-20">
                <h3 className="text-xl font-semibold mb-4">Order Summary</h3>

                {itemsToShow.map((i, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 mb-3 pb-3 border-b"
                  >
                    <img
                      src={i.customizedImage || i.image || i.images?.[0]}
                      alt={i.name}
                      className="w-16 h-16 object-contain rounded shadow-lg border border-gray-200"
                    />

                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{i.name}</h4>

                      {i.selectedSize && (
                        <p className="text-xs text-gray-500">
                          Size: {i.selectedSize}
                        </p>
                      )}

                      {i.selectedColor && (
                        <p className="text-xs text-gray-500">
                          Color: {i.selectedColor}
                        </p>
                      )}

                      <p className="text-sm font-semibold">
                        Qty: {i.quantity}
                      </p>

                      <p className="text-primary font-bold">
                        ₹{(i.price * i.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="mt-4 border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Items</span>
                    <span>{itemsToShow.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity</span>
                    <span>{totalQuantity}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {couponCode && (
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Coupon ({couponCode})</span>
                      <span>- ₹{(grandTotal - payable).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping <b> (Free) </b> </span>
                    <span>
                      {shippingCost === 0 ? <span className="text-green-600 font-semibold">Free</span> : (

                        <del>  ₹ {shippingCost.toFixed(2)} </del>

                      )}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-base border-t pt-3">
                    <span>Total</span>
                    <span>₹{payable.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-[#1e293b] text-white py-2 rounded-md font-semibold hover:bg-[#0f172a] transition disabled:opacity-50 cursor-pointer"
                  disabled={isSavingOrder}
                >
                  {isSavingOrder && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                      <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3">
                        <svg
                          className="animate-spin h-6 w-6 text-blue-600"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        <p className="text-blue-600 text-lg font-medium">
                          Processing your order...
                        </p>
                      </div>
                    </div>
                  )}
                  Placed Order
                </button>
              </div>
            </div>
          </form>
        </div>
      </PageContainer>
    </section>
  );
};

export default Checkout;


