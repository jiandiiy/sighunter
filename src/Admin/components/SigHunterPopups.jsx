// src/admin/components/SigHunterPopups.jsx
import React, { useEffect } from "react";

/**
 * 매우 단순한 모달/팝업 컴포넌트.
 * - 성공/실패 메시지
 * - confirm(예: 삭제 확인)
 *
 * UI 디자인이 필요하면 CSS만 붙이면 됨.
 */
function SigHunterPopups({
  open = false,
  mode = "info", // "info" | "success" | "error" | "confirm"
  title = "",
  message = "",
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  onClose,
}) {
  // Esc로 닫기(사용성)
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onCancel?.();
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel, onClose]);

  if (!open) return null;

  function handleOverlayClick(e) {
    // 배경 클릭 시 닫기(원치 않으면 제거)
    if (e.target === e.currentTarget) {
      onCancel?.();
      onClose?.();
    }
  }

  const isConfirm = mode === "confirm";

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "#111827",
          color: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {title ||
                (mode === "success" ? "성공" : mode === "error" ? "에러" : "안내")}
            </div>
            <div style={{ marginTop: 8, opacity: 0.9, whiteSpace: "pre-wrap" }}>
              {message}
            </div>
          </div>

          <button
            onClick={() => {
              onCancel?.();
              onClose?.();
            }}
            style={{
              border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
            }}
            type="button"
          >
            닫기
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 16,
            justifyContent: "flex-end",
          }}
        >
          {!isConfirm ? (
            <button
              type="button"
              onClick={() => {
                onConfirm?.();
                onCancel?.();
                onClose?.();
              }}
              style={{
                borderRadius: 8,
                padding: "10px 14px",
                cursor: "pointer",
                background: mode === "error" ? "#b91c1c" : "#0ea5e9",
                border: "none",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {confirmText}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onCancel?.();
                  onClose?.();
                }}
                style={{
                  borderRadius: 8,
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm?.();
                  onClose?.();
                }}
                style={{
                  borderRadius: 8,
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 기존 default 유지
export default SigHunterPopups;

// ✅ named export 추가 (에러 해결용)
export const SigHunterConfirmModal = (props) => (
  <SigHunterPopups {...props} mode="confirm" />
);

export const SigHunterStatusModal = (props) => (
  <SigHunterPopups {...props} mode={props?.mode || "success"} />
);