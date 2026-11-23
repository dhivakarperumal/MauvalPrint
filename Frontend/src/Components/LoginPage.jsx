import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Login from "./Login";
import RegisterPage from "./Register";

const LoginPage = () => {
  const [showRegister, setShowRegister] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const stateFrom = location.state?.from;
  const statePath = typeof stateFrom === "string"
    ? stateFrom
    : stateFrom
      ? `${stateFrom.pathname || ""}${stateFrom.search || ""}${stateFrom.hash || ""}`
      : "";
  const queryPath = new URLSearchParams(location.search).get("redirect") || "";
  const requestedPath = statePath || queryPath;
  const returnPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";

  if (showRegister) {
    return (
      <RegisterPage
        onClose={() => setShowRegister(false)}
        onSwitch={() => setShowRegister(false)}
      />
    );
  }

  return (
    <Login
      onClose={() => navigate(returnPath, { replace: true })}
      onSwitch={() => setShowRegister(true)}
    />
  );
};

export default LoginPage;
