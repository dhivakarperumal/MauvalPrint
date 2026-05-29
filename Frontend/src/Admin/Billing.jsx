import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
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

  const invoiceRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const productList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProducts(productList);
    };
    fetchProducts();
  }, []);

  const handleProductSelect = (id) => {
    setSelectedId(id);
    const product = products.find((p) => p.productId === id);
    if (!product) return;

    setCategory(product.category || "");
    setDerivedCategory(product.category || "");

    const variantKeys = Object.keys(product.stockByVariant || {});
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

    const product = products.find((p) => p.productId === selectedId);
    if (!product || !product.stockByVariant) return;

    const key = `${color}-${size}`;
    const qty = product.stockByVariant[key] || 0;
    setAvailableQty(qty);
  }, [selectedId, color, size, products]);

  const handleAddToCart = () => {
    if (!selectedId || quantity < 1 || !color || !size || !category) {
      toast.error("Please select a product with valid details");
      return;
    }

    const product = products.find((p) => p.productId === selectedId);
    if (!product || !product.stockByVariant) return;

    const key = `${color}-${size}`;
    const available = product.stockByVariant[key] || 0;

    if (available < quantity) {
      toast.error("Selected variant is out of stock or insufficient quantity.");
      return;
    }

    const existing = cart.find(
      (item) =>
        item.productId === selectedId &&
        item.color === color &&
        item.size === size &&
        item.category === category
    );
    if (existing) {
      toast.error("This product variant is already in the cart.");
      return;
    }

    const cartItem = {
      ...product,
      quantity,
      color,
      size,
      category,
      price: product.salePrice,
      image: product.images?.[0] || "",
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
      const orderSnapshot = await getDocs(collection(db, "orders"));
      const orderCount = orderSnapshot.size + 1;
      const orderID = `ORD${String(orderCount).padStart(4, "0")}`;

      // Update stock
      for (let item of cart) {
        const productRef = doc(db, "products", item.id);
        const product = products.find((p) => p.id === item.id);
        if (!product || !product.stockByVariant) continue;

        const key = `${item.color}-${item.size}`;
        const currentQty = product.stockByVariant[key] || 0;
        const updatedStockByVariant = {
          ...product.stockByVariant,
          [key]: currentQty - item.quantity,
        };
        const totalStock = Object.values(updatedStockByVariant).reduce((a, b) => a + b, 0);

        await updateDoc(productRef, {
          stockByVariant: updatedStockByVariant,
          stock: totalStock,
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

      await addDoc(collection(db, "orders"), {
        orderID,
        customerName,
        customerPhone,
        gstNumber,
        address,
        shopCustomerType,
        items: minimalCart,
        subtotal,
        total,
        status: "Delivered",
        createdAt: serverTimestamp(),
      });

      toast.success("Order saved successfully!");
      setActiveTab("deliveryOrders")
      
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h2 className="text-3xl font-bold text-blue-900 mb-2">T-Shirt Billing</h2>
      <p className="text-sm text-gray-500 mb-6">Generate invoices with multiple items and customer info.</p>

      <div className="bg-white p-6 rounded shadow space-y-4 mb-8">
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
              <option key={p.id} value={p.productId}>
                {p.name} - ₹{p.salePrice}
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
              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border" />
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
          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded border" />
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
  );
};

export default Billing;