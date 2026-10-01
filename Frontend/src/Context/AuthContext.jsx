/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

import api, { API_URL } from "../api";
import normalizeRealtimeProduct from "../utils/normalizeRealtimeProduct";

const API_USER_KEY = "apiUser";

const getCollectionItemId = (item) =>
  item?.id || item?.product_id || item?.productId || item?.user_id || item?.order_id || item?.orderID;

const upsertById = (items, id, data) => {
  const index = items.findIndex((item) => String(getCollectionItemId(item)) === String(id));
  if (index === -1) return [{ ...data, id }, ...items];
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...data, id } : item
  );
};

const sameCartVariant = (item, id, data) =>
  String(getCollectionItemId(item)) === String(id) &&
  (item.selectedSize || item.size || "") === (data.selectedSize || data.size || "") &&
  (item.selectedColor || item.color || "") === (data.selectedColor || data.color || "") &&
  (item.selectedVariant || item.variant || "") === (data.selectedVariant || data.variant || "");

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isOrderSidebarOpen, setOrderSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketToken, setSocketToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    if (!user?.uid || !socketToken) {
      setSocket(null);
      return undefined;
    }

    const socketOrigin = new URL(API_URL, window.location.origin).origin;
    const realtimeSocket = io(socketOrigin, {
      path: "/socket.io",
      auth: { token: socketToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    setSocket(realtimeSocket);

    const handleConnectError = (error) => {
      console.error("Realtime connection error:", error.message);
    };
    realtimeSocket.on("connect_error", handleConnectError);

    return () => {
      realtimeSocket.off("connect_error", handleConnectError);
      realtimeSocket.disconnect();
    };
  }, [user?.uid, socketToken]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleDataChange = (event) => {
      const id = event.id || getCollectionItemId(event.data);
      if (!id) return;
      const incoming = event.data || {};

      if (event.resource === "products") {
        const product = normalizeRealtimeProduct(incoming, id);
        const isDesign = product.ourDesign === true || product.our_design === true || Number(product.our_design) === 1;
        setProducts((items) => event.action === "deleted" || isDesign
          ? items.filter((item) => String(getCollectionItemId(item)) !== String(id))
          : upsertById(items, id, product));
        setDesigns((items) => event.action === "deleted" || !isDesign
          ? items.filter((item) => String(getCollectionItemId(item)) !== String(id))
          : upsertById(items, id, product));
      } else if (event.resource === "reviews") {
        setReviews((items) =>
          event.action === "deleted"
            ? items.filter((item) => String(getCollectionItemId(item)) !== String(id))
            : upsertById(items, id, incoming)
        );
      } else if (event.resource === "cart") {
        const itemData = incoming.item_data || incoming;
        const item = {
          ...itemData,
          id,
          selectedSize: itemData.selectedSize || incoming.selectedSize || "",
          selectedColor: itemData.selectedColor || incoming.selectedColor || incoming.selected_color || "",
          selectedVariant: itemData.selectedVariant || incoming.selectedVariant || incoming.variant || "",
          quantity: Number(incoming.quantity ?? itemData.quantity ?? 1),
        };
        setCart((items) => {
          const index = items.findIndex((current) => sameCartVariant(current, id, item));
          if (event.action === "deleted") {
            return items.filter((current) => {
              if (String(getCollectionItemId(current)) !== String(id)) return true;
              const query = event.query || {};
              return (current.selectedSize || "") !== (query.size || "") ||
                (current.selectedColor || "") !== (query.color || "") ||
                (current.selectedVariant || current.variant || "") !== (query.variant || "");
            });
          }
          if (index === -1) return [item, ...items];
          return items.map((current, currentIndex) => {
            if (currentIndex !== index) return current;
            const quantity = event.action === "created"
              ? Number(current.quantity || 0) + item.quantity
              : item.quantity;
            return { ...current, ...item, quantity };
          });
        });
      } else if (event.resource === "wishlist" || event.resource === "logoCart") {
        const setter = event.resource === "wishlist" ? setWishlist : setLogoCart;
        if (event.data?.clearAll) {
          setter([]);
          return;
        }
        setter((items) =>
          event.action === "deleted"
            ? items.filter((item) => String(getCollectionItemId(item)) !== String(id))
            : upsertById(items, id, incoming.item_data || incoming)
        );
      }
    };

    socket.on("data:created", handleDataChange);
    socket.on("data:updated", handleDataChange);
    socket.on("data:deleted", handleDataChange);
    return () => {
      socket.off("data:created", handleDataChange);
      socket.off("data:updated", handleDataChange);
      socket.off("data:deleted", handleDataChange);
    };
  }, [socket]);

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
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      setSocketToken(response.data.token);
    }
    setLoggedIn(normalizedUser);
    localStorage.setItem(API_USER_KEY, JSON.stringify(normalizedUser));
    return normalizedUser;
  };

<<<<<<< Updated upstream
=======
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
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      setSocketToken(response.data.token);
    }
    setLoggedIn(normalizedUser);
    localStorage.setItem(API_USER_KEY, JSON.stringify(normalizedUser));
    return normalizedUser;
  };

>>>>>>> Stashed changes
  const logout = async () => {
    localStorage.removeItem(API_USER_KEY);
    localStorage.removeItem("token");
    setSocketToken(null);
    setLoggedIn(null);
  };

  const addToCart = async (product, quantity = 1) => {
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
      toast.success("Added to cart");
      return true;
    } catch (err) {
      console.error("Add to cart failed:", err);
      toast.error("Failed to add to cart");
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
        socket,
        setUser,
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
