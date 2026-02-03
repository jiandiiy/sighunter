// src/components/common/GameCenter/Admin/SigImageAdminPage.jsx

import React, { useState, useEffect } from "react";
import {
  uploadSigItem,
  fetchSigItems,
} from "../../../api/sigHunterImageLibraryApi";

const GAME_TYPES = [
  { value: "meal-bingo", label: "식대전 빙고" },
  { value: "sighunter-bingo", label: "시그헌터 빙고" },
  { value: "sighunter", label: "시그헌터 (카드)" },
];

const MODES = [
  { value: "muse", label: "뮤즈" },
  { value: "queendom", label: "퀸덤" },
];

const RARITIES = [
  { value: "normal", label: "일반 카드" },
  { value: "special", label: "스페셜 카드" },
];

export default function SigImageAdminPage() {
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [mode, setMode] = useState("muse");
  const [type, setType] = useState("meal-bingo");
  const [rarity, setRarity] = useState("normal");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // 메시지 자동 제거
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    return () => clearTimeout(t);
  }, [message, error]);

  // 현재 필터(게임/모드/카드종류)에 맞는 목록 로딩
  useEffect(() => {
    async function load() {
      try {
        setLoadingList(true);
        const list = await fetchSigItems({ mode, type, rarity, activeOnly: false });
        setItems(list);
      } catch (e) {
        console.error(e);
        setError("목록을 불러오는데 실패했습니다.");
      } finally {
        setLoadingList(false);
      }
    }
    load();
  }, [mode, type, rarity]);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);

    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("이미지 파일을 선택하세요.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await uploadSigItem({
        file,
        title,
        score,
        mode,
        type,
        rarity,
        isActive,
      });

      setMessage("업로드 완료! 🎉");

      setTitle("");
      setScore("");
      setMode(mode); // 그대로 유지
      setType(type);
      setRarity(rarity);
      setIsActive(true);
      setFile(null);
      setPreviewUrl("");

      // 새로 업로드한 내용 반영
      const list = await fetchSigItems({ mode, type, rarity, activeOnly: false });
      setItems(list);
    } catch (err) {
      console.error(err);
      setError(err.message || "업로드에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

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
          border: "1px solid rgba(148, 163, 184, 0.5)",
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
              🛠 시그 이미지 관리
            </h1>
            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              게임 / 모드 / 일반·스페셜 별로 카드 이미지를 등록하고, 점수와 이름을 관리합니다.
            </p>
          </div>
        </div>

        {/* 업로드 폼 영역 */}
        <form onSubmit={handleSubmit}>
          {/* 게임 / 모드 / 카드 종류 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                게임
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {GAME_TYPES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                모드
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                카드 종류
              </label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {RARITIES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 제목 / 점수 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                카드 이름 (선택)
              </label>
              <input
                type="text"
                value={title}
                placeholder="예) 초고속 설거지권"
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                점수 (선택)
              </label>
              <input
                type="number"
                value={score}
                placeholder="예) 100"
                onChange={(e) => setScore(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* 파일 + 미리보기 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,2fr) minmax(0,1.2fr)",
              gap: 14,
              marginBottom: 18,
              alignItems: "stretch",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                이미지 파일
              </label>

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background:
                    "linear-gradient(135deg, #111827, #020617, #111827)",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#e5e7eb",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: 20,
                    height: 20,
                    borderRadius: "999px",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0ea5e9",
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  +
                </span>
                <span>이미지 선택</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#9ca3af",
                  minHeight: 18,
                }}
              >
                {file ? file.name : "PNG / JPG / GIF 등 이미지 파일을 선택하세요."}
              </div>

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  fontSize: 13,
                  color: "#d1fae5",
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>활성화 (랜덤 뽑기에 포함)</span>
              </label>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                미리보기
              </label>
              <div
                style={{
                  borderRadius: 12,
                  border: "1px dashed #4b5563",
                  background: "#020617",
                  height: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    선택한 이미지가 여기 미리보기로 보입니다.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 버튼 + 메시지 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {(message || error) && (
              <div
                style={{
                  fontSize: 13,
                  color: error ? "#f97373" : "#4ade80",
                  minWidth: 140,
                  textAlign: "right",
                }}
              >
                {error || message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 20px",
                borderRadius: 999,
                border: "none",
                background: submitting
                  ? "linear-gradient(135deg, #6b7280, #4b5563)"
                  : "linear-gradient(135deg, #10b981, #22c55e)",
                color: "#022c22",
                fontWeight: 800,
                fontSize: 14,
                cursor: submitting ? "default" : "pointer",
                boxShadow: "0 10px 20px rgba(16,185,129,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </form>

        {/* 목록 테이블: 이게 “어떤 게임에 어떤 이미지들이 등록돼 있는지” 확인용 */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid rgba(55,65,81,0.8)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "#e5e7eb",
              }}
            >
              등록된 카드 목록
            </h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {MODES.find((m) => m.value === mode)?.label} /{" "}
              {GAME_TYPES.find((g) => g.value === type)?.label} /{" "}
              {RARITIES.find((r) => r.value === rarity)?.label}
            </span>
          </div>

          <div
            style={{
              maxHeight: 260,
              overflow: "auto",
              borderRadius: 10,
              border: "1px solid rgba(55,65,81,0.9)",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(15,23,42,1)",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>
                    이미지
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>
                    이름
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    점수
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    활성
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#9ca3af",
                      }}
                    >
                      불러오는 중...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      현재 조건에 등록된 카드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: "1px solid rgba(31,41,55,0.9)",
                      }}
                    >
                      <td style={{ padding: "4px 6px" }}>
                        <img
                          src={item.imageUrl}
                          alt={item.title || item.id}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid rgba(55,65,81,0.9)",
                          }}
                        />
                      </td>
                      <td style={{ padding: "4px 6px", maxWidth: 200 }}>
                        <div
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title || "-"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                          color: "#fbbf24",
                        }}
                      >
                        {item.score ?? 0}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                          color: item.isActive ? "#4ade80" : "#6b7280",
                        }}
                      >
                        {item.isActive ? "ON" : "OFF"}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: 11,
                          maxWidth: 160,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            * 랜덤으로 뽑을 때, 이 목록의 카드들 중에서 (게임 / 모드 / 카드
            종류에 맞게) 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}