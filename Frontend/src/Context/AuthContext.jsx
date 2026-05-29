/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase";
import api from "../api";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
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
      const cartRef = collection(db, "users", user.uid, "cart");
      const wishlistRef = collection(db, "users", user.uid, "wishlist");

      const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCart(items);
      });

      const unsubscribeWishlist = onSnapshot(wishlistRef, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWishlist(items);
      });

      return () => {
        unsubscribeCart();
        unsubscribeWishlist();
      };
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [user]);

  useEffect(() => {
    // ✅ SUPER OPTIMIZED: Load only 100 products for speed
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc"),
      limit(100) // Reduced from 500 to 100 for faster loading
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const productList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const normalProducts = productList.filter((p) => p.ourDesign === false);
          const designProducts = productList.filter((p) => p.ourDesign === true);
          setProducts(normalProducts);
          setDesigns(designProducts);
        } catch (error) {
          console.error("Error processing products:", error);
        }
      },
      (error) => {
        console.error("Error listening to products:", error);
        // Fallback to empty data
        setProducts([]);
        setDesigns([]);
      }
    );

    return () => unsubscribe();
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

    const cartRef = doc(db, "users", user.uid, "cart", product.id);
    const cartSnap = await getDoc(cartRef);

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

    if (cartSnap.exists()) {
      const existingItem = cartSnap.data();
      const updatedQty = existingItem.quantity + quantity;
      await setDoc(cartRef, {
        ...existingItem,
        quantity: updatedQty,
      });
      toast.success("Cart updated");
    } else {
      await setDoc(cartRef, newItem);
    }
  };

  const removeFromCart = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cart", id));
    toast.info("Removed from cart");
  };

  const updateQuantity = async (id, size, qty) => {
    if (!user) return;
    const item = cart.find(
      (item) => item.id === id && item.selectedSize === size
    );
    if (item) {
      await setDoc(doc(db, "users", user.uid, "cart", id), {
        ...item,
        quantity: qty,
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const snapshot = await getDocs(collection(db, "users", user.uid, "cart"));

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(docSnap.ref)
    );
    await Promise.all(deletePromises);

    // toast.info("Cart cleared");
  };

  const addToWishlist = async (product) => {
    if (!user) return toast.error("Login required");

    const wishlistRef = doc(db, "users", user.uid, "wishlist", product.id);
    const wishlistSnap = await getDoc(wishlistRef);
    toast.success("Added to wishlist");

    if (wishlistSnap.exists()) {
      toast.info("Already in wishlist");
      return;
    }

    const newItem = {
      ...product,
      images: product.images ?? [],
      price: product.salePrice ?? 0,
    };

    await setDoc(wishlistRef, newItem);
  };

  const removeFromWishlist = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "wishlist", id));
    toast.info("Removed from wishlist");
  };

  const clearWishlist = async () => {
    if (!user) return;
    const snapshot = await getDocs(
      collection(db, "users", user.uid, "wishlist")
    );
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(docSnap.ref);
    });
    toast.info("Wishlist cleared");
  };

  const addAllWishlistToCart = async () => {
    if (!user) return;
    if (!wishlist.length) return toast.info("Wishlist is empty");
    for (let item of wishlist) {
      await addToCart(item);
    }
    toast.success("All wishlist items added to cart");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        registerUser: () => {},
        loginWithEmail,
        logout,
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
