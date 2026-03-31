// src/Admin/AdminHub.jsx
import React, { useState } from "react";
import SigImageAdminPage from "./SigImageAdminPage";
import SigResourceAdminPage from "./SigResourceAdminPage";
// 필요하면 다른 Admin 페이지도 import

export default function AdminHub() {
  const [tab, setTab] = useState("cards"); // "cards" | "resources" ...

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "24px 12px 40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1080,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.98))",
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.5)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.9)",
          padding: 20,
          color: "#e5e7eb",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              🛠 관리 센터
            </h1>
            <p style={{ marginTop: 4, fontSize: 13, color: "#9ca3af" }}>
              게임 카드와 공통 리소스를 한 곳에서 관리합니다.
            </p>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setTab("cards")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border:
                tab === "cards" ? "2px solid #22c55e" : "1px solid #4b5563",
              background:
                tab === "cards"
                  ? "linear-gradient(135deg, #22c55e, #bbf7d0)"
                  : "linear-gradient(135deg, #0f172a, #020617)",
              color: tab === "cards" ? "#022c22" : "#e5e7eb",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            🃏 시그 카드 관리
          </button>

          <button
            type="button"
            onClick={() => setTab("resources")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border:
                tab === "resources" ? "2px solid #38bdf8" : "1px solid #4b5563",
              background:
                tab === "resources"
                  ? "linear-gradient(135deg, #38bdf8, #bfdbfe)"
                  : "linear-gradient(135deg, #0f172a, #020617)",
              color: tab === "resources" ? "#0f172a" : "#e5e7eb",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            📁 리소스 관리 (이미지)
          </button>

          {/* 필요하면 다른 Admin 탭도 여기에 추가 */}
        </div>

        {/* 탭 내용 */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(55,65,81,0.9)",
            background: "rgba(15,23,42,0.9)",
            overflow: "hidden",
          }}
        >
          {tab === "cards" && <SigImageAdminPage />}
          {tab === "resources" && <SigResourceAdminPage />}
        </div>
      </div>
    </div>
  );
}         