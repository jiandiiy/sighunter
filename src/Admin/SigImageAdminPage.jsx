import React, { useState, useEffect, useCallback, useRef } from "react";

// Storage 유틸: images/{program}/{group}/{fileName}
import {
  listProgramGroupImages,
  uploadProgramGroupImage,
  deleteProgramImage,
} from "../shared/api/sigResourceStorage";

// Firestore 유틸: gameSigResources 메타
import {
  listSigResourceMeta,
  createSigResourceMeta,
  updateSigResourceMeta,
  deleteSigResourceMeta,
} from "../shared/api/sigGameResourceMeta";

// ─────────────────────────────────────────────
// 상수 정의
// ─────────────────────────────────────────────
const GAME_TYPES = [
  { value: "meal-bingo", label: "식대전 빙고" },
  { value: "sighunter-bingo", label: "시그땅따먹기(보드형)" },
  { value: "sighunter", label: "시그헌터 (카드)" },
];

const MODES = [
  { value: "muse", label: "뮤즈" },
  { value: "queendom", label: "퀸덤" },
  { value: "holic", label: "홀릭" },
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

const GROUPS = Array.from({ length: 12 }).map((_, i) => {
  const num = String(i + 1).padStart(2, "0"); // 01~12
  return { value: `group${num}`, label: `group${num}` };
});

// gameType(type) → Firestore game 필드
function toGameKey(type) {
  if (type === "meal-bingo") return "sigbingo";
  if (type === "sighunter-bingo") return "sigtag"; // 시그땅따먹기
  if (type === "sighunter") return "sighunter";
  return null;
}

// type/boardIndex → Firestore boardType 필드
function toBoardType(type, boardIndex) {
  if (type === "meal-bingo") {
    return `board${boardIndex}`; // "board1" ~ "board3"
  }
  if (type === "sighunter-bingo") {
    // 필요하면 5x5/3x3 등으로 분기 가능
    return "5x5";
  }
  // 시그헌터 카드형은 보드 없음
  return null;
}

// ─────────────────────────────────────────────
// storagePath 정규화 헬퍼 (추가됨)
// ─────────────────────────────────────────────
function normalizeStoragePath(p) {
  if (!p) return "";
  const str = String(p).split("?")[0];
  
  const idx = str.indexOf("images/");
  if (idx >= 0) return str.slice(idx);
  
  // prefix 제거 후 최종 정규화
  let normalized = str
    .replace(/^sig-hunter\//, "")
    .replace(/^sighunter\//, "")
    .replace(/^sigtag\//, "");
  
  // 맨 앞이 "images/"가 아니면 붙이기
  if (!normalized.startsWith("images/")) {
    normalized = "images/" + normalized;
  }
  
  return normalized;
}

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

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
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
          {isDragging ? "여기에 놓으세요!" : "클릭하거나 이미지를 드래그하세요"}
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
        background: isError ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
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
// 메인 컴포넌트 (직원용 통합 리소스 어드민)
// ─────────────────────────────────────────────
export default function SigResourceAdminPage() {
  // ── 필터/설정 상태 ──
  const [type, setType] = useState("meal-bingo"); // gameType
  const [mode, setMode] = useState("queendom"); // program
  const [rarity, setRarity] = useState("normal"); // UI용
  const [boardIndex, setBoardIndex] = useState("1"); // 식대전 전용
  const [group, setGroup] = useState("group1"); // group1~group12

  const isMealBingo = type === "meal-bingo";

  // ── 업로드 폼 상태 ──
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // ── UI 상태 ──
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ── 리소스 목록/메타 상태 ──
  const [images, setImages] = useState([]); // Storage 이미지 목록
  const [metas, setMetas] = useState([]); // gameSigResources 문서 목록
  const [loadingList, setLoadingList] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // 선택된 이미지에 대한 메타 편집 상태
  const [editingMeta, setEditingMeta] = useState({
    id: null,
    slotIndex: "",
    sigNumber: "",
    sigName: "",
  });

  const [savingMeta, setSavingMeta] = useState(false);
  const [deletingImg, setDeletingImg] = useState(false);

  // ── 메시지/에러 자동 소멸 ──
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    return () => clearTimeout(t);
  }, [message, error]);

  // ── 파일 선택 핸들러 ──
  const handleFileChange = useCallback((e) => {
    const f = e.target?.files?.[0] ?? null;
    setFile(f);
    if (f) {
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
    setFile(null);
    setUploadProgress(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  // ── 리소스 목록 로딩 (Storage + Firestore 메타) ──
  const reloadResources = useCallback(async () => {
    const game = toGameKey(type);
    const boardType = toBoardType(type, boardIndex);

    setLoadingList(true);
    try {
      // 1) Storage 이미지 목록
      const imgs = await listProgramGroupImages(mode, group);
console.log("[reloadResources] images length:", imgs?.length);
      setImages(imgs);

      // 2) 메타 목록 (여기서 한 번만 가져오고)
      const metaFilters = {
        game,
        boardType,
        program: mode,
        group,
      };

      const metaList = await listSigResourceMeta(metaFilters);
      console.log(
        "[reloadResources metas length]:",
        metaList?.length,
        "sample:",
        metaList?.[0]
      );
      setMetas(metaList);

      // 3) 선택된 이미지가 있다면 그에 맞는 메타 반영
      if (selectedImage) {
        const found = metaList.find(
          (m) => m.storagePath === selectedImage.fullPath
        );
        if (found) {
          setEditingMeta({
            id: found.id,
            slotIndex: found.slotIndex ?? "",
            sigNumber: found.sigNumber ?? "",
            sigName: found.sigName ?? "",
          });
        } else {
          setEditingMeta({
            id: null,
            slotIndex: "",
            sigNumber: "",
            sigName: "",
          });
        }
      } else {
        // 선택된 이미지가 없으면 메타도 초기화
        setEditingMeta({
          id: null,
          slotIndex: "",
          sigNumber: "",
          sigName: "",
        });
      }
    } catch (e) {
      console.error(e);
      setError("리소스를 불러오는데 실패했습니다.");
    } finally {
      setLoadingList(false);
    }
  }, [type, boardIndex, mode, group, selectedImage]);

  // 필터 변경 시마다 리소스 다시 로딩
  useEffect(() => {
    reloadResources();
  }, [reloadResources]);

  // ── 업로드 submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("이미지 파일을 선택하세요.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setUploadProgress(0);

      // Storage 업로드: images/{program}/{group}/{fileName}
      const uploaded = await uploadProgramGroupImage(mode, group, file);
      // uploaded: { fileName, fullPath, url }

      setSelectedImage(uploaded);
      setEditingMeta({
        id: null,
        slotIndex: "",
        sigNumber: "",
        sigName: "",
      });

      setMessage("이미지가 업로드되었습니다.");
      setUploadProgress(100);
      resetForm();

      // 목록 다시 로딩
      await reloadResources();
    } catch (err) {
      console.error(err);
      setUploadProgress(null);
      setError(err.message || "업로드에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 이미지 카드 클릭 (선택 변경) ──
  const handleSelectImage = (img) => {
    setSelectedImage(img);
    // 선택한 이미지에 대응하는 메타 찾기
    const found = metas.find((m) => m.storagePath === img.fullPath);
    if (found) {
      setEditingMeta({
        id: found.id,
        slotIndex: found.slotIndex ?? "",
        sigNumber: found.sigNumber ?? "",
        sigName: found.sigName ?? "",
      });
    } else {
      setEditingMeta({
        id: null,
        slotIndex: "",
        sigNumber: "",
        sigName: "",
      });
    }
  };

  // ── 메타 값 변경 ──
  const handleChangeMetaField = (field, value) => {
    setEditingMeta((prev) => ({ ...prev, [field]: value }));
  };

  // ── 메타 저장 (칸/시그 정보) ──
  const handleSaveMeta = async () => {
    if (!selectedImage) {
      setError("먼저 왼쪽에서 이미지를 선택하세요.");
      return;
    }
    if (!editingMeta.slotIndex) {
      setError("칸 번호를 입력해주세요.");
      return;
    }
    if (isNaN(Number(editingMeta.slotIndex))) {
      setError("칸 번호는 숫자로 입력해주세요.");
      return;
    }

    const game = toGameKey(type);
    const boardType = toBoardType(type, boardIndex);

    const payload = {
      game,
      boardType: boardType || null,
      program: mode,
      group,
      slotIndex: Number(editingMeta.slotIndex),
      sigNumber: editingMeta.sigNumber ? Number(editingMeta.sigNumber) : null,
      sigName: editingMeta.sigName || "",
      storagePath: selectedImage.fullPath,
      imageUrl: selectedImage.url,
    };

    try {
      setSavingMeta(true);
      setError("");
      setMessage("");

      if (editingMeta.id) {
        await updateSigResourceMeta(editingMeta.id, payload);
      } else {
        const id = await createSigResourceMeta(payload);
        setEditingMeta((prev) => ({ ...prev, id }));
      }

      setMessage("이미지 정보가 저장되었습니다.");
      await reloadResources();
    } catch (err) {
      console.error(err);
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setSavingMeta(false);
    }
  };

  // ── 메타만 삭제 (이미지는 유지) ──
  const handleDeleteMetaOnly = async () => {
    console.log("[handleDeleteMetaOnly] editingMeta.id:", editingMeta.id);
    if (!editingMeta.id) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("이 이미지의 칸/시그 정보만 삭제할까요? (이미지는 남습니다)")
    ) {
      return;
    }

    try {
      setSavingMeta(true);
      setError("");
      setMessage("");

      await deleteSigResourceMeta(editingMeta.id);
      setEditingMeta({
        id: null,
        slotIndex: "",
        sigNumber: "",
        sigName: "",
      });

      setMessage("이미지 정보가 삭제되었습니다.");
      await reloadResources();
    } catch (err) {
      console.error(err);
      setError(err.message || "삭제에 실패했습니다.");
    } finally {
      setSavingMeta(false);
    }
  };

// ── 이미지 + 관련 메타 전부 삭제 ──
const handleDeleteSelectedImage = async () => {
  if (!selectedImage) return;

// 삭제 직전 추가
  console.log('[DEBUG-1] selectedImage.fullPath:', selectedImage.fullPath);
  console.log('[DEBUG-2] metas storagePath list:', 
    metas.map(m => m.storagePath)
  );
  console.log('[DEBUG-3] direct match check:', 
    metas.some(m => m.storagePath === selectedImage.fullPath)
  );


  if (
    typeof window !== "undefined" &&
    !window.confirm(
      "이 이미지를 삭제하면, 이 이미지를 사용하는 모든 칸 설정도 함께 삭제됩니다. 계속할까요?"
    )
  ) {
    return;
  }

  console.log("[handleDeleteSelectedImage] START - about to enter try block");

  try {
    setDeletingImg(true);
    setError("");
    setMessage("");

    console.log("[deleteProgramImage] about to delete:", {
      fullPath: selectedImage.fullPath,
      normalized: normalizeStoragePath(selectedImage.fullPath),
    });
// 현재 선택된 이미지 정보
console.log('selectedImage:', selectedImage);

// 메타 샘플 (storagePath 확인!)
console.log('metas[0]:', metas?.[0]);

    // ✅ 삭제 직전 이미지 개수 확인
    const imgsBefore = await listProgramGroupImages(mode, group);
    console.log("[before delete] listProgramGroupImages:", {
      mode,
      group,
      length: imgsBefore?.length,
      fileNames: imgsBefore?.map(img => img.fileName),
    });

    // Storage 파일 삭제
    console.log("[checkpoint] before deleteProgramImage call");

    try {
      await deleteProgramImage(selectedImage.fullPath);
      console.log("[after delete] deleteProgramImage resolved");
    } catch (e) {
      console.error("[after delete] deleteProgramImage error:", e);
      return; // 삭제 실패면 여기서 중단
    }

    console.log("[checkpoint] after deleteProgramImage - b log");
    console.log("[after delete] deleteProgramImage done.");

    // ✅ 삭제 직후 이미지 개수 확인
    const imgsAfter = await listProgramGroupImages(mode, group);
    console.log("[after delete] listProgramGroupImages:", {
      mode,
      group,
      length: imgsAfter?.length,
      fileNames: imgsAfter?.map(img => img.fileName),
    });

    console.log("metas state:", {
      isArray: Array.isArray(metas),
      length: Array.isArray(metas) ? metas.length : null,
    });
    console.log("meta sample:", metas?.[0]);

    const game = toGameKey(type);
    const boardType = toBoardType(type, boardIndex);

   // ★ 수정: 모든 메타를 삭제 (같은 프로그램/그룹/보드의 모든 메타)
const relatedMetas = (metas || []).filter(
  (m) =>
    m.game === game &&
    (m.boardType ?? null) === (boardType ?? null) &&
    m.program === mode &&
    m.group === group
);

    console.log("[handleDeleteSelectedImage] relatedMetas:", {
      selectedImageFullPath: selectedImage?.fullPath,
      filters: { game, boardType, program: mode, group },
      metasLength: metas?.length,
      relatedMetasLength: relatedMetas.length,
      relatedMetasIds: relatedMetas.map((m) => m.id),
    });

    // ✅ deleteSigResourceMeta는 1번만 호출 (중복 제거)
    const uniqueIds = Array.from(new Set(relatedMetas.map((m) => m.id)));
    await Promise.all(uniqueIds.map((id) => deleteSigResourceMeta(id)));

    console.log("[handleDeleteSelectedImage] deleted ids done:", {
      deletedCount: uniqueIds.length,
    });

    setSelectedImage(null);
    setEditingMeta({
      id: null,
      slotIndex: "",
      sigNumber: "",
      sigName: "",
    });

    setMessage("이미지와 관련 설정이 모두 삭제되었습니다.");
    await reloadResources();
  } catch (err) {
    console.error("[handleDeleteSelectedImage] failed:", err);
    setError(err.message || "삭제에 실패했습니다.");
  } finally {
    setDeletingImg(false);
  }
};

  // ─────────────────────────────────────────────
  // 게임 타입 변경 ──
  // ─────────────────────────────────────────────
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
            maxWidth: 1160,
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
                🛠 시그 리소스 통합 관리
              </h1>
              <p style={{ marginTop: 4, fontSize: 13, color: "#9ca3af" }}>
                게임 / 보드 / 프로그램 / 그룹 별로 이미지 리소스와 칸·시그 정보를
                설정합니다.
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
              이미지 {images.length}개
            </div>
          </div>

          {/* ── 업로드 + 필터 영역 ── */}
          <form onSubmit={handleSubmit}>
            {/* 필터 셀렉트 행 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMealBingo ? "repeat(5, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {/* 게임 타입 */}
              <div>
                <label style={labelStyle}>게임</label>
                <select value={type} onChange={handleChangeType} style={inputStyle}>
                  {GAME_TYPES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 모드 (program) */}
              <div>
                <label style={labelStyle}>모드</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} style={inputStyle}>
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 카드 종류 (UI용) */}
              <div>
                <label style={labelStyle}>카드 종류</label>
                <select value={rarity} onChange={(e) => setRarity(e.target.value)} style={inputStyle}>
                  {RARITIES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 빙고판 (식대전 전용) */}
              {isMealBingo && (
                <div>
                  <label style={labelStyle}>빙고판</label>
                  <select value={boardIndex} onChange={(e) => setBoardIndex(e.target.value)} style={inputStyle}>
                    {MEAL_BINGO_BOARDS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 그룹 */}
              <div>
                <label style={labelStyle}>그룹</label>
                <select value={group} onChange={(e) => setGroup(e.target.value)} style={inputStyle}>
                  {GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
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
              <DropZone file={file} previewUrl={previewUrl} onFileChange={handleFileChange} />
              <ImagePreview previewUrl={previewUrl} />
            </div>

            {/* 업로드 버튼 + 안내 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginTop: 4,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                * 이미지는 <code style={{ fontSize: 11 }}>images/{`{프로그램}`}/{`{그룹}`}</code> 에 업로드됩니다.
                한 번 업로드된 이미지는 삭제하기 전까지 계속 재사용할 수 있습니다.
              </p>

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
                {submitting ? `업로드 중... ${uploadProgress ?? 0}%` : "⬆️ 이미지 업로드"}
              </button>
            </div>

            {submitting && <ProgressBar progress={uploadProgress} />}
          </form>

          {/* ── 본문: 좌측 이미지 목록 + 우측 메타 폼 ── */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid rgba(55,65,81,0.8)",
              display: "grid",
              gridTemplateColumns: "minmax(0,3fr) minmax(0,2.2fr)",
              gap: 18,
            }}
          >
            {/* 좌측: 이미지 리스트 */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
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
                  이미지 목록
                </h2>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {MODES.find((m) => m.value === mode)?.label} /{" "}
                  {GAME_TYPES.find((g) => g.value === type)?.label} /{" "}
                  {group}
                  {isMealBingo && boardIndex
                    ? ` / ${MEAL_BINGO_BOARDS.find((b) => b.value === boardIndex)?.label || `${boardIndex}판`}`
                    : ""}
                </span>
              </div>

              <div
                style={{
                  maxHeight: 320,
                  overflow: "auto",
                  borderRadius: 10,
                  border: "1px solid rgba(55,65,81,0.9)",
                  background: "rgba(15,23,42,0.95)",
                  padding: 8,
                }}
              >
                {loadingList ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                    불러오는 중...
                  </div>
                ) : images.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 12 }}>
                    현재 조건에 업로드된 이미지가 없습니다.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {images.map((img) => {
                      const metaForImg = metas.find((m) => m.storagePath === img.fullPath);
                      const isSelected = selectedImage && selectedImage.fullPath === img.fullPath;

                      return (
                        <button
                          key={img.fullPath}
                          type="button"
                          onClick={() => handleSelectImage(img)}
                          style={{
                            borderRadius: 10,
                            padding: 6,
                            border: isSelected ? "2px solid #22c55e" : "1px solid rgba(55,65,81,0.9)",
                            background: isSelected ? "rgba(34,197,94,0.12)" : "rgba(15,23,42,0.9)",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: "1 / 1",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "1px solid rgba(31,41,55,0.9)",
                              background: "#020617",
                            }}
                          >
                            <img
                              src={img.url}
                              alt={img.fileName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#e5e7eb",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                            title={img.fileName}
                          >
                            {img.fileName}
                          </div>
                          <div style={{ fontSize: 10, color: metaForImg ? "#22c55e" : "#6b7280" }}>
                            {metaForImg
                              ? `칸 ${metaForImg.slotIndex}${metaForImg.sigNumber ? ` / #${metaForImg.sigNumber}` : ""}`
                              : "미설정"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
                * 이미지를 클릭하면 오른쪽에서 해당 이미지의 칸 번호와 시그 정보를 설정할 수 있습니다.
              </p>
            </div>

            {/* 우측: 선택된 이미지 메타 폼 */}
            <div>
              <h2
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#e5e7eb",
                }}
              >
                선택된 이미지 정보
              </h2>

              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(55,65,81,0.9)",
                  background: "rgba(15,23,42,0.95)",
                  padding: 12,
                  minHeight: 180,
                }}
              >
                {!selectedImage ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#6b7280",
                      textAlign: "center",
                    }}
                  >
                    왼쪽에서 이미지를 선택하면
                    <br />
                    이 영역에서 칸 번호 및 시그 정보를 설정할 수 있습니다.
                  </div>
                ) : (
                  <>
                    {/* 선택된 이미지 미리보기 */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 10,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: "1px solid rgba(31,41,55,0.9)",
                          background: "#020617",
                        }}
                      >
                        <img
                          src={selectedImage.url}
                          alt={selectedImage.fileName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#e5e7eb",
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={selectedImage.fileName}
                        >
                          {selectedImage.fileName}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {mode} / {group}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          storagePath: {selectedImage.fullPath}
                        </div>
                      </div>
                    </div>

                    {/* 메타 입력 폼 */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <label style={labelStyle}>칸 번호 (필수)</label>
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={editingMeta.slotIndex}
                          onChange={(e) => handleChangeMetaField("slotIndex", e.target.value)}
                          style={{
                            ...tableInputStyle,
                            border: editingMeta.slotIndex ? "1px solid #374151" : "1px solid #f97373",
                          }}
                          placeholder="예) 1"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>시그 번호 (선택)</label>
                        <input
                          type="number"
                          value={editingMeta.sigNumber}
                          onChange={(e) => handleChangeMetaField("sigNumber", e.target.value)}
                          style={tableInputStyle}
                          placeholder="예) 101"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>시그 이름 (선택)</label>
                        <input
                          type="text"
                          value={editingMeta.sigName}
                          onChange={(e) => handleChangeMetaField("sigName", e.target.value)}
                          style={tableInputStyle}
                          placeholder="예) 홍길동"
                        />
                      </div>
                    </div>

                    {/* 버튼 영역 */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={handleSaveMeta}
                          disabled={savingMeta}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg,#22c55e,#16a34a)",
                            color: "#022c22",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: savingMeta ? "default" : "pointer",
                            opacity: savingMeta ? 0.7 : 1,
                          }}
                        >
                          {savingMeta ? "저장 중..." : "칸/시그 정보 저장"}
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteMetaOnly}
                          disabled={!editingMeta.id || savingMeta}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(248,113,113,0.7)",
                            background: "transparent",
                            color: editingMeta.id ? "#fecaca" : "#4b5563",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: !editingMeta.id || savingMeta ? "default" : "pointer",
                          }}
                        >
                          정보만 삭제
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleDeleteSelectedImage}
                        disabled={deletingImg}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "none",
                          background: "linear-gradient(135deg,#f97373,#ef4444)",
                          color: "#fee2e2",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: deletingImg ? "default" : "pointer",
                          opacity: deletingImg ? 0.7 : 1,
                        }}
                      >
                        {deletingImg ? "이미지 삭제 중..." : "이미지 + 매핑 삭제"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <p style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
                * 개발자는 <code style={{ fontSize: 11 }}>gameSigResources</code> 컬렉션을
                <br />
                <code style={{ fontSize: 11 }}>game / boardType / program / group / slotIndex</code>{" "}
                조건으로 조회해
                <br />
                각 칸의 이미지와 시그 정보를 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}