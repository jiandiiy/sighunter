// src/components/GameCenter/OBSViewer/ObsFlipCard.jsx
// 카드 뒤집기 애니메이션 + 상태(뒤집힘/매칭) 표시용 OBS 전용 카드
import React, { useState, useEffect } from "react";

export default function ObsFlipCard({
  cardId,         // 카드 번호 (1~N)
  imageUrl,       // 앞면 이미지
  backImageUrl,   // 뒷면 이미지 (없으면 기본 뒷면 UI)
  title,          // 카드 이름
  isFlipped,      // 뒤집힌 상태 여부
  isMatched,      // 매칭 완료 여부
}) {
  // 실제 렌더링에 쓸 로컬 isFlipped 상태 (애니메이션용)
  const [localFlipped, setLocalFlipped] = useState(isFlipped);
  const [localMatched, setLocalMatched] = useState(isMatched);

  // Firestore에서 isFlipped 바뀌면 약간의 딜레이 후 반영
  // (여러 카드가 동시에 뒤집힐 때 순차 애니메이션 효과)
  useEffect(() => {
    const t = setTimeout(() => {
      setLocalFlipped(isFlipped);
      setLocalMatched(isMatched);
    }, 50);
    return () => clearTimeout(t);
  }, [isFlipped, isMatched]);

  return (
    <div
      style={{
        perspective: "800px",
        width: "100%",
        height: "100%",
      }}
    >
      {/* 카드 전체 래퍼 (뒤집기 transform 적용) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: localFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          // 매칭된 카드는 살짝 밝게 표시
          filter: localMatched
            ? "drop-shadow(0 0 8px rgba(74,222,128,0.7))"
            : "none",
        }}
      >
        {/* 카드 뒷면 (기본 상태) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: 12,
            overflow: "hidden",
            border: "2px solid rgba(99,102,241,0.4)",
            background:
              "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {backImageUrl ? (
            <img
              src={backImageUrl}
              alt="카드 뒷면"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            // 기본 뒷면 UI (이미지 없을 때)
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                color: "rgba(148,163,184,0.6)",
              }}
            >
              <span style={{ fontSize: "22px" }}>🃏</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  opacity: 0.6,
                }}
              >
                {cardId}
              </span>
            </div>
          )}
        </div>

        {/* 카드 앞면 (뒤집힌 상태) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: 12,
            overflow: "hidden",
            transform: "rotateY(180deg)",
            border: localMatched
              ? "2px solid rgba(74,222,128,0.7)"
              : "2px solid rgba(249,250,251,0.15)",
            background: "#020617",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || cardId}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(156,163,175,0.5)",
                fontSize: 14,
              }}
            >
              {cardId}
            </div>
          )}

          {/* 매칭 완료 오버레이 */}
          {localMatched && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(34,197,94,0.18)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#4ade80",
                  textShadow: "0 0 8px rgba(74,222,128,0.8)",
                  letterSpacing: "0.06em",
                }}
              >
                ✓ MATCHED
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}