import React, { createContext, useState, useEffect } from "react";
import api from "../api";

const API_USER_KEY = "apiUser";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(API_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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

    setUser(normalizedUser);
    localStorage.setItem(API_USER_KEY, JSON.stringify(normalizedUser));
    return normalizedUser;
  };

  const loginWithGoogle = async () => {
    throw new Error("Google login is not supported. Please use email and password.");
  };

  const logout = async () => {
    localStorage.removeItem(API_USER_KEY);
    setUser(null);
  };

  const resetPassword = async () => {
    throw new Error("Password reset is not supported yet.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
