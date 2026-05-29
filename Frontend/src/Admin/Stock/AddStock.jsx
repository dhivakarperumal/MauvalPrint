import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";

const parseJSON = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const AddStock = () => {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [product, setProduct] = useState({
    product_id: "",
    name: "",
    color: [],
    category: "",
    size: [],
    stock: 0,
    stock_by_variant: {},
  });

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [addStock, setAddStock] = useState("");

  // Fetch all products once on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        if (res.data.success) {
          const mpProducts = res.data.products.filter((p) =>
            p.product_id?.startsWith("MP")
          );
          setProducts(mpProducts);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product IDs");
      }
    };
    fetchProducts();
  }, []);

  // Populate product details when selection changes
  useEffect(() => {
    if (!selectedId) {
      setProduct({
        product_id: "",
        name: "",
        color: [],
        category: "",
        size: [],
        stock: 0,
        stock_by_variant: {},
      });
      return;
    }

    const found = products.find((p) => p.product_id === selectedId);
    if (found) {
      setProduct({
        product_id: found.product_id || "",
        name: found.name || "",
        color: parseJSON(found.color, []),
        category: found.category || "",
        size: parseJSON(found.size, []),
        stock: found.stock || 0,
        stock_by_variant: parseJSON(found.stock_by_variant, {}),
      });
    } else {
      toast.error("Product not found!");
    }

    setSelectedSize("");
    setSelectedColor("");
    setAddStock("");
  }, [selectedId, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const added = Number(addStock);
    if (
      !selectedId ||
      !selectedSize ||
      !selectedColor ||
      isNaN(added) ||
      added <= 0
    ) {
      toast.error("Select product, size, color, and enter valid stock.");
      return;
    }

    try {
      const res = await api.put(`/products/${selectedId}/stock`, {
        color: selectedColor,
        size: selectedSize,
        quantity: added,
      });

      if (res.data.success) {
        const key = `${selectedColor}-${selectedSize}`;
        toast.success(
          `Stock updated: ${key} = ${res.data.stock_by_variant[key]}`
        );

        setProduct((prev) => ({
          ...prev,
          stock: res.data.stock,
          stock_by_variant: res.data.stock_by_variant,
        }));

        setAddStock("");
        setSelectedSize("");
        setSelectedColor("");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update stock."
      );
    }
  };

  const currentQty =
    product.stock_by_variant[`${selectedColor}-${selectedSize}`] || 0;

  return (
    <div className="p-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900">Add Product Stock</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select product, size &amp; color to add stock.
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
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_id}
                </option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              value={product.name}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:outline-none"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Size *
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Color *
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Variant Stock
            </label>
            <input
              type="number"
              value={currentQty}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:outline-none"
            />
          </div>

          {/* Add Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Stock *
            </label>
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

      {/* Existing Stock Table */}
      {Object.keys(product.stock_by_variant).length > 0 && (
        <div className="mt-8 max-w-7xl mx-auto bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">
            Existing Stock
          </h3>
          <p className="text-gray-600 mb-4">Total Stock: {product.stock}</p>
          <div className="hidden md:block overflow-x-auto shadow rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-2">Variant (Color-Size)</th>
                  <th className="px-4 py-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(product.stock_by_variant).map(
                  ([key, qty], idx) => (
                    <tr key={idx} className="border-t border-gray-300">
                      <td className="px-4 py-2">{key}</td>
                      <td className="px-4 py-2">{qty}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStock;
