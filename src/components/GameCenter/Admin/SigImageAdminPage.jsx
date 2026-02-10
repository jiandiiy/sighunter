import React, { useState, useEffect, useCallback } from "react";
import {
  uploadSigItem,
  fetchSigItems,
  updateSigItem,
  deleteSigItem,
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

const MEAL_BINGO_BOARDS = [
  { value: "1", label: "1판" },
  { value: "2", label: "2판" },
  { value: "3", label: "3판" },
];

export default function SigImageAdminPage() {
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [mode, setMode] = useState("queendom"); // 게임 페이지랑 맞추기
  const [type, setType] = useState("sighunter"); // 시그헌터 (카드)로 기본
  const [rarity, setRarity] = useState("normal");
  const [isActive, setIsActive] = useState(true);
  const [slotIndex, setSlotIndex] = useState(""); // 칸 번호(필수)
  const [boardIndex, setBoardIndex] = useState("1"); // 빙고판 번호(식대전 전용)

  const [file, setFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [deletingRowId, setDeletingRowId] = useState(null);

  const isMealBingo = type === "meal-bingo";

  // 메시지 자동 제거
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    return () => clearTimeout(t);
  }, [message, error]);

  const loadList = useCallback(
    async (opts) => {
      const params = {
        mode,
        type,
        rarity,
        activeOnly: false,
        ...(opts || {}),
      };

      if (type === "meal-bingo") {
        params.boardIndex = boardIndex || "1";
      }

      const list = await fetchSigItems(params);
      console.log("[ADMIN] fetchSigItems result", params, list);
      setItems(list);
    },
    [mode, type, rarity, boardIndex]
  );

  // 현재 필터(게임/모드/카드종류/빙고판)에 맞는 목록 로딩
  useEffect(() => {
    async function load() {
      try {
        setLoadingList(true);
        await loadList();
      } catch (e) {
        console.error(e);
        setError("목록을 불러오는데 실패했습니다.");
      } finally {
        setLoadingList(false);
      }
    }
    load();
  }, [loadList]);

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

    if (!slotIndex) {
      setError("칸 번호를 입력해주세요.");
      return;
    }
    if (isNaN(Number(slotIndex))) {
      setError("칸 번호는 숫자로 입력해주세요.");
      return;
    }

    if (isMealBingo && !boardIndex) {
      setError("빙고판 번호를 선택해주세요.");
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
        slotIndex,
        boardIndex: isMealBingo ? boardIndex : null,
      });

      setMessage("업로드 완료! 🎉");

      setTitle("");
      setScore("");
      setMode(mode);
      setType(type);
      setRarity(rarity);
      setIsActive(true);
      setSlotIndex("");
      if (isMealBingo && !boardIndex) setBoardIndex("1");
      setFile(null);
      setPreviewUrl("");

      await loadList();
    } catch (err) {
      console.error(err);
      setError(err.message || "업로드에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeItemField = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleToggleItemActive = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, isActive: !it.isActive } : it
      )
    );
  };

  const handleSaveRow = async (item) => {
    try {
      setSavingRowId(item.id);
      setError("");
      setMessage("");

      await updateSigItem(item.id, {
        title: item.title ?? "",
        score: item.score ?? "",
        slotIndex: item.slotIndex ?? "",
        boardIndex: item.boardIndex ?? "",
        isActive: item.isActive,
      });

      setMessage("수정이 저장되었습니다.");
      await loadList();
    } catch (err) {
      console.error(err);
      setError(err.message || "수정에 실패했습니다.");
    } finally {
      setSavingRowId(null);
    }
  };

  const handleDeleteRow = async (item) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("이 카드를 삭제할까요?")
    ) {
      return;
    }
    try {
      setDeletingRowId(item.id);
      setError("");
      setMessage("");

      await deleteSigItem(item.id);
      setMessage("삭제가 완료되었습니다.");
      await loadList();
    } catch (err) {
      console.error(err);
      setError(err.message || "삭제에 실패했습니다.");
    } finally {
      setDeletingRowId(null);
    }
  };

  const handleChangeType = (e) => {
    const newType = e.target.value;
    setType(newType);
    if (newType === "meal-bingo" && !boardIndex) {
      setBoardIndex("1");
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
              게임 / 모드 / 일반·스페셜 / 빙고판 별로 카드 이미지를 관리합니다.
            </p>
          </div>
        </div>

        {/* 업로드 폼 영역 */}
        <form onSubmit={handleSubmit}>
          {/* 게임 / 모드 / 카드 종류 / 빙고판 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMealBingo
                ? "repeat(4, minmax(0,1fr))"
                : "repeat(3, minmax(0,1fr))",
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
                onChange={handleChangeType}
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

            {isMealBingo && (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontSize: 13,
                    color: "#cbd5f5",
                  }}
                >
                  빙고판
                </label>
                <select
                  value={boardIndex}
                  onChange={(e) => setBoardIndex(e.target.value)}
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
                  {MEAL_BINGO_BOARDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 제목 / 점수 / 칸 번호 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,0.8fr)",
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
                placeholder="예) 시그 이름"
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                칸 번호 (필수)
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={slotIndex}
                placeholder="예) 1 ~ 25"
                onChange={(e) => setSlotIndex(e.target.value)}
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
                {file
                  ? file.name
                  : "PNG / JPG / GIF 등 이미지 파일을 선택하세요."}
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

        {/* 목록 테이블 */}
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
              {isMealBingo && boardIndex
                ? ` / ${
                    MEAL_BINGO_BOARDS.find(
                      (b) => b.value === boardIndex
                    )?.label || `${boardIndex}판`
                  }`
                : ""}
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
                    판
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    칸
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    활성
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    관리
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
                      colSpan={8}
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
                      colSpan={8}
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
                        <input
                          type="text"
                          value={item.title || ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "title",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#e5e7eb",
                            fontSize: 12,
                            outline: "none",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          value={item.score ?? ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "score",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#fbbf24",
                            fontSize: 12,
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          min="1"
                          max="3"
                          value={item.boardIndex ?? ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "boardIndex",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#e5e7eb",
                            fontSize: 12,
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          value={item.slotIndex ?? ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "slotIndex",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#e5e7eb",
                            fontSize: 12,
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleItemActive(item.id)}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid #374151",
                            background: item.isActive
                              ? "#064e3b"
                              : "#111827",
                            color: item.isActive ? "#4ade80" : "#6b7280",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          {item.isActive ? "ON" : "OFF"}
                        </button>
                      </td>

                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleSaveRow(item)}
                            disabled={savingRowId === item.id}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "none",
                              background:
                                "linear-gradient(135deg,#22c55e,#16a34a)",
                              color: "#022c22",
                              fontSize: 11,
                              cursor:
                                savingRowId === item.id
                                  ? "default"
                                  : "pointer",
                            }}
                          >
                            {savingRowId === item.id ? "저장중" : "저장"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(item)}
                            disabled={deletingRowId === item.id}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "none",
                              background:
                                "linear-gradient(135deg,#f97373,#ef4444)",
                              color: "#fee2e2",
                              fontSize: 11,
                              cursor:
                                deletingRowId === item.id
                                  ? "default"
                                  : "pointer",
                            }}
                          >
                            {deletingRowId === item.id ? "삭제중" : "삭제"}
                          </button>
                        </div>
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
            종류 / 빙고판에 맞게) 사용됩니다. 칸 번호와 일반/스페셜로 나눠서
            관리할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}