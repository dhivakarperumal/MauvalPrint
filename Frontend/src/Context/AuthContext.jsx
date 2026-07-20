/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

import api from "../api";

const API_USER_KEY = "apiUser";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedApiUser = localStorage.getItem(API_USER_KEY);
    return storedApiUser ? JSON.parse(storedApiUser) : null;
  });
  const [designs, setDesigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [logoCart, setLogoCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isOrderSidebarOpen, setOrderSidebarOpen] = useState(false);

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

      const fetchLogoCart = async () => {
        try {
          const { data } = await api.get(`/logo-cart/${user.uid}`);
          if (data.success) {
            setLogoCart(data.cart);
          }
        } catch (error) {
          console.error("Logo cart fetch error:", error);
          setLogoCart([]);
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
      fetchLogoCart();
      fetchWishlist();

      return () => {};
    } else {
      setCart([]);
      setLogoCart([]);
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

            // parse images_by_variant if present
            let parsedImagesByVariant = p.images_by_variant;
            if (typeof parsedImagesByVariant === 'string') {
              try { parsedImagesByVariant = JSON.parse(parsedImagesByVariant); } catch (e) { parsedImagesByVariant = {}; }
            }
            if (typeof parsedImagesByVariant !== 'object' || !parsedImagesByVariant) parsedImagesByVariant = {};

            // if images array empty, try to use first available images from variants
            let finalImages = parsedImages;
            if ((!Array.isArray(finalImages) || finalImages.length === 0) && Object.keys(parsedImagesByVariant).length > 0) {
              const flat = Object.values(parsedImagesByVariant).flat().filter(Boolean);
              if (flat.length > 0) finalImages = flat;
            }

            return {
              ...p,
              id: p.product_id || p.id,
              ourDesign: p.our_design == 1 || p.our_design === true || p.ourDesign === true,
              salePrice: p.sale_price || p.salePrice || 0,
              mrp: p.mrp || 0,
              images: finalImages,
              images_by_variant: parsedImagesByVariant,
              size: parsedSize,
              color: parsedColor,
              keywords: parsedKeywords,
              keyword: p.keyword || "Other",
              stockByVariant: parsedStockByVariant,
              sizeChartImage: p.sizeChartImage || p.size_chart_image || p.sizeChartImag || "",
              sizeChartImag: p.sizeChartImag || p.size_chart_image || p.sizeChartImage || "",
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
    const fetchReviews = async () => {
      try {
        const { data } = await api.get("/reviews");
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      }
    };

    fetchReviews();
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

  const loginWithIdentifier = async (identifier, password) => {
    const response = await api.post("/users/login", { identifier, password });
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

  const loginWithGoogle = async (idToken) => {
    if (!idToken) {
      throw new Error("Google login credential is missing.");
    }

    const response = await api.post(
      "/users/google-login",
      JSON.stringify({ idToken }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const apiUser = response.data?.data;
    if (!apiUser) {
      throw new Error("Google login failed.");
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

  const addToCart = async (product, quantity = 1, showToast = true) => {
    if (!user) {
      toast.error("Login required");
      return false;
    }

    const newItem = {
      id: product.id,
      name: product.name,
      images: product.images ?? [],
      price: product.salePrice ?? product.price ?? 0,
      quantity,
      selectedSize: product.selectedSize || "",
      selectedColor: product.selectedColor || "",
      customizedImage: product.customizedImage || "",
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
      if (showToast) toast.success("Added to cart");
      return true;
    } catch (err) {
      console.error("Add to cart failed:", err);
      if (showToast) toast.error("Failed to add to cart");
      return false;
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

  const addToLogoCart = async (logo, quantity = 1) => {
    if (!user) {
      toast.error("Login required");
      return false;
    }
    try {
      await api.post("/logo-cart/add", {
        user_id: user.uid,
        logo_id: logo.id,
        quantity,
        item_data: logo,
      });
      const { data } = await api.get(`/logo-cart/${user.uid}`);
      if (data.success) setLogoCart(data.cart);
      toast.success("Added to logo cart");
      return true;
    } catch (err) {
      console.error("Add to logo cart failed:", err);
      toast.error("Failed to add logo to cart");
      return false;
    }
  };

  const removeFromLogoCart = async (logo_id) => {
    if (!user) return;
    try {
      await api.delete(`/logo-cart/${user.uid}/${logo_id}`);
      const { data } = await api.get(`/logo-cart/${user.uid}`);
      if (data.success) setLogoCart(data.cart);
      toast.info("Removed from logo cart");
    } catch (err) {
      console.error("Remove from logo cart failed:", err);
    }
  };

  const updateLogoCartQuantity = async (logo_id, qty) => {
    if (!user) return;
    try {
      await api.patch("/logo-cart/update", {
        user_id: user.uid,
        logo_id,
        quantity: qty,
      });
      const { data } = await api.get(`/logo-cart/${user.uid}`);
      if (data.success) setLogoCart(data.cart);
    } catch (err) {
      console.error("Update logo cart quantity failed:", err);
    }
  };

  const clearLogoCart = async () => {
    if (!user) return;
    try {
      for (const item of logoCart) {
        await api.delete(`/logo-cart/${user.uid}/${item.id}`);
      }
      setLogoCart([]);
    } catch (err) {
      console.error("Clear logo cart failed:", err);
    }
  };

  const addToWishlist = async (product) => {
    if (!user) return toast.error("Login required");

    const productId = product?.id || product?.product_id || product?.productId;
    const alreadyWishlisted = wishlist.some((item) => {
      const itemId = item?.id || item?.product_id || item?.productId;
      return itemId === productId;
    });

    if (alreadyWishlisted) {
      return toast.info("Product already in wishlist");
    }

    try {
      const { data } = await api.post("/wishlist/add", {
        user_id: user.uid,
        product_id: productId,
        item_data: product,
      });

      if (data.success) {
        setWishlist((prev) => [...prev, { ...product, id: productId }]);
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
      await addToCart(item, 1, false);
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
        setUser,
        registerUser: () => { },
        loginWithIdentifier,
        loginWithGoogle,
        logout,
        updateUserProfile,
        designs,
        products,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        logoCart,
        addToLogoCart,
        removeFromLogoCart,
        updateLogoCartQuantity,
        clearLogoCart,
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
