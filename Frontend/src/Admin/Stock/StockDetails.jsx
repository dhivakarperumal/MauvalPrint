import React, { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

const StockDetails = () => {
  const [products, setProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchStock = async () => {
    try {
      const { data } = await api.get("/products");
      const productList = [];

      (data.products || []).forEach((product) => {
        let stockByVariant = product.stock_by_variant || {};
        if (typeof stockByVariant === "string") {
          try {
            stockByVariant = JSON.parse(stockByVariant);
          } catch {
            stockByVariant = {};
          }
        }

        const variants = [];
        let totalStock = 0;

        Object.entries(stockByVariant).forEach(([key, qty]) => {
          const [color, size] = key.split("-");
          variants.push({ key, color, size, qty });
          totalStock += qty || 0;
        });

        productList.push({
          productId: product.product_id || product.id || "",
          name: product.name || "",
          variants,
          totalStock,
        });
      });

      productList.sort((a, b) =>
        a.productId.localeCompare(b.productId, undefined, { numeric: true })
      );

      setProducts(productList);
    } catch (error) {
      toast.error("Failed to fetch stock");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const toggleExpand = (productId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleEdit = (product, variant) => {
    setSelectedVariant({
      ...variant,
      productId: product.productId,
      name: product.name,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedVariant((prev) => ({
      ...prev,
      [name]: name === "qty" ? parseInt(value) || 0 : value,
    }));
  };

  const handleUpdate = async () => {
    const { productId, key, qty } = selectedVariant;

    try {
      await api.put(`/products/${productId}/stock`, {
        variant: key,
        quantity: qty,
      });

      toast.success("Stock updated");
      setShowModal(false);
      fetchStock(); // refresh stock list
    } catch (error) {
      toast.error("Failed to update stock");
      console.error(error);
    }
  };

  return (
    <div className="p-4 min-h-screen">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">Stock Details</h2>
      <p className="text-sm text-gray-500 mb-6">
        View and edit variant-wise stock for all products.
      </p>

      <div className="overflow-x-auto bg-white rounded shadow">
  <table className="min-w-full text-sm text-left">
    <thead className="bg-gray-800 text-white">
      <tr>
        <th className="px-4 py-4">Product ID</th>
        <th className="px-4 py-4">Name</th>
        <th className="px-4 py-4">Total Stock</th>
      </tr>
    </thead>
    <tbody>
      {products.length > 0 ? (
        products.map((product) => (
          <React.Fragment key={product.productId}>
            {/* Main Row */}
            <tr className="border-t border-gray-300 bg-gray-50">
              <td
                className="px-4 py-4 cursor-pointer text-blue-700 hover:underline"
                onClick={() => toggleExpand(product.productId)}
              >
                {product.productId}
              </td>
              <td className="px-4 py-4">{product.name}</td>
              <td className="px-4 py-4">{product.totalStock}</td>
            </tr>

            {/* Expanded Row */}
            {expandedRows.has(product.productId) && (
              <tr className="bg-white">
                <td colSpan="3" className="px-4 py-4">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="p-2 ">Color</th>
                        <th className="p-2 ">Size</th>
                        <th className="p-2 ">Qty</th>
                        <th className="p-2 ">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant, i) => (
                        <tr key={i} className="border-2 border-b border-gray-300">
                          <td className="p-2 ">{variant.color}</td>
                          <td className="p-2 ">{variant.size}</td>
                          <td className="p-2 ">{variant.qty}</td>
                          <td className="p-2 ">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleEdit(product, variant)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))
      ) : (
        <tr>
          <td colSpan="3" className="text-center py-4 text-gray-500">
            No stock data found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


      {/* Modal */}
      {showModal && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-4 text-2xl text-gray-500"
            >
              &times;
            </button>

            <h3 className="text-xl font-bold text-blue-900 mb-4 text-center">
              Edit Variant Stock
            </h3>

            <div className="space-y-3">
              <input
                value={selectedVariant.name}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                value={`Color: ${selectedVariant.color}`}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                value={`Size: ${selectedVariant.size}`}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                name="qty"
                type="number"
                value={selectedVariant.qty}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity"
                min="0"
              />
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={handleUpdate}
                className="bg-blue-900 text-white px-4 py-4 rounded hover:bg-blue-800"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetails;








