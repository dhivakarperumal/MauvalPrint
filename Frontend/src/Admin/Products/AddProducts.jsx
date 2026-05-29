import React, { useEffect, useState } from "react";
import api from "../../api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddProducts = ({ selectedProduct, setSelectedProduct, setActiveTab }) => {
  const [product, setProduct] = useState({
    id: "",
    productTitle: "",
    name: "",
    category: "",
    subcategory: "",
    color: [],
    size: [],
    offer: 0,
    rating: 0,
    mrp: 0,
    salePrice: 0,
    stock: 0,
    description: "",
    fabricDetails: "",
    fabricGSM: [],
    images: [],
    ourDesign: true,
    keyword: "",
    washingDetails: [],
    notes: "",
  });

  const [stockByVariant, setStockByVariant] = useState({});
  const [previewImg, setPreviewImg] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // FIXED: sizeChart & preview logic
  const [sizeChart, setSizeChart] = useState(null); // stores base64
  const [preview, setPreview] = useState(null); // stores preview display


 const uploadToGoDaddy = async (files, category = "products") => {
  const formData = new FormData();
  files.forEach((file, i) =>
    formData.append("files[]", file, file.name || `file_${i}`)
  );
  formData.append("category", category);

  const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

  try {
    const res = await fetch("https://mauvalprint.in/api/upload.php", {
      method: "POST",
      body: formData,
    });

    const raw = await res.text();

    // If non-OK, include server text in error
    if (!res.ok) {
      toast.dismiss(toastId);
      console.error("Upload failed response:", res.status, raw);
      toast.error(`Upload failed: server responded ${res.status}`);
      return [];
    }

    let data = null;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      // not JSON — we'll try to extract URLs from raw text below
    }

    toast.dismiss(toastId);

    // Prefer canonical "urls" array
    if (data && Array.isArray(data.urls) && data.urls.length > 0) {
      toast.success(`Uploaded ${data.urls.length} file(s) successfully`);
      return data.urls;
    }

    // Common alternative shapes: data.files or data.data
    const altArrays = ["files", "data"];
    for (const key of altArrays) {
      if (data && Array.isArray(data[key]) && data[key].length > 0) {
        const urls = data[key]
          .map((f) => f.url || f.path || f.filename || f.name)
          .filter(Boolean);
        if (urls.length > 0) {
          toast.success(`Uploaded ${urls.length} file(s) successfully`);
          return urls;
        }
      }
    }

    // Fallback: try to find URLs in raw text
    const urlMatches = raw.match(/https?:\/\/[^\s"']+/g) || [];
    if (urlMatches.length > 0) {
      toast.success(`Uploaded ${urlMatches.length} file(s) (extracted)`);
      return urlMatches;
    }

    // Nothing usable returned
    console.error("Upload response (no urls):", { raw, data });
    toast.error("Upload failed: no URLs returned from server");
    return [];
  } catch (err) {
    toast.dismiss(toastId);
    console.error("Upload error:", err);
    toast.error(`Upload failed: ${err.message || "network error"}`);
    return [];
  }
};

  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2 * 1024 * 1024,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
        initialQuality: 0.9,
      });

      const urls = await uploadToGoDaddy([compressed], "sizecharts");

      if (urls.length > 0) {
        setSizeChart(urls[0]);
        setPreview(urls[0]);
        toast.success("Size chart uploaded!");
      } else {
        toast.error("Size chart upload failed: no URL returned");
      }
    } catch (err) {
      console.error("Size chart upload error:", err);
      toast.error("Size chart upload error");
    }
  };

  const handleUpload = async () => {
    if (!sizeChart) return toast.error("No size chart selected!");
    const productId = selectedProduct?.product_id;
    if (!productId) return toast.error("Product ID not found!");

    try {
      await api.put(`/products/${productId}`, {
        size_chart_image: sizeChart,
      });
      toast.success("Size chart saved successfully!");
    } catch (err) {
      console.error("Size chart save error:", err);
      toast.error("Failed to save size chart URL!");
    }
  };

  const navigate = useNavigate();

  const resetForm = () => {
    setProduct({
      id: "",
      productTitle: "",
      name: "",
      category: "",
      subcategory: "",
      color: [],
      size: [],
      offer: 0,
      rating: 0,
      mrp: 0,
      salePrice: 0,
      stock: 0,
      description: "",
      fabricDetails: "",
      fabricGSM: [],
      images: [],
      ourDesign: true,
      keyword: "",
      washingDetails: [],
      notes: "That the T-shirt's color may differ slightly from the picture.",
    });
    setStockByVariant({});
    setPreviewImg([]);
    setPreview(null);
    setSizeChart(null);
    generateNextProductId();
  };

  const generateNextProductId = async () => {
    try {
      const { data } = await api.get("/products");
      const ids = (data.products || [])
        .map((product) => product.product_id)
        .filter((id) => id && id.startsWith("MP"))
        .map((id) => parseInt(id.replace("MP", ""), 10))
        .filter((num) => !isNaN(num));

      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const nextId = `MP${String(maxId + 1).padStart(3, "0")}`;
      setProduct((prev) => ({ ...prev, id: nextId }));
    } catch (err) {
      console.error("Error generating product ID:", err);
      toast.error("Could not generate product ID");
    }
  };

  useEffect(() => {
    if (!selectedProduct) generateNextProductId();
  }, []);

  useEffect(() => {
    if (selectedProduct && selectedProduct.product_id) {
      setProduct({
        id: selectedProduct.product_id || "",
        productTitle: selectedProduct.title || "",
        name: selectedProduct.name || "",
        category: selectedProduct.category || "",
        subcategory: selectedProduct.subcategory || "",
        color: selectedProduct.color ? (Array.isArray(selectedProduct.color) ? selectedProduct.color : JSON.parse(selectedProduct.color || "[]")) : [],
        size: selectedProduct.size ? (Array.isArray(selectedProduct.size) ? selectedProduct.size : JSON.parse(selectedProduct.size || "[]")) : [],
        offer: selectedProduct.offer || 0,
        rating: selectedProduct.rating || 0,
        mrp: selectedProduct.mrp || 0,
        salePrice: selectedProduct.sale_price || 0,
        stock: selectedProduct.stock || 0,
        description: selectedProduct.description || "",
        fabricDetails: selectedProduct.fabric_details || "",
        fabricGSM: selectedProduct.fabric_gsm ? (Array.isArray(selectedProduct.fabric_gsm) ? selectedProduct.fabric_gsm : JSON.parse(selectedProduct.fabric_gsm || "[]")) : [],
        images: selectedProduct.images ? (Array.isArray(selectedProduct.images) ? selectedProduct.images : JSON.parse(selectedProduct.images || "[]")) : [],
        ourDesign: selectedProduct.our_design || false,
        keyword: selectedProduct.keyword || "",
        washingDetails: selectedProduct.washing_details ? (Array.isArray(selectedProduct.washing_details) ? selectedProduct.washing_details : JSON.parse(selectedProduct.washing_details || "[]")) : [],
        notes: selectedProduct.notes || "",
      });
      setStockByVariant(selectedProduct.stock_by_variant ? (typeof selectedProduct.stock_by_variant === 'string' ? JSON.parse(selectedProduct.stock_by_variant) : selectedProduct.stock_by_variant) : {});
      setPreviewImg(selectedProduct.images ? (Array.isArray(selectedProduct.images) ? selectedProduct.images : JSON.parse(selectedProduct.images || "[]")) : []);
      setSizeChart(selectedProduct.size_chart_image || null);
      setPreview(selectedProduct.size_chart_image || null);
    } else {
      resetForm();
    }
  }, [selectedProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate salePrice when mrp or offer changes
      if (name === "mrp" || name === "offer") {
        const mrp = parseFloat(name === "mrp" ? value : prev.mrp) || 0;
        const offer = parseFloat(name === "offer" ? value : prev.offer) || 0;
        if (mrp > 0) {
          updated.salePrice = Math.round(mrp - (mrp * offer) / 100);
        }
      }
      return updated;
    });
  };

