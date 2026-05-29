import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

const OurDesings = () => {
  const [product, setProduct] = useState({
    id: "",
    name: "",
    category: "",
    size: [],
    color: [],
    offer: 0,
    rating: 0,
    mrp: 0,
    salePrice: 0,
    stock: 0,
    description: "",
    fabricDetails: "",
    images: [],
  });

  const [docId, setDocId] = useState(null);
  const [stockByVariant, setStockByVariant] = useState({});
  const [previewImg, setPreviewImg] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [designProducts, setDesignProducts] = useState([]);
  const [viewMode, setViewMode] = useState("form");

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = ["Black", "White", "Red", "Blue", "Green", "Yellow"];

  const resetForm = () => {
    setProduct({
      id: "",
      name: "",
      category: "",
      size: [],
      color: [],
      offer: 0,
      rating: 0,
      mrp: 0,
      salePrice: 0,
      stock: 0,
      description: "",
      fabricDetails: "",
      images: [],
    });
    setDocId(null);
    setStockByVariant({});
    setPreviewImg([]);
    generateNextProductId();
  };

  const generateNextProductId = async () => {
    try {
      const snapshot = await getDocs(collection(db, "ourdesings"));
      const ids = snapshot.docs
        .map((doc) => doc.data().id)
        .filter((id) => id && id.startsWith("MD"))
        .map((id) => parseInt(id.replace("MD", ""), 10))
        .filter((num) => !isNaN(num));
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const nextId = `MD${String(maxId + 1).padStart(3, "0")}`;
      setProduct((prev) => ({ ...prev, id: nextId }));
    } catch (error) {
      toast.error("Could not generate product ID");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    try {
      const compressed = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
        )
      );
      const base64Images = await Promise.all(
        compressed.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );
      setProduct((prev) => ({ ...prev, images: base64Images }));
      setPreviewImg(base64Images);
      toast.success("Images uploaded & compressed!");
    } catch (error) {
      toast.error("Failed to compress or upload images.");
    }
  };

  const handleVariantStockChange = (color, size, value) => {
    const key = `${color}-${size}`;
    const qty = parseInt(value, 10) || 0;
    setStockByVariant((prev) => ({ ...prev, [key]: qty }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const requiredFields = ["id", "name", "category", "mrp", "salePrice", "description"];
    const missingFields = requiredFields.filter((field) => !product[field]);

    if (!product.size.length) {
      toast.error("Select at least one size.");
      setLoading(false);
      return;
    }

    if (!product.color.length) {
      toast.error("Select at least one color.");
      setLoading(false);
      return;
    }

    if (missingFields.length > 0) {
      toast.error(`Fill in: ${missingFields.join(", ")}`);
      setLoading(false);
      return;
    }

    const totalStock = Object.values(stockByVariant).reduce((a, b) => a + b, 0);
    const finalProduct = {
      ...product,
      stock: totalStock,
      stockByVariant,
      mrp: Number(product.mrp),
      salePrice: Number(product.salePrice),
      offer: Number(product.offer) || 0,
      rating: Number(product.rating) || 0,
      updatedAt: new Date(),
    };

    try {
      if (docId) {
        await updateDoc(doc(db, "ourdesings", docId), finalProduct);
        toast.success("Product updated!");
      } else {
        const docRef = await addDoc(collection(db, "ourdesings"), {
          ...finalProduct,
          createdAt: new Date(),
        });
        await updateDoc(docRef, { productId: docRef.id });
        toast.success("Product added!");
      }
      resetForm();
      fetchDesignProducts();
      setViewMode("table");
    } catch (err) {
      toast.error("Error submitting product.");
    }

    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const categoryList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDesignProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "ourdesings"));
      const data = snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
      setDesignProducts(data);
    } catch (error) {
      toast.error("Failed to load products.");
    }
  };

  const handleEdit = (p) => {
    setProduct({
      ...p,
      color: Array.isArray(p.color) ? p.color : [],
      size: Array.isArray(p.size) ? p.size : [],
      images: Array.isArray(p.images) ? p.images : [],
    });
    setDocId(p.docId);
    setStockByVariant(p.stockByVariant || {});
    setPreviewImg(Array.isArray(p.images) ? p.images : []);
    setViewMode("form");
    toast("Editing product...");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "ourdesings", id));
      toast.success("Product deleted.");
      await fetchDesignProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product.");
    }
  };



  useEffect(() => {
    generateNextProductId();
    fetchCategories();
    fetchDesignProducts();
  }, []);



  return (
    <div className="max-w-7xl mx-auto px-5 py-8 min-h-screen">
      {/* Toggle Buttons */}
       
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900">Our Designs – Product List </h2>
    <p className="text-sm text-gray-500">Manage your uploaded product designs here.</p>
        </div>
       <div>
         <button
          onClick={() => {
            resetForm();
            setViewMode("form");
          }}
          className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium ${viewMode === "form"
              ? "bg-blue-900 text-white"
              : "bg-gray-100 text-gray-800"
            }`}
        >
          Add Our Design
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium ${viewMode === "table"
              ? "bg-blue-900 text-white"
              : "bg-gray-100 text-gray-800"
            }`}
        >
          Our Designs
        </button>
       </div>
      </div>

      {/* FORM */}
      {viewMode === "form" && (
        <>
          {/* <h2 className="text-3xl font-bold text-blue-900 mb-6">
            {docId ? "Edit Product" : "Add New Product"}
          </h2> */}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product ID</label>
              <input type="text" name="id" value={product.id} readOnly className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name *</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                name="category"
                value={product.category}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Select</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.cname}>{cat.cname}</option>
                ))}
              </select>
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colors *</label>
              <div className="grid grid-cols-3 gap-2">
                {colors.map((color) => (
                  <label key={color} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={color}
                      checked={product.color.includes(color)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProduct((prev) => ({
                          ...prev,
                          color: checked ? [...prev.color, color] : prev.color.filter((c) => c !== color),
                        }));
                      }}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sizes *</label>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => (
                  <label key={size} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={size}
                      checked={product.size.includes(size)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProduct((prev) => ({
                          ...prev,
                          size: checked ? [...prev.size, size] : prev.size.filter((s) => s !== size),
                        }));
                      }}
                    />
                    {size}
                  </label>
                ))}
              </div>
            </div>

            {product.color.length > 0 && product.size.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter Quantity per Variant</label>
                <table className="min-w-full border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                  <thead className="bg-[#192f59] text-white">
                    <tr>
                      <th className=" px-2 py-1 ">C\S</th>
                      {product.size.map((s) => (
                        <th key={s} className=" px-2 py-1">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.color.map((c) => (
                      <tr key={c}>
                        <td className="border-2 border-b border-gray-300 px-2 py-1 font-medium ">{c}</td>
                        {product.size.map((s) => {
                          const key = `${c}-${s}`;
                          return (
                            <td key={key} className="border-2 border-b border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                value={stockByVariant[key] || ""}
                                min="0"
                                placeholder="0"
                                onChange={(e) => handleVariantStockChange(c, s, e.target.value)}
                                className="w-15 px-2 py-1 border-2 border-b border-gray-300 rounded"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm text-gray-600 mt-2">
                  Total Stock: <strong>{Object.values(stockByVariant).reduce((a, b) => a + b, 0)}</strong>
                </p>
              </div>
            )}

            {["offer", "rating", "mrp", "salePrice"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, " $1")} {["mrp", "salePrice"].includes(field) ? "*" : ""}</label>
                <input
                  type="number"
                  name={field}
                  value={product[field]}
                  onChange={handleInputChange}
                  required={["mrp", "salePrice"].includes(field)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            ))}

            {["description", "fabricDetails"].map((field) => (
              <div key={field} className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, " $1")} {field === "description" ? "*" : ""}</label>
                <textarea
                  name={field}
                  value={product[field]}
                  onChange={handleInputChange}
                  rows={3}
                  required={field === "description"}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Images (max 4) — JPG/PNG, under 200KB each
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="mt-1 text-sm"
              />
              <div className="mt-4 flex gap-4 flex-wrap">
                {previewImg.map((img, i) => (
                  <img key={i} src={img} alt="preview" className="w-24 h-24 object-cover rounded border" />
                ))}
              </div>
            </div>

            <div className="md:col-span-2 text-right">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-900 text-white px-6 py-2 cursor-pointer rounded-lg hover:bg-blue-800"
              >
                {loading ? "Processing..." : docId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </>
      )}

      {/* TABLE */}
      {viewMode === "table" && (
        <>
          

         {/* Desktop Table */}
<div className="overflow-x-auto bg-white rounded shadow hidden md:block">
  <table className="min-w-full text-sm text-left">
    <thead className="bg-gray-800 text-white">
      <tr>
        <th className="px-4 py-4">Product ID</th>
        <th className="px-4 py-4">Name</th>
        <th className="px-4 py-4">Category</th>
        <th className="px-4 py-4">MRP</th>
        <th className="px-4 py-4">Sale Price</th>
        <th className="px-4 py-4">Stock</th>
        <th className="px-4 py-4">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {designProducts.map((item) => (
        <tr key={item.docId}>
          <td className="px-4 py-4">{item.id}</td>
          <td className="px-4 py-4 flex gap-3"> <img src={item.images?.[0]}  alt="product"
                    className="w-8 h-8 object-cover rounded"  /> {item.name}</td>
          <td className="px-4 py-4">{item.category}</td>
          <td className="px-4 py-4">₹{item.mrp}</td>
          <td className="px-4 py-4">₹{item.salePrice}</td>
          <td className="px-4 py-4">{item.stock}</td>
          <td className="px-4 py-4 space-x-2">
           
            <button
              onClick={() => handleEdit(item)}
              className="text-gray-600 border cursor-pointer border-gray-300 p-2 rounded hover:text-yellow-600"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(item.docId)}
              className="text-gray-600 border cursor-pointer border-gray-300 p-2 rounded hover:text-red-600"
            >
              <FaTrash />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* Mobile Card View */}
<div className="grid gap-4 md:hidden">
  {designProducts.map((item) => (
    <div
      key={item.docId}
      className="bg-white rounded shadow p-4 space-y-2 text-sm"
    >
      <div><strong>Product ID:</strong> {item.id}</div>
      <div><strong>Name:</strong> {item.name} </div>
      <div className="flex gap-3"> <strong>Image:</strong><img src={item.images?.[0]}  alt="product"
                    className="w-8 h-8 object-cover rounded"  /></div>
      <div><strong>Category:</strong> {item.category}</div>
      <div><strong>MRP:</strong> ₹{item.mrp}</div>
      <div><strong>Sale Price:</strong> ₹{item.salePrice}</div>
      <div><strong>Stock:</strong> {item.stock}</div>

      <div className="flex space-x-4 pt-2">
        
           
            <button
              onClick={() => handleEdit(item)}
              className="text-gray-600 border cursor-pointer border-gray-300 p-2 rounded hover:text-yellow-600"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(item.docId)}
              className="text-gray-600 cursor-pointer border border-gray-300 p-2 rounded hover:text-red-600"
            >
              <FaTrash />
            </button>
        
        
      </div>
    </div>
  ))}
</div>

        </>
      )}
    </div>
  );
};

export default OurDesings;
