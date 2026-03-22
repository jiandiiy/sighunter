
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  uploadSigItem,
  fetchSigItems,
  updateSigItem,
  deleteSigItem,
} from "../../shared/api/sigHunterImageLibraryApi";

// ─────────────────────────────────────────────
// 상수 정의
// ─────────────────────────────────────────────
const GAME_TYPES = [
  { value: "meal-bingo",       label: "식대전 빙고" },
  { value: "sighunter-bingo",  label: "시그헌터 빙고" },
  { value: "sighunter",        label: "시그헌터 (카드)" },
];

const MODES = [
  { value: "muse",     label: "뮤즈" },
  { value: "queendom", label: "퀸덤" },
];

const RARITIES = [
  { value: "normal",  label: "일반 카드" },
  { value: "special", label: "스페셜 카드" },
];

const MEAL_BINGO_BOARDS = [
  { value: "1", label: "1판" },
  { value: "2", label: "2판" },
  { value: "3", label: "3판" },
];

// ─────────────────────────────────────────────
// 재사용 스타일 헬퍼
// ─────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: 4,
  fontSize: 13,
  color: "#cbd5e1",
};

const tableInputStyle = {
  width: "100%",
  padding: "4px 6px",
  borderRadius: 6,
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: 12,
  outline: "none",
  boxSizing: "border-box",
};

