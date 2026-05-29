import React, { useEffect, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaDownload, FaFilter, FaStar, FaPlus } from "react-icons/fa";
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import * as XLSX from "xlsx";

const ProductList = ({ setSelectedProduct, setActiveTab }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [modalType, setModalType] = useState("");
  const [selectedProductLocal, setSelectedProductLocal] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxProductPrice, setMaxProductPrice] = useState(1000);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [selectedOfferRange, setSelectedOfferRange] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 40;

  useEffect(() => {
    const savedPage = localStorage.getItem('productsCurrentPage');
    if (savedPage && !isNaN(parseInt(savedPage, 10))) {
      setCurrentPage(parseInt(savedPage, 10));
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('productsCurrentPage', currentPage);
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) =>
        (a.id || "").localeCompare(b.id || "", undefined, { numeric: true })
      );
      setProducts(data);

      const uniqueCategories = [...new Set(data.map((p) => p.category).filter(Boolean))];
      setCategoryOptions(uniqueCategories);

      const maxPriceValue = Math.max(...data.map((p) => p.salePrice || p.mrp || 0));
      setMaxProductPrice(maxPriceValue);
      setPriceRange([0, maxPriceValue]);
    } catch (error) {
      toast.error("Failed to load products.");
      console.error(error);
    }
  };

  const handleView = (product) => {
    setSelectedProductLocal(product);
    setModalType("view");
  };

  const handleEdit = async (product) => {
    try {
      const docRef = doc(db, "products", product.docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const fullProduct = { ...docSnap.data(), docId: docSnap.id };
        setSelectedProduct(fullProduct);
        setActiveTab("addProduct");
      } else {
        toast.error("Product not found");
      }
    } catch (error) {
      toast.error("Error loading product");
      console.error(error);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const toastId = toast.loading("Deleting...");
      await deleteDoc(doc(db, "products", docId));
      toast.success("Deleted!", { id: toastId });
      fetchProducts();
    } catch (error) {
      toast.error("Delete failed.");
      console.error(error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const confirmImport = window.confirm(
        `Are you sure you want to import ${jsonData.length} products?`
      );
      if (!confirmImport) return;

      const batchAdd = jsonData.map(async (item, index) => {
        const baseId = item.id?.startsWith("MP") ? item.id : `MP${Date.now()}${index}`;
        const images = item.images ? item.images.split(",").map((img) => img.trim()) : [];

        const compressedImages = await Promise.all(
          images.map(async (img) => {
            if (img.startsWith("data:image")) {
              try {
                const fileBlob = await (await fetch(img)).blob();
                const compressed = await imageCompression(fileBlob, {
                  maxSizeMB: 0.2,
                  maxWidthOrHeight: 800,
                  useWebWorker: true,
                });
                return await convertToBase64(compressed);
              } catch {
                return img;
              }
            }
            return img;
          })
        );

        const stock =
          item.stock && typeof item.stock === "string"
            ? item.stock.split(",").reduce((acc, variant) => {
                const [key, value] = variant.split(":");
                if (key && value) acc[key.trim()] = parseInt(value.trim());
                return acc;
              }, {})
            : {};

        const product = {
          id: baseId,
          name: item.name || "",
          category: item.category || "",
          brand: item.brand || "",
          mrp: Number(item.mrp) || 0,
          salePrice: Number(item.salePrice) || 0,
          offer: Number(item.offer) || 0,
          rating: Number(item.rating) || 0,
          description: item.description || "",
          fabricDetails: item.fabricDetails || "",
          color: item.color || "",
          ourDesign: item.ourDesign?.toString().toLowerCase() === "yes",
          images: compressedImages,
          stock,
          createdAt: new Date(),
        };

        const docRef = doc(db, "products", baseId);
        await setDoc(docRef, product);
      });

      await Promise.all(batchAdd);
      toast.success("Products imported successfully!");
      fetchProducts();
    } catch (err) {
      console.error("Excel upload error:", err);
      toast.error("Failed to import products.");
    }
  };

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory.length === 0 || selectedCategory.includes(p.category);

    const productPrice = p.salePrice > 0 ? p.salePrice : p.mrp;
    const matchesPrice =
      productPrice >= priceRange[0] && productPrice <= priceRange[1];

    const matchesRating =
      selectedRatings.length === 0 || selectedRatings.includes(Math.floor(p.rating));

    const matchesOffer = onlyOffers ? p.offer > 0 : true;

    // Check fixed offer range
    let matchesOfferRange = true;
    if (selectedOfferRange) {
      const [min, max] = selectedOfferRange.split("-").map(Number);
      matchesOfferRange = p.offer >= min && p.offer <= max;
    }

    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesOffer && matchesOfferRange;
  });

  // Pagination logic
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts, currentPage, productsPerPage]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen relative">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4 md:gap-0">
  {/* Title */}
 <div>
   <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
    Product List
  </h2>
  <p className="text-gray-600">Manage your uploaded product designs here.</p>
 </div>

  {/* Buttons */}
  <div className="flex flex-wrap gap-2 justify-start md:justify-end">
    <button
      onClick={() => setActiveTab("addProduct")}
      className="px-4  cursor-pointer md:px-6 bg-blue-900 text-white rounded py-2 flex items-center justify-center gap-2 hover:bg-blue-800"
    >
      <FaPlus /> Add Products
    </button>

   

    <button
      onClick={() => setShowFilter(!showFilter)}
      className="px-4  cursor-pointer md:px-6 bg-blue-900 text-white rounded py-2 flex items-center justify-center gap-2 hover:bg-blue-800"
    >
      <FaFilter /> Filter
    </button>
  </div>
