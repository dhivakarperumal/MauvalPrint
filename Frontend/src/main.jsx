import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";
import { AuthProvider } from "./Context/AuthContext";
import Home from "./Home/Home.jsx";
import Designs from "./Products/Desgins.jsx";
import DesignDetails from "./Products/DesignDetails.jsx";
import CartSidebar from "./Products/CartSidebar.jsx";
import Wishlist from "./Products/Wishlist.jsx";
import Products from "./Products/Products.jsx";
import Checkout from "./Products/Checkout.jsx";

import Account from "./Components/Account.jsx";
import SingleProductView from "./Products/SingleProductView.jsx";
import Orders from "./Products/Orders.jsx";

import Adminpanel from "./Admin/Adminpanel.jsx";
import FlimLogoPrint from "./Products/FlimLogoPrint.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import Login from "./Components/Login.jsx";
import Register from "./Components/Register.jsx";
import CustomizerLayout from "./Customizer/CustomizerLayout.jsx";

// Import Hot Toast
import { Toaster } from "react-hot-toast";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/designs", element: <Designs /> },
      { path: "/designdetails/:productId", element: <DesignDetails /> },
      { path: "/products", element: <Products /> },
      { path: "/products/:categorys", element: <Products /> },
      { path: "/productdetails/:id", element: <SingleProductView /> },
      {
        path: "/cart",
        element: (
          <PrivateRoute>
            <CartSidebar />
          </PrivateRoute>
        ),
      },
      {
        path: "/wishlist",
        element: (
          <PrivateRoute>
            <Wishlist />
          </PrivateRoute>
        ),
      },
      {
        path: "/checkout",
        element: (
          <PrivateRoute>
            <Checkout />
          </PrivateRoute>
        ),
      },

      {
        path: "/account",
        element: (
          <PrivateRoute>
            <Account />
          </PrivateRoute>
        ),
      },
      {
        path: "/orders",
        element: (
          <PrivateRoute>
            <Orders />
          </PrivateRoute>
        ),
      },
     
     
    ],
  },
  {
    path: "/admin",
    element: (
      <PrivateRoute>
        <Adminpanel />
      </PrivateRoute>
    ),
  },
  {
    path: "/customizer/:productId",
    element: (
      <PrivateRoute>
        <CustomizerLayout />
      </PrivateRoute>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      {/* Add Toaster at the top level */}
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
