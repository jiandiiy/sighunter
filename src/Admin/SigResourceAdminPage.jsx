// src/components/GameCenter/Admin/SigResourceAdminPage.jsx

import React, { useEffect, useState } from "react";
import {
  listResources,
  uploadResource,
  deleteResource,
} from "../../../api/sigResourceStorage";

// 직원이 선택할 수 있는 카테고리 목록
const RESOURCE_CATEGORIES = [
  { value: "bingo",      label: "식대전/시그헌터 빙고" },
  { value: "hpbattle",   label: "HP 배틀" },
  { value: "boardgame",  label: "보드게임" },
  { value: "bigwheel",   label: "빅휠" },
  { value: "flip",       label: "카드 뒤집기" },
  { value: "common",     label: "공용 이미지" },
];

const labelStyle = {
  display: "block",
  marginBottom: 4,
  fontSize: 13,
  color: "#cbd5e1",
};

const selectStyle = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: 13,
  outline: "none",
};

export default function SigResourceAdminPage() {
  const [category, setCategory] = useState("bingo");
  const [items, setItems] = useState([]); // [{fileName, url}]
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ─ 메시지/에러 3초 후 자동 삭제 ─
  useEffect(() => {
    if (!error && !message) return;
    const t = setTimeout(() => {
      setError("");
      setMessage("");
    }, 3000);
    return () => clearTimeout(t);
  }, [error, message]);

  // ─ 목록 로딩 ─
  const load = async (cat = category) => {
    try {
      setLoading(true);
      setError("");
      const list = await listResources(cat);
      setItems(list);
    } catch (e) {
      console.error(e);
      setError("파일 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // ─ 업로드 ─
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        await uploadResource(category, file);
      }
      setMessage("업로드가 완료되었습니다.");
      await load();
      e.target.value = ""; // 같은 파일 재업로드 허용
    } catch (err) {
      console.error(err);
      setError("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // ─ 삭제 ─
  const handleDelete = async (fileName) => {
    if (!window.confirm(`정말 삭제하시겠습니까?\n(${fileName})`)) return;

    try {
      setError("");
      await deleteResource(category, fileName);
      setMessage("삭제가 완료되었습니다.");
      await load();
    } catch (err) {
      console.error(err);
      setError("삭제 중 오류가 발생했습니다.");
    }
  };

  // ─ 렌더링 ─
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
          maxWidth: 960,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.98))",
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.5)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.9)",
          padding: 24,
          color: "#e5e7eb",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
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
              📁 리소스 관리 (이미지)
            </h1>
            <p style={{ marginTop: 4, fontSize: 13, color: "#9ca3af" }}>
              게임별 이미지 파일을 업로드·삭제할 수 있습니다. (직원 전용, 코드 수정 불필요)
            </p>
          </div>
          <div
            style={{
              padding: "4px 14px",
              borderRadius: 999,
              background: "rgba(14,165,233,0.12)",
              border: "1px solid rgba(14,165,233,0.3)",
              fontSize: 12,
              color: "#38bdf8",
              whiteSpace: "nowrap",
            }}
          >
            총 {items.length}개
          </div>
        </div>

        {/* 카테고리 + 업로드 영역 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "flex-end",
            marginBottom: 16,
          }}
        >
          <div>
            <label style={labelStyle}>카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={selectStyle}
            >
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>이미지 업로드</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              style={{ fontSize: 13 }}
            />
            {uploading && (
              <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>
                업로드 중입니다...
              </div>
            )}
          </div>
        </div>

        {/* 메시지 / 에러 */}
        {error && (
          <div style={{ marginBottom: 8, color: "#f97373", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}
        {message && (
          <div style={{ marginBottom: 8, color: "#4ade80", fontSize: 13 }}>
            ✅ {message}
          </div>
        )}

        {/* 이미지 목록 */}
        {loading ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>불러오는 중...</p>
        ) : items.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            이 카테고리에 등록된 이미지가 없습니다. 상단에서 이미지를 업로드해 주세요.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((item) => (
              <div
                key={item.fileName}
                style={{
                  border: "1px solid #374151",
                  borderRadius: 10,
                  padding: 8,
                  background: "#020617",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    paddingBottom: "100%",
                    position: "relative",
                    borderRadius: 8,
                    overflow: "hidden",
                    marginBottom: 6,
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.fileName}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#030712",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#e5e7eb",
                    wordBreak: "break-all",
                    marginBottom: 4,
                  }}
                >
                  {item.fileName}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.fileName)}
                  style={{
                    width: "100%",
                    padding: "4px 0",
                    borderRadius: 6,
                    border: "none",
                    background: "#b91c1c",
                    color: "#fee2e2",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}