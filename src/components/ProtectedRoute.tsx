import React, { type JSX } from "react"; // ← add this line
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../auth";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