</div>


      <div className="flex gap-4 mt-10">
        {/* Filter Panel */}
        {showFilter && (
          <div className="w-64 bg-white p-4 rounded shadow space-y-4 flex-shrink-0">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border  cursor-pointer border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="space-y-2">
              <p className="font-semibold">Categories:</p>
              {categoryOptions.map((cat, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={cat}
                    checked={selectedCategory.includes(cat)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        setSelectedCategory([...selectedCategory, cat]);
                      } else {
                        setSelectedCategory(selectedCategory.filter((c) => c !== cat));
                      }
                    }}
                    className="h-4 w-4  cursor-pointer text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">{cat}</span>
                </label>
              ))}
            </div>

            {/* Price Range Slider */}
            <div className="space-y-2">
              <p className="font-semibold">
                Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
              </p>
              <input
                type="range"
                min={0}
                max={maxProductPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full"
              />
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <p className="font-semibold">Rating:</p>
              {[5, 4, 3, 2, 1].map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={r}
                    checked={selectedRatings.includes(r)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        setSelectedRatings([...selectedRatings, r]);
                      } else {
                        setSelectedRatings(selectedRatings.filter((x) => x !== r));
                      }
                    }}
                    className="h-4 w-4  cursor-pointer text-blue-600 border-gray-300 rounded"
                  />
                  <span>{r} <FaStar className="inline text-yellow-500" /></span>
                </label>
              ))}
            </div>

            {/* Offer Fixed Ranges */}
            <div className="space-y-2">
              <p className="font-semibold">Offer Range:</p>
              {["10-30", "30-40", "50-80"].map((range) => (
                <label key={range} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="offerRange"
                    value={range}
                    checked={selectedOfferRange === range}
                    onChange={(e) => setSelectedOfferRange(e.target.value)}
                    className="h-4 w-4  cursor-pointer text-blue-600 border-gray-300 rounded"
                  />
                  <span>{range}%</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory([]);
                  setPriceRange([0, maxProductPrice]);
                  setSelectedRatings([]);
                  setOnlyOffers(false);
                  setSelectedOfferRange("");
                }}
                className="flex-1  cursor-pointer bg-gray-200 rounded py-2 hover:bg-gray-300"
              >
                Reset
              </button>
              <input
                type="file"
                accept=".xlsx, .xls"
                id="fileUpload"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentProducts.map((p) => (
            <div key={p.docId} className="bg-white rounded shadow p-4 flex flex-col gap-2">
              <img
                src={p.images?.[0] || "https://via.placeholder.com/150"}
                alt={p.name}
                className="w-full h-32 object-cover rounded"
              />
              <p className="font-semibold text-gray-800">{p.name}</p>
              <p className="text-sm text-gray-600">ID: {p.id}</p>
              <p className="text-sm text-gray-600">Category: {p.category}</p>
              
              <div className=" flex justify-between">
                <p className="text-sm text-gray-600 line-through ">MRP ₹  {p.mrp}   </p>
              <p className="text-sm text-gray-600 font-bold">Selling ₹ {p.salePrice}</p>
              </div>
              
              {p.offer > 0 && (
                <p className="text-sm text-red-600 font-semibold">Offer: {p.offer}%</p>
              )}
              <div className="flex justify-between gap-2 mt-2">
                <button
                  onClick={() => handleView(p)}
                  className=" border  cursor-pointer border-gray-300 px-2 py-2 rounded-full hover:text-blue-600 text-center"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => handleEdit(p)}
                  className="border  cursor-pointer border-gray-300 px-2 py-2 rounded-full hover:text-yellow-600 text-center"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(p.docId)}
                  className="border  cursor-pointer border-gray-300 px-2 py-2 rounded-full hover:text-red-600 text-center"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        {Array.from({ length: totalPages }, (_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1  cursor-pointer rounded border border-gray-300 ${
              currentPage === idx + 1 ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Modal */}
      {modalType === "view" && selectedProductLocal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-4xl relative overflow-y-auto max-h-[100vh]">
            <button
              onClick={() => {
                setModalType("");
                setSelectedProductLocal(null);
              }}
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-blue-900 mb-4">View Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {selectedProductLocal.id}</p>
                <p><strong>Name:</strong> {selectedProductLocal.name}</p>
                <p><strong>Category:</strong> {selectedProductLocal.category}</p>
                <p><strong>MRP:</strong> ₹{selectedProductLocal.mrp}</p>
                <p><strong>Sale Price:</strong> ₹{selectedProductLocal.salePrice}</p>
                <p><strong>Offer:</strong> {selectedProductLocal.offer}%</p>
                <p><strong>Rating:</strong> {selectedProductLocal.rating}</p>
                <p><strong>Description:</strong> {selectedProductLocal.description}</p>
                <p><strong>Fabric:</strong> {selectedProductLocal.fabricDetails}</p>
                <p><strong>Colors:</strong> {selectedProductLocal.color}</p>
                <p><strong>Our Design:</strong> {selectedProductLocal.ourDesign ? "Yes" : "No"}</p>
              </div>
              <div>
                <strong>Images:</strong>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedProductLocal.images?.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`product-${idx}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
