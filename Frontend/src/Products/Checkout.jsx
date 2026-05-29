import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import emailjs from "@emailjs/browser";

import logoimg from '/Image/lo.png'



import Head from "../Components/Head";
import { AuthContext } from "../Context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SHIPPING_FLAT =30; 

const Checkout = () => {
  const { cart, clearCart, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const form = useRef();
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
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
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "address")
      );
      const uniqueAddresses = [];
      const seen = new Set();
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const key = `${data.fullname}-${data.contact}-${data.zip}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAddresses.push({ id: docSnap.id, ...data });
        }
      });
      setSavedAddresses(uniqueAddresses);
      if (uniqueAddresses.length) {
        setSelectedAddressIdx(0);
        handleAddressSelect(0, uniqueAddresses);
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
 const shippingCost =  totalQuantity * SHIPPING_FLAT;
  const grandTotal = subtotal  ;
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
  const generateOrderIDFromOrders = async (prefix = "ORD") => {
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    let maxNumber = 0;

    ordersSnapshot.forEach((docSnap) => {
      const order = docSnap.data();
      const match = order.orderID?.match(/\d+$/); 
      if (match) {
        const num = parseInt(match[0]);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  };


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
  const orderID = await generateOrderIDFromOrders();
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
    image: item.image || item.images?.[0] || item.customizedImage || "",
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

        const finalOrderID = await generateOrderIDFromOrders(
          isCustomLogoPrint ? "OFP" : "ORD"
        );

        // -------------------- ORDER DATA --------------------
        const orderData = {
          checkout: { ...billing, paymentID, date: dateStr },
          cart: trimmedCart,
          total: payable,
          paymentID,
          orderID: finalOrderID,
          createdAt: serverTimestamp(),
          status: "Placed",
        };

        // -------------------- SAVE ORDER TO FIRESTORE --------------------
        await Promise.all([
          addDoc(collection(db, "users", user.uid, "orders"), orderData),
          addDoc(collection(db, "orders"), {
            ...orderData,
            userId: user.uid,
            userEmail: user.email,
          }),
        ]);

        // -------------------- UPDATE STOCK --------------------
        await Promise.all(
          trimmedCart.map(async (item) => {
            if (!item.productId || !item.color || !item.size) return;
            const variantKey = `${item.color}-${item.size}`;
            const productRef = doc(db, "products", item.productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
              const productData = productSnap.data();
              const stockByVariant = productData.stockByVariant || {};

              if (stockByVariant[variantKey] >= item.quantity) {
                stockByVariant[variantKey] -= item.quantity;
              } else {
                toast.error(
                  `Not enough stock for ${item.name} - ${variantKey}`
                );
                return;
              }

              const totalStock = Object.values(stockByVariant).reduce(
                (sum, val) => sum + val,
                0
              );

              await updateDoc(productRef, {
                stockByVariant,
                stock: totalStock,
              });
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
          await addDoc(collection(db, "users", user.uid, "address"), billing);
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

      <div className="p-4 lg:p-10">
        {/* Saved addresses */}
        {savedAddresses.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Choose a Saved Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedAddresses.map((addr, idx) => (
                <label
                  key={idx}
                  onClick={() => handleAddressSelect(idx)}
                  className={`border p-4 rounded-lg shadow cursor-pointer transition ${
                    selectedAddressIdx === idx
                      ? "border-slate-800 bg-slate-100"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressIdx === idx}
                      onChange={() => handleAddressSelect(idx)}
                      className="mr-2 mt-1 accent-slate-800"
                    />
                    <div>
                      <strong>{addr.fullname}</strong> – {addr.contact}
                      <div className="text-sm text-gray-600">
                        {addr.street}, {addr.city}, {addr.state} – {addr.zip},{" "}
                        {addr.country}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Main form & summary */}
        <form ref={form} onSubmit={handlePayment} className="max-w-6xl mx-auto">
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
    <div key={idx} className="text-sm mb-2">
      <strong>{i.name}</strong> × {i.quantity} <br />
      ₹{(i.price * i.quantity).toFixed(2)}
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
    {shippingCost === 0 ?   <span className="text-green-600 font-semibold">Free</span> : (
        
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
    </section>
  );
};

export default Checkout;


