import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

const AddStock = () => {
  const [productIds, setProductIds] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [product, setProduct] = useState({
    pId: "",
    name: "",
    color: [],
    category: "",
    size: [],
    stock: 0,
    stockByVariant: {},
  });

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [addStock, setAddStock] = useState("");

  useEffect(() => {
    const fetchProductIds = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const ids = snapshot.docs
          .map((doc) => ({
            docId: doc.id,
            productId: doc.data().id || "",
          }))
          .filter((item) => item.productId.startsWith("MP"));
        setProductIds(ids);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product IDs");
      }
    };
    fetchProductIds();
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!selectedId) return;
      try {
        const docRef = doc(db, "products", selectedId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            pId: data.id || "",
            name: data.name || "",
            color: Array.isArray(data.color) ? data.color : [data.color],
            category: data.category || "",
            size: Array.isArray(data.size) ? data.size : [data.size],
            stock: data.stock || 0,
            stockByVariant: data.stockByVariant || {},
          });
        } else {
          toast.error("Product not found!");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch product details");
      }
    };
    fetchProductDetails();
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const added = Number(addStock);
    if (!selectedId || !selectedSize || !selectedColor || isNaN(added) || added <= 0) {
      toast.error("Select product, size, color, and enter valid stock.");
      return;
    }

    try {
      const docRef = doc(db, "products", selectedId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        toast.error("Product not found!");
        return;
      }

      const data = docSnap.data();
      let stockByVariant = { ...data.stockByVariant } || {};
      const key = `${selectedColor}-${selectedSize}`;
      const currentQty = Number(stockByVariant[key] || 0);
      stockByVariant[key] = currentQty + added;

      const existingTotalStock = Number(data.stock || 0);
      const updatedTotalStock = existingTotalStock + added;

      await updateDoc(docRef, {
        stockByVariant,
        stock: updatedTotalStock,
      });

      toast.success(`Stock updated: ${key} = ${stockByVariant[key]}`);

      setProduct((prev) => ({
        ...prev,
        stockByVariant,
        stock: updatedTotalStock,
      }));

      setAddStock("");
      setSelectedSize("");
      setSelectedColor("");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update stock.");
    }
  };

  const currentQty = product.stockByVariant[`${selectedColor}-${selectedSize}`] || 0;

  return (
    <div className="p-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900">Add Product Stock</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select product, size & color to add stock.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Product ID *
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Product --</option>
              {productIds.map(({ docId, productId }) => (
                <option key={docId} value={docId}>
                  {productId}
                </option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              value={product.name}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Size *</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Size --</option>
              {product.size.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Color *</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Color --</option>
              {product.color.map((clr) => (
                <option key={clr} value={clr}>
                  {clr}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock for Selected Variant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Variant Stock</label>
            <input
              type="number"
              value={currentQty}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Add Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Stock *</label>
            <input
              type="number"
              value={addStock}
              onChange={(e) => setAddStock(e.target.value)}
              required
              min={1}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5"
            />
          </div>

          {/* Submit */}
          <div className="md:col-span-2 text-right mt-2">
            <button
              type="submit"
              className="bg-blue-900 text-white cursor-pointer px-8 py-2 rounded-lg hover:bg-blue-800"
            >
              Add to Stock
            </button>
          </div>
        </form>
      </div>

      {/*  Existing Stock Table */}
      {Object.keys(product.stockByVariant).length > 0 && (
        <div className="mt-8 max-w-7xl mx-auto bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">Existing Stock</h3>
          <p className="text-gray-600 mb-4">Total Stock: {product.stock}</p>
          <div className="hidden md:block overflow-x-auto shadow rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-2 ">Variant (Color-Size)</th>
                  <th className="px-4 py-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(product.stockByVariant).map(([key, qty], idx) => (
                  <tr key={idx} className="border-t border-gray-300">
                    <td className="px-4 py-2 ">{key}</td>
                    <td className="px-4 py-2">{qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStock;

