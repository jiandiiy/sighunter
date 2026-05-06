import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listSigListFiles,
  uploadSigListFile,
  deleteSigListFile,
} from "../../resources/storage/sigListStorage";

/**
 * UI 요구:
 * - 프로그램 선택(뮤즈/퀸덤/홀릭)
 * - 파일 업로드 (xls/xlsx/csv 허용) + 드래그&드롭
 * - 등록된 파일 다운로드/삭제
 * - 업로드 시 저장 파일명 변경 허용(확장자 포함)
 */

const PROGRAMS = [
  { value: "muse", label: "뮤즈" },
  { value: "queendom", label: "퀸덤" },
  { value: "holic", label: "홀릭" },
];

function ToastInline({ message, error, onClear }) {
  const visible = !!(message || error);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClear?.(), 3000);
    return () => clearTimeout(t);
  }, [visible, onClear]);

  if (!visible) return null;

  const isError = !!error;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        padding: "12px 18px",
        borderRadius: 12,
        background: isError ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
        border: `1px solid ${isError ? "#ef4444" : "#22c55e"}`,
        color: isError ? "#f97373" : "#4ade80",
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        maxWidth: 420,
      }}
    >
      {isError ? `⚠️ ${error}` : `✅ ${message}`}
    </div>
  );
}