// ─────────────────────────────────────────────
// 드래그 앤 드롭 + 파일 선택 영역 컴포넌트
// ─────────────────────────────────────────────
function DropZone({ file, previewUrl, onFileChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const processFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    // 부모의 handleFileChange 와 동일한 시그니처로 맞춤
    const syntheticEvent = { target: { files: [f] } };
    onFileChange(syntheticEvent);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    processFile(f);
  };

  return (
    <div>
      <label style={labelStyle}>이미지 파일</label>

      {/* 드롭존 영역 */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? "#22c55e" : "#4b5563"}`,
          borderRadius: 12,
          background: isDragging ? "rgba(34,197,94,0.06)" : "#020617",
          padding: "16px 12px",
          cursor: "pointer",
          transition: "border-color 0.2s, background 0.2s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 24 }}>🖼️</span>
        <span style={{ fontSize: 13, color: isDragging ? "#22c55e" : "#9ca3af" }}>
          {isDragging
            ? "여기에 놓으세요!"
            : "클릭하거나 이미지를 드래그하세요"}
        </span>
        {file && (
          <span style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            선택됨: {file.name}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 이미지 미리보기 컴포넌트
// ─────────────────────────────────────────────
function ImagePreview({ previewUrl }) {
  return (
    <div>
      <label style={labelStyle}>미리보기</label>
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
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            선택한 이미지가 여기 미리보기로 보입니다.
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 토스트 알림 컴포넌트
// ─────────────────────────────────────────────
function Toast({ message, error }) {
  const visible = !!(message || error);
  const isError = !!error;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 9999,
        padding: "12px 20px",
        borderRadius: 12,
        background: isError
          ? "rgba(239,68,68,0.15)"
          : "rgba(34,197,94,0.15)",
        border: `1px solid ${isError ? "#ef4444" : "#22c55e"}`,
        color: isError ? "#f97373" : "#4ade80",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
        transition: "opacity 0.3s, transform 0.3s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
      }}
    >
      {isError ? `⚠️ ${error}` : `✅ ${message}`}
    </div>
  );
}

// ─────────────────────────────────────────────
// 업로드 진행률 바 컴포넌트
// (uploadSigItem 이 progress 콜백을 지원할 경우 활용)
// ─────────────────────────────────────────────
function ProgressBar({ progress }) {
  if (progress === null || progress === undefined) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          height: 4,
          borderRadius: 999,
          background: "#1f2937",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #10b981, #22c55e)",
            transition: "width 0.2s ease",
            borderRadius: 999,
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "block" }}>
        {progress < 100 ? `업로드 중... ${progress}%` : "처리 완료!"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function SigImageAdminPage() {
  // ── 업로드 폼 상태 ──
  const [title,      setTitle]      = useState("");
  const [score,      setScore]      = useState("");
  const [mode,       setMode]       = useState("queendom");
  const [type,       setType]       = useState("sighunter");
  const [rarity,     setRarity]     = useState("normal");
  const [isActive,   setIsActive]   = useState(true);
  const [slotIndex,  setSlotIndex]  = useState("");
  const [boardIndex, setBoardIndex] = useState("1");
  const [file,       setFile]       = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // ── UI 상태 ──
  const [submitting,    setSubmitting]    = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // 0~100 or null
  const [message,       setMessage]       = useState("");
  const [error,         setError]         = useState("");
  const [highlightId,   setHighlightId]   = useState(null);

  // ── 목록 상태 ──
  const [items,        setItems]        = useState([]);
  const [loadingList,  setLoadingList]  = useState(false);
  const [savingRowId,  setSavingRowId]  = useState(null);
  const [deletingRowId,setDeletingRowId]= useState(null);

  // ── 검색/필터 상태 ──
  const [searchQuery, setSearchQuery] = useState("");

  const isMealBingo = type === "meal-bingo";

  // ── 파생 상태: 검색 필터링된 목록 ──
  const filteredItems = searchQuery.trim()
    ? items.filter(
        (it) =>
          (it.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (it.id ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // ── 메시지/에러 자동 소멸 (3초) ──
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    return () => clearTimeout(t);
  }, [message, error]);

  // ── 목록 로딩 ──
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

  // ── 파일 선택 핸들러 (드롭존/인풋 공용) ──
  const handleFileChange = useCallback((e) => {
    const f = e.target?.files?.[0] ?? null;
    setFile(f);
    if (f) {
      // 이전 blob URL 메모리 해제
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(f);
      });
    } else {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    }
  }, []);

  // 언마운트 시 blob URL 해제
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 업로드 폼 초기화 ──
  const resetForm = useCallback(() => {
    setTitle("");
    setScore("");
    setIsActive(true);
    setSlotIndex("");
    setFile(null);
    setUploadProgress(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  // ── 업로드 submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── 유효성 검사 ──
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
      setUploadProgress(0);

      const created = await uploadSigItem(
        {
          file,
          title,
          score,
          mode,
          type,
          rarity,
          isActive,
          slotIndex,
          boardIndex: isMealBingo ? boardIndex : null,
        },
        // 진행률 콜백: uploadSigItem 이 지원하면 활용됨
        (progress) => setUploadProgress(progress)
      );

      console.log("[ADMIN] created sig item", created);
      setHighlightId(created.id);
      setUploadProgress(100);
      setMessage("업로드 완료! 🎉");
      resetForm();
      await loadList();
    } catch (err) {
      console.error(err);
      setUploadProgress(null);
      setError(err.message || "업로드에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 테이블 인라인 편집 ──
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

  // ── 행 저장 ──
  const handleSaveRow = async (item) => {
    try {
      setSavingRowId(item.id);
      setError("");
      setMessage("");
      await updateSigItem(item.id, {
        title:      item.title      ?? "",
        score:      item.score      ?? "",
        slotIndex:  item.slotIndex  ?? "",
        boardIndex: item.boardIndex ?? "",
        isActive:   item.isActive,
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

  // ── 행 삭제 ──
  const handleDeleteRow = async (item) => {
    if (typeof window !== "undefined" && !window.confirm("이 카드를 삭제할까요?")) {
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

  // ── 게임 타입 변경 ──
  const handleChangeType = (e) => {
    const newType = e.target.value;
    setType(newType);
    if (newType === "meal-bingo" && !boardIndex) setBoardIndex("1");
  };

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  return (
    <>
      {/* ── 토스트 알림 (우측 하단 고정) ── */}
      <Toast message={message} error={error} />

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
          {/* ── 헤더 ── */}
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
              <p style={{ marginTop: 4, fontSize: 13, color: "#9ca3af" }}>
                게임 / 모드 / 일반·스페셜 / 빙고판 별로 카드 이미지를 관리합니다.
              </p>
            </div>
            {/* 총 카드 수 배지 */}
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
              총 {items.length}장
            </div>
          </div>

          {/* ── 업로드 폼 ── */}
          <form onSubmit={handleSubmit}>
            {/* 필터 셀렉트 행 */}
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
              {/* 게임 타입 */}
              <div>
                <label style={labelStyle}>게임</label>
                <select value={type} onChange={handleChangeType} style={inputStyle}>
                  {GAME_TYPES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* 모드 */}
              <div>
                <label style={labelStyle}>모드</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} style={inputStyle}>
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* 카드 종류 */}
              <div>
                <label style={labelStyle}>카드 종류</label>
                <select value={rarity} onChange={(e) => setRarity(e.target.value)} style={inputStyle}>
                  {RARITIES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* 빙고판 (식대전 전용) */}
              {isMealBingo && (
                <div>
                  <label style={labelStyle}>빙고판</label>
                  <select value={boardIndex} onChange={(e) => setBoardIndex(e.target.value)} style={inputStyle}>
                    {MEAL_BINGO_BOARDS.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 제목 / 점수 / 칸 번호 행 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,0.8fr)",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <label style={labelStyle}>카드 이름 (선택)</label>
                <input
                  type="text"
                  value={title}
                  placeholder="예) 시그 이름"
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>점수 (선택)</label>
                <input
                  type="number"
                  value={score}
                  placeholder="예) 100"
                  onChange={(e) => setScore(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>칸 번호 (필수)</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={slotIndex}
                  placeholder="1 ~ 25"
                  onChange={(e) => setSlotIndex(e.target.value)}
                  style={{
                    ...inputStyle,
                    border: slotIndex ? "1px solid #374151" : "1px solid #f97373",
                  }}
                />
              </div>
            </div>

            {/* 드롭존 + 미리보기 행 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,2fr) minmax(0,1.2fr)",
                gap: 14,
                marginBottom: 14,
                alignItems: "stretch",
              }}
            >
              {/* 드래그 앤 드롭 파일 선택 (개선됨) */}
              <DropZone
                file={file}
                previewUrl={previewUrl}
                onFileChange={handleFileChange}
              />

              {/* 미리보기 */}
              <ImagePreview previewUrl={previewUrl} />
            </div>

            {/* 활성화 체크박스 */}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 14,
                fontSize: 13,
                color: "#d1fae5",
                cursor: "pointer",
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

            {/* 업로드 진행률 바 */}
            {submitting && (
              <ProgressBar progress={uploadProgress} />
            )}

            {/* 업로드 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 10,
                marginTop: 4,
                marginBottom: 12,
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "9px 24px",
                  borderRadius: 999,
                  border: "none",
                  background: submitting
                    ? "linear-gradient(135deg, #6b7280, #4b5563)"
                    : "linear-gradient(135deg, #10b981, #22c55e)",
                  color: "#022c22",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: submitting ? "default" : "pointer",
                  boxShadow: submitting ? "none" : "0 10px 20px rgba(16,185,129,0.35)",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
              >
                {submitting ? `업로드 중... ${uploadProgress ?? 0}%` : "⬆️ 업로드"}
              </button>
            </div>
          </form>

          {/* ── 등록된 카드 목록 ── */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid rgba(55,65,81,0.8)",
            }}
          >
            {/* 목록 헤더 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e5e7eb" }}>
                등록된 카드 목록
              </h2>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {/* 필터 요약 배지 */}
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {MODES.find((m) => m.value === mode)?.label} /{" "}
                  {GAME_TYPES.find((g) => g.value === type)?.label} /{" "}
                  {RARITIES.find((r) => r.value === rarity)?.label}
                  {isMealBingo && boardIndex
                    ? ` / ${MEAL_BINGO_BOARDS.find((b) => b.value === boardIndex)?.label || `${boardIndex}판`}`
                    : ""}
                </span>

                {/* 검색 인풋 (NEW) */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 이름 또는 ID 검색"
                  style={{
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 12,
                    outline: "none",
                    width: 180,
                  }}
                />
              </div>
            </div>

            {/* 테이블 */}
            <div
              style={{
                maxHeight: 300,
                overflow: "auto",
                borderRadius: 10,
                border: "1px solid rgba(55,65,81,0.9)",
                background: "rgba(15,23,42,0.95)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr
                    style={{
                      background: "rgba(15,23,42,1)",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {["이미지", "이름", "점수", "판", "칸", "활성", "관리", "ID"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "7px 8px",
                          textAlign: h === "이미지" || h === "이름" ? "left" : "center",
                          color: "#94a3b8",
                          fontWeight: 600,
                          borderBottom: "1px solid rgba(55,65,81,0.8)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingList ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              border: "2px solid #9ca3af",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              display: "inline-block",
                              animation: "spin 0.7s linear infinite",
                            }}
                          />
                          불러오는 중...
                        </span>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                        {searchQuery ? "검색 결과가 없습니다." : "현재 조건에 등록된 카드가 없습니다."}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderTop: "1px solid rgba(31,41,55,0.9)",
                          background:
                            item.id === highlightId
                              ? "rgba(34,197,94,0.08)"
                              : "transparent",
                          transition: "background 0.5s",
                        }}
                      >
                        {/* 썸네일 */}
                        <td style={{ padding: "5px 6px" }}>
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

                        {/* 이름 */}
                        <td style={{ padding: "4px 6px", maxWidth: 180 }}>
                          <input
                            type="text"
                            value={item.title || ""}
                            onChange={(e) => handleChangeItemField(item.id, "title", e.target.value)}
                            style={tableInputStyle}
                          />
                        </td>

                        {/* 점수 */}
                        <td style={{ padding: "4px 6px", textAlign: "center" }}>
                          <input
                            type="number"
                            value={item.score ?? ""}
                            onChange={(e) => handleChangeItemField(item.id, "score", e.target.value)}
                            style={{ ...tableInputStyle, color: "#fbbf24", textAlign: "center" }}
                          />
                        </td>

                        {/* 빙고판 */}
                        <td style={{ padding: "4px 6px", textAlign: "center" }}>
                          <input
                            type="number"
                            min="1"
                            max="3"
                            value={item.boardIndex ?? ""}
                            onChange={(e) => handleChangeItemField(item.id, "boardIndex", e.target.value)}
                            style={{ ...tableInputStyle, textAlign: "center" }}
                          />
                        </td>

                        {/* 칸 번호 */}
                        <td style={{ padding: "4px 6px", textAlign: "center" }}>
                          <input
                            type="number"
                            value={item.slotIndex ?? ""}
                            onChange={(e) => handleChangeItemField(item.id, "slotIndex", e.target.value)}
                            style={{ ...tableInputStyle, textAlign: "center" }}
                          />
                        </td>

                        {/* 활성 토글 */}
                        <td style={{ padding: "4px 6px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleItemActive(item.id)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid #374151",
                              background: item.isActive ? "#064e3b" : "#111827",
                              color: item.isActive ? "#4ade80" : "#6b7280",
                              fontSize: 11,
                              cursor: "pointer",
                              transition: "background 0.2s, color 0.2s",
                            }}
                          >
                            {item.isActive ? "ON" : "OFF"}
                          </button>
                        </td>

                        {/* 저장/삭제 버튼 */}
                        <td style={{ padding: "4px 6px", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleSaveRow(item)}
                              disabled={savingRowId === item.id}
                              style={{
                                padding: "2px 10px",
                                borderRadius: 999,
                                border: "none",
                                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                                color: "#022c22",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: savingRowId === item.id ? "default" : "pointer",
                                opacity: savingRowId === item.id ? 0.6 : 1,
                              }}
                            >
                              {savingRowId === item.id ? "저장중…" : "저장"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(item)}
                              disabled={deletingRowId === item.id}
                              style={{
                                padding: "2px 10px",
                                borderRadius: 999,
                                border: "none",
                                background: "linear-gradient(135deg,#f97373,#ef4444)",
                                color: "#fee2e2",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: deletingRowId === item.id ? "default" : "pointer",
                                opacity: deletingRowId === item.id ? 0.6 : 1,
                              }}
                            >
                              {deletingRowId === item.id ? "삭제중…" : "삭제"}
                            </button>
                          </div>
                        </td>

                        {/* ID */}
                        <td
                          style={{
                            padding: "4px 6px",
                            textAlign: "center",
                            color: "#6b7280",
                            fontSize: 11,
                            maxWidth: 140,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={item.id}
                        >
                          {item.id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 테이블 하단 안내 */}
            <p style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
              * 랜덤으로 뽑을 때, 이 목록의 카드들 중에서 (게임 / 모드 / 카드 종류 / 빙고판에 맞게) 사용됩니다.
              칸 번호와 일반/스페셜로 나눠서 관리할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 스피너 애니메이션 키프레임 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
