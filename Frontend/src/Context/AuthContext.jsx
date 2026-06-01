/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase";
import api from "../api";
import { collection, onSnapshot } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage();
const API_USER_KEY = "apiUser";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isOrderSidebarOpen, setOrderSidebarOpen] = useState(false);

  useEffect(() => {
    const storedApiUser = localStorage.getItem(API_USER_KEY);
    if (storedApiUser) {
      setUser(JSON.parse(storedApiUser));
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const fetchCart = async () => {
        try {
          const { data } = await api.get(`/cart/${user.uid}`);
          if (data.success) {
            setCart(data.cart);
          }
        } catch (error) {
          console.error("Cart fetch error:", error);
          setCart([]);
        }
      };

      const fetchWishlist = async () => {
        try {
          const { data } = await api.get(`/wishlist/${user.uid}`);

          if (data.success) {
            setWishlist(data.wishlist);
          }
        } catch (error) {
          console.error("Wishlist fetch error:", error);
        }
      };

      fetchCart();
      fetchWishlist();

      return () => {};
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products');
        if (data && data.products) {
          const productList = data.products.map(p => {
            // safely parse JSON fields if they are strings
            let parsedImages = p.images;
            if (typeof parsedImages === 'string') {
              try { parsedImages = JSON.parse(parsedImages); } catch (e) { parsedImages = []; }
            }
            if (!Array.isArray(parsedImages)) parsedImages = [];

            let parsedSize = p.size;
            if (typeof parsedSize === 'string') {
              try { parsedSize = JSON.parse(parsedSize); } catch (e) { parsedSize = []; }
            }
            if (!Array.isArray(parsedSize)) parsedSize = [];

            let parsedColor = p.color;
            if (typeof parsedColor === 'string') {
              try { parsedColor = JSON.parse(parsedColor); } catch (e) { parsedColor = []; }
            }
            if (!Array.isArray(parsedColor)) parsedColor = [];

            let parsedKeywords = p.keywords;
            if (typeof parsedKeywords === 'string') {
              try { parsedKeywords = JSON.parse(parsedKeywords); } catch (e) { parsedKeywords = []; }
            }
            if (!Array.isArray(parsedKeywords)) parsedKeywords = [];

            let parsedStockByVariant = p.stock_by_variant;
            if (typeof parsedStockByVariant === 'string') {
              try { parsedStockByVariant = JSON.parse(parsedStockByVariant); } catch (e) { parsedStockByVariant = {}; }
            }
            if (typeof parsedStockByVariant !== 'object' || !parsedStockByVariant) parsedStockByVariant = {};

            return {
              ...p,
              id: p.product_id || p.id,
              ourDesign: p.our_design == 1 || p.our_design === true || p.ourDesign === true,
              salePrice: p.sale_price || p.salePrice || 0,
              mrp: p.mrp || 0,
              images: parsedImages,
              size: parsedSize,
              color: parsedColor,
              keywords: parsedKeywords,
              keyword: p.keyword || "Other",
              stockByVariant: parsedStockByVariant
            };
          });

          const normalProducts = productList.filter((p) => !p.ourDesign);
          const designProducts = productList.filter((p) => p.ourDesign);
          setProducts(normalProducts);
          setDesigns(designProducts);
        }
      } catch (error) {
        console.error("Error fetching products from MySQL:", error);
        setProducts([]);
        setDesigns([]);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "reviews"),
      (snapshot) => {
        const reviewList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(reviewList);
      },
      (error) => {
        console.error("Error listening to reviews:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const setLoggedIn = (u) => {
    if (u) {
      setUser(u);
      window.dispatchEvent(new Event("login"));
    } else {
      setUser(null);
      window.dispatchEvent(new Event("logout"));
      toast.info("Logged out");
    }
  };

  const loginWithEmail = async (email, password) => {
    const response = await api.post("/login", { email, password });
    const apiUser = response.data?.data;
    if (!apiUser) {
      throw new Error("Login failed");
    }
    const normalizedUser = {
      ...apiUser,
      uid: apiUser.user_id || apiUser.uid,
    };
    setLoggedIn(normalizedUser);
    localStorage.setItem(API_USER_KEY, JSON.stringify(normalizedUser));
    return normalizedUser;
  };

  const logout = async () => {
    localStorage.removeItem(API_USER_KEY);
    setLoggedIn(null);
  };

  const addToCart = async (product, quantity = 1) => {
    if (!user) return toast.error("Login required");
    let customizedImageUrl = product.customizedImage;
    toast.success("Added to cart");
    if (
      product.customizedImage &&
      product.customizedImage.startsWith("data:image/")
    ) {
      try {
        const imageRef = storageRef(
          storage,
          `customized/${user.uid}/${product.id}_${Date.now()}.png`
        );
        await uploadString(imageRef, product.customizedImage, "data_url");
        customizedImageUrl = await getDownloadURL(imageRef);
      } catch (err) {
        console.error("Image upload failed:", err);
        toast.error("Failed to upload custom image");
        return;
      }
    }

    const newItem = {
      id: product.id,
      name: product.name,
      images: product.images ?? [],
      price: product.salePrice ?? product.price ?? 0,
      quantity,
      selectedSize: product.selectedSize || "",
      selectedColor: product.selectedColor || "",
      customizedImage: customizedImageUrl || "",
    };

    try {
      await api.post("/cart/add", {
        user_id: user.uid,
        product_id: product.id,
        quantity,
        item_data: newItem,
      });

      // refresh cart from server
      const { data } = await api.get(`/cart/${user.uid}`);
      if (data.success) setCart(data.cart);
      toast.success("Added to cart");
    } catch (err) {
      console.error("Add to cart failed:", err);
      toast.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (id, size = "", color = "") => {
    if (!user) return;
    try {
      const q = `?size=${encodeURIComponent(size || '')}&color=${encodeURIComponent(color || '')}`;
      await api.delete(`/cart/${user.uid}/${id}${q}`);
      const { data } = await api.get(`/cart/${user.uid}`);
      if (data.success) setCart(data.cart);
      toast.info("Removed from cart");
    } catch (err) {
      console.error("Remove from cart failed:", err);
    }
  };

  const updateQuantity = async (id, size, qty) => {
    if (!user) return;
    const item = cart.find((item) => item.id === id && item.selectedSize === size);
    if (!item) return;

    try {
      await api.patch('/cart/update', {
        user_id: user.uid,
        product_id: id,
        selectedSize: size,
        quantity: qty,
      });

      const { data } = await api.get(`/cart/${user.uid}`);
      if (data.success) setCart(data.cart);
    } catch (err) {
      console.error("Update quantity failed:", err);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      // delete each cart item via API with variant query
      for (const item of cart) {
        const q = `?size=${encodeURIComponent(item.selectedSize || '')}&color=${encodeURIComponent(item.selectedColor || '')}`;
        await api.delete(`/cart/${user.uid}/${item.id}${q}`);
      }
      setCart([]);
    } catch (err) {
      console.error("Clear cart failed:", err);
    }
  };

  const addToWishlist = async (product) => {
    if (!user) return toast.error("Login required");

    try {
      const { data } = await api.post("/wishlist/add", {
        user_id: user.uid,
        product_id: product.id,
        item_data: product,
      });

      if (data.success) {
        setWishlist((prev) => [...prev, product]);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add wishlist");
    }
  };

  const removeFromWishlist = async (id) => {
    if (!user) return;

    try {
      await api.delete(`/wishlist/${user.uid}/${id}`);

      setWishlist((prev) =>
        prev.filter((item) => item.id !== id)
      );

      toast.info("Removed from wishlist");
    } catch (error) {
      console.error(error);
    }
  };

  const clearWishlist = async () => {
    if (!user) return;

    try {
      await api.delete(`/wishlist/clear/${user.uid}`);

      setWishlist([]);

      toast.info("Wishlist cleared");
    } catch (error) {
      console.error(error);
    }
  };

  const addAllWishlistToCart = async () => {
    if (!user) return;
    if (!wishlist.length) return toast.info("Wishlist is empty");
    for (let item of wishlist) {
      await addToCart(item);
    }
    toast.success("All wishlist items added to cart");
  };

  const updateUserProfile = (updates) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(API_USER_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        registerUser: () => { },
        loginWithEmail,
        logout,
        updateUserProfile,
        designs,
        products,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        addAllWishlistToCart,
        isOrderSidebarOpen,
        setOrderSidebarOpen,
        reviews,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
