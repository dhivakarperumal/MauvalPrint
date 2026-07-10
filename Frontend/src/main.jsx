import React from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
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
import Dashboard from "./Admin/Dashboard.jsx";
import AllProducts from "./Admin/Products/Products.jsx";
import AddProducts from "./Admin/Products/AddProducts.jsx";
import ProductDetail from "./Admin/Products/ProductDetail.jsx";
import OurDesings from "./Admin/Products/OurDesings.jsx";
import ProductKeywords from "./Admin/Products/ProductKeywords.jsx";
import NewOrders from "./Admin/Orders/NewOrders.jsx";
import AllOrders from "./Admin/Orders/AllOrders.jsx";
import ProccesingOrders from "./Admin/Orders/ProccesingOrders.jsx";
import DeliveryOrders from "./Admin/Orders/DeliveryOrders.jsx";
import CancelOrders from "./Admin/Orders/CancleOrders.jsx";
import AddUser from "./Admin/Users/AddUser.jsx";
import NewUsers from "./Admin/Users/NewUsers.jsx";
import OldUsers from "./Admin/Users/OldUsers.jsx";
import AddStock from "./Admin/Stock/AddStock.jsx";
import StockDetails from "./Admin/Stock/StockDetails.jsx";
import Billing from "./Admin/Billing.jsx";
import Reviews from "./Admin/Reviews.jsx";
import Category from "./Admin/Categorey.jsx";
import Invoice from "./Admin/Invoice.jsx";
import Dealers from "./Admin/Delears.jsx";
import Profile from "./Admin/Profile/Profile.jsx";
import GetOrdersDetails from "./Admin/GetOrdersDetails.jsx";
import VideoManagement from "./Admin/VideoManagement.jsx";
import FlimLogoPrint from "./Products/FlimLogoPrint.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import Login from "./Components/Login.jsx";
import Register from "./Components/Register.jsx";
import CustomizerLayout from "./Customizer/CustomizerLayout.jsx";

// Import Hot Toast
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

const router = createHashRouter(
  [
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
    children: [
      { index: true, element: <Dashboard /> },
      { path: "products", element: <AllProducts /> },
      { path: "products/:id", element: <AllProducts /> },
      { path: "productdetail/:id", element: <ProductDetail /> },
      { path: "addproducts", element: <AddProducts /> },
      { path: "addproducts/:id", element: <AddProducts /> },
      { path: "category", element: <Category /> },
      { path: "productkeywords", element: <ProductKeywords /> },
      { path: "ourdesigns", element: <OurDesings /> },
      { path: "neworders", element: <NewOrders /> },
      { path: "allorders", element: <AllOrders /> },
      { path: "processingorders", element: <ProccesingOrders /> },
      { path: "deliveryorders", element: <DeliveryOrders /> },
      { path: "cancelorders", element: <CancelOrders /> },
      { path: "users", element: <OldUsers /> },
      { path: "newusers", element: <NewUsers /> },
      { path: "adduser", element: <AddUser /> },
      { path: "stockdetails", element: <StockDetails /> },
      { path: "addstock", element: <AddStock /> },
      { path: "billing", element: <Billing /> },
      { path: "reviews", element: <Reviews /> },
      { path: "dealers", element: <Dealers /> },
      { path: "invoice", element: <Invoice /> },
      { path: "profile", element: <Profile /> },
      { path: "getorders", element: <GetOrdersDetails /> },
      { path: "videomanagement", element: <VideoManagement /> },
    ]
  },
  {
    path: "/customizer/:productId",
    element: (
      <PrivateRoute>
        <CustomizerLayout />
      </PrivateRoute>
    ),
  },
]
);

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const appRoot = (
  <React.StrictMode>
    <AuthProvider>
      {/* Add Toaster at the top level */}
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

createRoot(document.getElementById("root")).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {appRoot}
    </GoogleOAuthProvider>
  ) : (
    appRoot
  )
);