export default function SigListRegisterPage() {
  const [program, setProgram] = useState("muse");

  const [file, setFile] = useState(null);
  const [previewName, setPreviewName] = useState("");

  // 저장 파일명 커스터마이즈 옵션
  const [useCustomName, setUseCustomName] = useState(false);
  const [desiredFileName, setDesiredFileName] = useState("");

  const [files, setFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [deletingFullPath, setDeletingFullPath] = useState(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const inputRef = useRef(null);
  const dragDropRef = useRef(null);

  const folderHint = useMemo(() => {
    return `sigHunterLists/${program}/`;
  }, [program]);

  const refresh = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const list = await listSigListFiles(program);
      setFiles(list);
    } catch (e) {
      setError(e?.message || "파일 목록 로드 실패");
    } finally {
      setLoadingList(false);
    }
  }, [program]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearToast = () => {
    setMessage("");
    setError("");
  };

  const validateSelectedFile = (f) => {
    if (!f) return;

    const lower = String(f.name || "").toLowerCase();
    const ok = lower.endsWith(".csv") || lower.endsWith(".xls") || lower.endsWith(".xlsx");

    if (!ok) {
      throw new Error("CSV/XLS/XLSX 파일만 업로드할 수 있습니다.");
    }
  };

  const processFile = useCallback((f) => {
    try {
      validateSelectedFile(f);
    } catch (err) {
      setFile(null);
      setPreviewName("");
      setDesiredFileName("");
      setError(err?.message || "파일 선택 실패");
      return;
    }

    setFile(f);
    setPreviewName(f.name);
    setDesiredFileName(f.name);
    setError("");
    setMessage("");
  }, []);

  const onPickFile = useCallback((e) => {
    const f = e.target?.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setPreviewName("");
      setDesiredFileName("");
      return;
    }

    processFile(f);
  }, [processFile]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dragDropRef.current) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const droppedFiles = e.dataTransfer?.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const f = droppedFiles[0]; // 첫 번째 파일만 처리
    processFile(f);
  }, [processFile]);

  const resetForm = () => {
    setFile(null);
    setPreviewName("");
    setUseCustomName(false);
    setDesiredFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("업로드할 파일을 선택하세요.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      if (useCustomName) {
        if (!desiredFileName || !desiredFileName.trim()) {
          throw new Error("저장 파일명을 입력하세요.");
        }
      }

      await uploadSigListFile(program, file, {
        desiredFileName: useCustomName ? desiredFileName : undefined,
      });

      setMessage("시그 리스트 파일이 업로드되었습니다.");
      resetForm();
      await refresh();
    } catch (e) {
      setError(e?.message || "업로드 실패");
    } finally {
      setUploading(false);
    }
  }, [file, program, refresh, desiredFileName, useCustomName]);

  const handleDownload = useCallback(async (item) => {
    try {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError("다운로드 실패");
    }
  }, []);

  const handleDelete = useCallback(async (item) => {
    const ok = window.confirm(`파일을 삭제할까요?\n\n${item.fileName}`);
    if (!ok) return;

    setDeletingFullPath(item.fullPath);
    setError("");
    setMessage("");

    try {
      await deleteSigListFile(item.fullPath);
      setMessage("파일이 삭제되었습니다.");
      await refresh();
    } catch (e) {
      setError(e?.message || "삭제 실패");
    } finally {
      setDeletingFullPath(null);
    }
  }, [refresh]);

  return (
    <div style={{ padding: 16 }}>
      <ToastInline message={message} error={error} onClear={clearToast} />

      {/* 상단: 설명 + 프로그램 선택 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>
            📝 시그 리스트 등록
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            데이터는 저장하지 않고, 파일만 업로드/다운로드/삭제합니다.
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            저장 폴더: <code>{folderHint}</code>
          </div>
        </div>

        <div style={{ minWidth: 240 }}>
          <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
            프로그램
          </label>
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 10px",
              borderRadius: 10,
              border: "1px solid #374151",
              background: "#020617",
              color: "#e5e7eb",
              outline: "none",
              fontSize: 14,
            }}
          >
            {PROGRAMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 업로드 섹션 */}
      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(55,65,81,0.9)",
          background: "rgba(15,23,42,0.95)",
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 14 }}>
          {/* 좌측: 파일 선택 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#e5e7eb" }}>
              1) 엑셀/CSV 파일 선택
            </div>

            <div
              ref={dragDropRef}
              onClick={() => inputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                borderRadius: 12,
                border: `2px dashed ${isDraggingOver ? "#22c55e" : "#4b5563"}`,
                background: isDraggingOver ? "rgba(34,197,94,0.08)" : "#020617",
                padding: 16,
                cursor: "pointer",
                userSelect: "none",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 26 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isDraggingOver ? "#22c55e" : "#e5e7eb" }}>
                    {isDraggingOver ? "여기에 파일을 드롭하세요" : "클릭하거나 파일을 드래그해서 업로드"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    허용 확장자: <b>.csv</b>, <b>.xls</b>, <b>.xlsx</b>
                  </div>
                </div>
              </div>

              {previewName ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
                  ✅ 선택됨: <code>{previewName}</code>
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                  아직 선택된 파일이 없습니다.
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              style={{ display: "none" }}
              onChange={onPickFile}
            />
          </div>

          {/* 우측: 파일명 커스터마이즈 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#e5e7eb" }}>
              2) 저장 파일명(확장자 포함) 옵션
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={useCustomName}
                onChange={(e) => setUseCustomName(e.target.checked)}
              />
              <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                저장 시 파일명 직접 지정하기
              </span>
            </label>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
                원하는 저장 파일명
              </label>
              <input
                type="text"
                value={desiredFileName}
                onChange={(e) => setDesiredFileName(e.target.value)}
                placeholder="예) muse-siglist.xlsx"
                disabled={!useCustomName}
                style={{
                  width: "100%",
                  padding: "10px 10px",
                  borderRadius: 10,
                  border: `1px solid ${useCustomName ? "#374151" : "rgba(55,65,81,0.5)"}`,
                  background: useCustomName ? "#020617" : "rgba(2,6,23,0.5)",
                  color: "#e5e7eb",
                  outline: "none",
                }}
              />
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                {useCustomName ? "확장자(.csv/.xls/.xlsx) 포함되어야 합니다." : "체크하면 활성화됩니다."}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: uploading
                    ? "linear-gradient(135deg, #6b7280, #4b5563)"
                    : "linear-gradient(135deg, #10b981, #22c55e)",
                  color: "#022c22",
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: uploading ? "default" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {uploading ? "업로드 중..." : "⬆️ 업로드"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={uploading}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.5)",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: uploading ? "default" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 목록 섹션 */}
      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(55,65,81,0.9)",
          background: "rgba(15,23,42,0.95)",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#e5e7eb" }}>
            3) 등록된 파일 목록
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {loadingList ? "불러오는 중..." : `총 ${files.length}개`}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loadingList ? (
            <div style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>목록을 불러오는 중입니다...</div>
          ) : files.length === 0 ? (
            <div style={{ padding: 16, color: "#6b7280", fontSize: 13 }}>
              현재 폴더에 파일이 없습니다.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {files.map((item) => {
                const isDeleting = deletingFullPath === item.fullPath;

                return (
                  <div
                    key={item.fullPath}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(55,65,81,0.9)",
                      background: "#020617",
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 800, wordBreak: "break-word" }}>
                      {item.fileName}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", wordBreak: "break-word" }}>
                      <code>{item.fullPath}</code>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        disabled={isDeleting}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "none",
                          background: "linear-gradient(135deg, #38bdf8, #60a5fa)",
                          color: "#0b1220",
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: isDeleting ? "default" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        다운로드
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "1px solid rgba(248,113,113,0.6)",
                          background: "transparent",
                          color: isDeleting ? "#fecaca" : "#fda4af",
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: isDeleting ? "default" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isDeleting ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}