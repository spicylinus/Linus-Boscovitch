import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Onboard } from "./pages/Onboard.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Approve } from "./pages/Approve.js";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/approve/:token" element={<Approve />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
