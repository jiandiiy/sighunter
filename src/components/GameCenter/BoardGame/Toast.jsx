// src/components/GameCenter/BoardGame/Toast.jsx
import React from "react";

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "rgba(15,23,42,0.95)",
        borderRadius: 10,
        border: "1px solid rgba(250,204,21,0.9)",
        padding: "8px 12px",
        color: "#fefce8",
        fontSize: 13,
        boxShadow: "0 0 18px rgba(250,204,21,0.8)",
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
}