const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files).slice(0, 4);
  if (files.length === 0) return;

  try {
    const compressedFiles = await Promise.all(
      files.map((file) =>
        imageCompression(file, {
           maxSizeMB: 2 * 1024 * 1024,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
          initialQuality: 0.9,
        })
      )
    );

    const urls = await uploadToGoDaddy(compressedFiles, "products");

    if (urls.length > 0) {
      setProduct((prev) => ({ ...prev, images: urls }));
      setPreviewImg(urls);
      toast.success("Product images uploaded!");
    } else {
      toast.error("Image upload failed: no URLs returned");
    }
  } catch (err) {
    console.error("Image upload error:", err);
    toast.error("Image upload error");
  }
};





  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!product.images.length)
        return toast.error("Please upload at least one image.");

      const totalStock = Object.values(stockByVariant).reduce((a, b) => a + b, 0);
      const payload = {
        title: product.productTitle,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        color: product.color,
        size: product.size,
        offer: product.offer,
        rating: product.rating,
        mrp: product.mrp,
        sale_price: product.salePrice,
        stock: totalStock,
        description: product.description,
        fabric_details: product.fabricDetails,
        fabric_gsm: product.fabricGSM,
        images: product.images,
        our_design: product.ourDesign,
        keyword: product.keyword,
        washing_details: product.washingDetails,
        notes: product.notes,
        stock_by_variant: stockByVariant,
        size_chart_image: sizeChart || "",
      };

      if (selectedProduct?.product_id) {
        // Update existing product
        await api.put(`/products/${selectedProduct.product_id}`, payload);
        toast.success("Product updated!");
        setSelectedProduct(null);
      } else {
        // Add new product
        const { data } = await api.post("/products", payload);
        toast.success("Product added!");
        setSelectedProduct({ ...payload, product_id: data.product_id });
      }

      setActiveTab("allProducts");
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error("Error saving product: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };



  const sizeOptions = {
    oversize: [],
    kids: ["50cm", "55cm", "65cm", "75cm", "85cm"],
  };
  const fabricGSMOptions = ["270 GSM", "190 GSM"];
  const washingOptions = [
    "Machine Wash Cold",
    "Hand Wash Only",
    "Do Not Bleach",
    "Tumble Dry Low",
    "Iron Low Heat",
    "Dry Clean Only",
  ]; 

 useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        const categoriesData = (data.categories || []).map((cat) => ({
          id: cat.id,
          cname: cat.name,
          cdescription: cat.description,
          subcategories: cat.subcategories ? (typeof cat.subcategories === 'string' ? JSON.parse(cat.subcategories) : cat.subcategories) : [],
        }));
        setCategories(categoriesData);
      } catch (err) {
        console.error("Error fetching categories:", err);
        toast.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product.category && categories.length > 0) {
      const selectedCat = categories.find((c) => c.cname === product.category);
      setSubcategories(selectedCat?.subcategories || []);
    }
  }, [product.category, categories]);

  const getAvailableSizes = () => {
    if (product.subcategory === "Kids") {
      return sizeOptions.kids;
    } else if (
      product.subcategory === "Oversize" ||
      product.subcategory === "Fullsleeves"
    ) {
      return [];
    } else {
      return sizeOptions;
    }
  };

  const colors = ["Black", "White", "Red", "Green", "Yellow", "Pink","Navy","Dark Imperial Blue"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL","XXXL"];

  // Add this function to handle variant stock changes
  const handleVariantStockChange = (color, size, value) => {
    setStockByVariant((prev) => ({
      ...prev,
      [`${color}-${size}`]: Number(value) >= 0 ? Number(value) : 0,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      <h2 className="text-3xl font-bold text-blue-900 mb-6">
        {selectedProduct ? "Edit Product" : "Add New Product"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-lg"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product ID
          </label>
          <input
            type="text"
            name="id"
            value={product.id}
            readOnly
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
          />
        </div>

        {["productTitle", "name"].map((name, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700">
              {name === "productTitle" ? "Product Title *" : "Product Name *"}
            </label>
            <input
              type="text"
              name={name}
              value={product[name]}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder={
                name === "productTitle"
                  ? "e.g. Printed Oversized T-Shirt"
                  : "e.g. Oversized Tee"
              }
            />
          </div>
        ))}

        <div>
          <label className="block mb-1">Category *</label>
          <select
            name="category"
            value={product.category}
            onChange={(e) => {
              const selectedCategory = categories.find(
                (cat) => cat.cname === e.target.value
              );
              setProduct((prev) => ({
                ...prev,
                category: e.target.value,
                description: selectedCategory?.cdescription || "", 
              }));
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.cname}>
                {cat.cname}
              </option>
            ))}
          </select>



        </div>


        <div>
          <label className="block mb-1">Subcategory *</label>
          <select
            name="subcategory"
            value={product.subcategory}
            onChange={(e) =>
              setProduct((prev) => ({ ...prev, subcategory: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

          >
            <option value="">Select</option>
            {subcategories.map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Sizes */}
        {getAvailableSizes().length > 0 && (
          <div className="md:col-span-2">
            <label className="block mb-1">Sizes *</label>
            <div className="grid grid-cols-4 gap-2">
              {getAvailableSizes().map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={s}
                    required
                    checked={product.size.includes(s)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setProduct((prev) => ({
                        ...prev,
                        size: checked
                          ? [...prev.size, s]
                          : prev.size.filter((item) => item !== s),
                      }));
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Fabric GSM Checkboxes */}
        {(product.subcategory === "Oversize" ||
          product.subcategory === "Fullsleeves") && (
            <div className="md:col-span-2">
              <label className="block mb-1">Fabric GSM</label>
              <div className="flex gap-6">
                {fabricGSMOptions.map((gsm) => (
                  <label key={gsm} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.fabricGSM.includes(gsm)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProduct((prev) => ({
                          ...prev,
                          fabricGSM: checked
                            ? [...prev.fabricGSM, gsm]
                            : prev.fabricGSM.filter((f) => f !== gsm),
                        }));
                      }}
                    />
                    {gsm}
                  </label>
                ))}
              </div>
            </div>
          )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colors *
          </label>
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
                      color: checked
                        ? [...prev.color, color]
                        : prev.color.filter((c) => c !== color),
                    }));
                  }}
                />
                {color}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sizes *
          </label>
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
                      size: checked
                        ? [...prev.size, size]
                        : prev.size.filter((s) => s !== size),
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Quantity per Variant
            </label>
            <table className="min-w-full border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-[#192f59] text-white">
                <tr>
                  <th className=" px-2 py-1 ">C\S</th>
                  {product.size.map((s) => (
                    <th key={s} className=" px-2 py-1">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {product.color.map((c) => (
                  <tr key={c}>
                    <td className="border-2 border-b border-gray-300 px-2 py-1 font-medium ">
                      {c}
                    </td>
                    {product.size.map((s) => {
                      const key = `${c}-${s}`;
                      return (
                        <td
                          key={key}
                          className="border-2 border-b border-gray-300 px-1 py-1"
                        >
                          <input
                            type="number"
                            value={stockByVariant[key] || ""}
                            min="0"
                            
                            placeholder="0"
                            onChange={(e) =>
                              handleVariantStockChange(c, s, e.target.value)
                            }
                            className="w-13 px-2 py-1 border-2 border-b border-gray-300 rounded"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-gray-600 mt-2">
              Total Stock:{" "}
              <strong>
                {Object.values(stockByVariant).reduce((a, b) => a + b, 0)}
              </strong>
            </p>
          </div>
        )}

        {/* ── MRP ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">MRP (₹) *</label>
          <input
            type="number"
            name="mrp"
            min={0}
            value={product.mrp}
            onChange={handleInputChange}
            required
            placeholder="e.g. 999"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* ── Offer ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Offer (%)
            {product.mrp > 0 && product.offer > 0 && (
              <span className="ml-2 text-xs text-green-600 font-semibold">
                → Saves ₹{Math.round((parseFloat(product.mrp) * parseFloat(product.offer)) / 100)}
              </span>
            )}
          </label>
          <input
            type="number"
            name="offer"
            min={0}
            max={100}
            value={product.offer}
            onChange={handleInputChange}
            placeholder="e.g. 10"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* ── Sale Price ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sale Price (₹) *
            {product.mrp > 0 && product.offer > 0 && (
              <span className="ml-2 text-xs text-blue-500">(auto-calculated)</span>
            )}
          </label>
          <input
            type="number"
            name="salePrice"
            min={0}
            value={product.salePrice}
            onChange={handleInputChange}
            required
            placeholder="e.g. 799"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {product.mrp > 0 && product.offer > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Auto: ₹{product.mrp} − {product.offer}% = ₹{Math.round(product.mrp - (product.mrp * product.offer) / 100)} &nbsp;|&nbsp; Edit above to override
            </p>
          )}
        </div>

        {/* ── Rating ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Rating</label>
          <input
            type="number"
            name="rating"
            min={0}
            max={5}
            step={0.1}
            value={product.rating}
            onChange={handleInputChange}
            placeholder="e.g. 4.5"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

       

      {/* Product Description */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          name="description"
          value={product.description || product.categoryDescription || ""}
          onChange={handleInputChange}
          
          rows={3}
          placeholder="Describe the product features, material, fit etc."
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>


        {/* Fabric Details */}
        <div className="md:col-span-2 mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Fabric Details
          </label>
          <textarea
            name="fabricDetails"
            value={product.fabricDetails || ""}
            onChange={handleInputChange}
            rows={3}
            
            placeholder="e.g. 100% Cotton, 240 GSM"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Our Design Checkbox */}
        <div className="md:col-span-2 flex items-center">
          <input
            type="checkbox"
            name="ourDesign"
            checked={product.ourDesign}
            onChange={(e) =>
              setProduct((prev) => ({ ...prev, ourDesign: e.target.checked }))
            }
            className="h-4 w-4 mr-2"
          />
          <label
            htmlFor="ourDesign"
            className="text-sm font-medium text-gray-700"
          >
            Our Design Product
          </label>
        </div>

        {/* ✅ Keyword Field */}
        {product.ourDesign && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Keyword <span className="text-gray-400">(used for search)</span>
            </label>
            <input
              type="text"
              name="keyword"
              value={product.keyword}
              onChange={handleInputChange}
              placeholder="e.g. summer, floral, cotton"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}  

        

 
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Product Images (max 4) — JPG/PNG, under 200KB each
          </label>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
        <div className="mt-3 flex gap-4 flex-wrap">
          {previewImg.map((img, i) => (
            <img key={i} src={img} alt="preview" className="w-24 h-24 object-cover" />
          ))}
          </div>
        </div>

        {/* Size Chart Section - Only show after product is selected/created */}
        {selectedProduct && (
          <div className="md:col-span-2 border border-gray-300 rounded-xl p-4 bg-blue-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Upload Size Chart (Optional)
            </h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {preview && (
              <div style={{ marginTop: "10px" }}>
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <img
                  src={preview}
                  alt="size chart"
                  width={100}
                  height={100}
                  className="rounded border border-gray-300"
                />
              </div>
            )}
            <button
              type="button"
              onClick={handleUpload}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Size Chart
            </button>
          </div>
        )}

        {/* Washing Details */}
        <div className="md:col-span-2 border border-gray-300 rounded-xl p-3">
          <label className="block text-sm font-medium text-gray-700">Washing Details</label>

          {/* Default Washing Options */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 mt-3">
            {washingOptions.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={product.washingDetails.includes(option)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setProduct((prev) => ({
                      ...prev,
                      washingDetails: checked
                        ? [...prev.washingDetails, option]
                        : prev.washingDetails.filter((o) => o !== option),
                    }));
                  }}
                />
                {option}
              </label>
            ))}
          </div>

          {/* Custom Washing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {product.washingDetails
              .filter((w) => !washingOptions.includes(w))
              .map((custom, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 bg-gray-50"
                >
                  <span className="truncate">{custom}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setProduct((prev) => ({
                        ...prev,
                        washingDetails: prev.washingDetails.filter((w) => w !== custom),
                      }))
                    }
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    X
                  </button>
                </div>
              ))}
          </div>


          {/* Input + Add Button */}
          <div className="flex items-center gap-2 mt-3 mb-3">
            <input
              type="text"
              placeholder="Add custom washing detail..."
              id="customWashingInput"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("customWashingInput");
                const newDetail = input.value.trim();
                if (newDetail && !product.washingDetails.includes(newDetail)) {
                  setProduct((prev) => ({
                    ...prev,
                    washingDetails: [...prev.washingDetails, newDetail],
                  }));
                  input.value = "";
                } else if (!newDetail) {
                  toast.error("Enter a washing detail before adding");
                } else {
                  toast.error("Already added");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>


        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            name="notes"
            value={product.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Enter any extra product notes, remarks or special instructions..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2 text-right">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-900 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-800"
          >
            {loading
              ? "Processing..."
              : selectedProduct
                ? "Update Product"
                : "Add Product"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddProducts;

