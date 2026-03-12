// src/components/GameCenter/Admin/SigHunterFlipControl.jsx
// 각 카드에 이미지를 설정하고, 카드를 뒤집거나 초기화하는 관리자 페이지
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  onSnapshot,
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../core/firebase";
import { fetchSigItems } from "../../api/sigHunterImageLibraryApi";

const DEFAULT_CONFIG = {
  rows: 4,
  cols: 6,
  name: "시그헌터 플립",
  flipMode: "single",
};

export default function SigHunterFlipControl() {
  const { boardId } = useParams();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cards, setCards] = useState({});
  const [loadingBoard, setLoadingBoard] = useState(true);

  // 이미지 선택 모달
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");

  // 피드백 메시지
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 메시지 3초 후 자동 사라짐
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    return () => clearTimeout(t);
  }, [message, error]);

  // Firestore 실시간 구독
  useEffect(() => {
    if (!boardId) return;

    const boardRef = doc(db, "sigHunterFlipBoards", boardId);
    const cardsRef = collection(boardRef, "cards");
    let unsubCards;

    (async () => {
      try {
        setLoadingBoard(true);

        const snap = await getDoc(boardRef);
        if (snap.exists() && snap.data()?.config) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data().config });
        }

        unsubCards = onSnapshot(cardsRef, (qs) => {
          const map = {};
          qs.forEach((d) => {
            map[d.id] = d.data();
          });
          setCards(map);
          setLoadingBoard(false);
        });
      } catch (e) {
        console.error("[FlipControl] error", e);
        setLoadingBoard(false);
      }
    })();

    return () => {
      if (unsubCards) unsubCards();
    };
  }, [boardId]);

  // 이미지 라이브러리 불러오기
  const loadLibrary = useCallback(async () => {
    try {
      setLibraryError("");
      setLibraryLoading(true);
      const list = await fetchSigItems({
        type: "sighunter",
        activeOnly: true,
      });
      setLibraryItems(list);
    } catch (e) {
      console.error("[FlipControl] library error", e);
      setLibraryError("이미지 목록을 불러오는데 실패했습니다.");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // 카드 클릭 → 이미지 선택 모달 오픈
  const openCardModal = async (cardId) => {
    setSelectedCardId(cardId);
    await loadLibrary();
  };

  const closeModal = () => setSelectedCardId(null);

  // 이미지 선택 → Firestore 업데이트
  const handleSelectImageForCard = async (image) => {
    if (!selectedCardId || !boardId) return;
    try {
      const boardRef = doc(db, "sigHunterFlipBoards", boardId);
      const cardRef = doc(boardRef, "cards", selectedCardId);

      await setDoc(
        cardRef,
        {
          imageId: image.id,
          imageUrl: image.imageUrl,
          title: image.title || "",
          isFlipped: false,
          isMatched: false,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setMessage(`카드 ${selectedCardId}에 이미지가 설정되었습니다.`);
      closeModal();
    } catch (e) {
      console.error("[FlipControl] set image error", e);
      setError("이미지 설정에 실패했습니다.");
    }
  };

  // 카드 뒤집기 토글 (개별)
  const handleToggleFlip = async (cardId) => {
    try {
      const boardRef = doc(db, "sigHunterFlipBoards", boardId);
      const cardRef = doc(boardRef, "cards", cardId);
      const current = cards[cardId]?.isFlipped ?? false;

      await updateDoc(cardRef, {
        isFlipped: !current,
        updatedAt: new Date(),
      });
    } catch (e) {
      console.error("[FlipControl] toggle flip error", e);
      setError("카드 뒤집기에 실패했습니다.");
    }
  };

  // 매칭 완료 토글 (개별)
  const handleToggleMatch = async (cardId) => {
    try {
      const boardRef = doc(db, "sigHunterFlipBoards", boardId);
      const cardRef = doc(boardRef, "cards", cardId);
      const current = cards[cardId]?.isMatched ?? false;

      await updateDoc(cardRef, {
        isMatched: !current,
        updatedAt: new Date(),
      });
    } catch (e) {
      console.error("[FlipControl] toggle match error", e);
      setError("매칭 상태 변경에 실패했습니다.");
    }
  };

  // 전체 카드 초기화 (isFlipped, isMatched → false)
  const handleResetAll = async () => {
    if (!window.confirm("모든 카드를 뒤집힌 상태로 초기화할까요?")) return;
    try {
      const boardRef = doc(db, "sigHunterFlipBoards", boardId);
      const batch = writeBatch(db);
      const { rows, cols } = config;

      for (let i = 1; i <= rows * cols; i++) {
        const cardRef = doc(boardRef, "cards", String(i));
        batch.update(cardRef, {
          isFlipped: false,
          isMatched: false,
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      setMessage("모든 카드가 초기화되었습니다.");
    } catch (e) {
      console.error("[FlipControl] reset error", e);
      setError("초기화에 실패했습니다.");
    }
  };

  // 전체 카드 공개
  const handleFlipAll = async () => {
    if (!window.confirm("모든 카드를 공개할까요?")) return;
    try {
      const boardRef = doc(db, "sigHunterFlipBoards", boardId);
      const batch = writeBatch(db);
      const { rows, cols } = config;

      for (let i = 1; i <= rows * cols; i++) {
        const cardRef = doc(boardRef, "cards", String(i));
        batch.update(cardRef, {
          isFlipped: true,
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      setMessage("모든 카드가 공개되었습니다.");
    } catch (e) {
      console.error("[FlipControl] flip all error", e);
      setError("전체 공개에 실패했습니다.");
    }
  };

  const { rows, cols } = config;

  // 그리드 렌더링
  const renderGrid = () => {
    const gridRows = [];

    for (let r = 0; r < rows; r++) {
      const rowCards = [];

      for (let c = 0; c < cols; c++) {
        const cardId = String(r * cols + c + 1);
        const cardData = cards[cardId];
        const isFlipped = cardData?.isFlipped ?? false;
        const isMatched = cardData?.isMatched ?? false;

        rowCards.push(
          <div
            key={cardId}
            style={{
              border: isMatched
                ? "2px solid rgba(74,222,128,0.6)"
                : isFlipped
                ? "2px solid rgba(99,102,241,0.5)"
                : "1px solid #374151",
              borderRadius: 10,
              background: isMatched
                ? "rgba(16,185,129,0.08)"
                : isFlipped
                ? "rgba(99,102,241,0.08)"
                : "#020617",
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* 카드 이미지 영역 (클릭 → 이미지 선택) */}
            <div
              style={{
                aspectRatio: "1 / 1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15,23,42,0.8)",
                position: "relative",
              }}
              onClick={() => openCardModal(cardId)}
            >
              {cardData?.imageUrl ? (
                <img
                  src={cardData.imageUrl}
                  alt={cardData.title || cardId}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: isFlipped ? 1 : 0.4,
                    transition: "opacity 0.3s",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    textAlign: "center",
                    padding: 4,
                  }}
                >
                  + 이미지
                </span>
              )}

              {/* 카드 번호 */}
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: 3,
                  fontSize: 10,
                  padding: "1px 5px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.8)",
                  color: "#e5e7eb",
                }}
              >
                {cardId}
              </span>
            </div>

            {/* 카드 컨트롤 버튼 */}
            <div
              style={{
                display: "flex",
                gap: 3,
                padding: "3px 4px",
                background: "rgba(15,23,42,0.6)",
              }}
            >
              {/* 뒤집기 토글 */}
              <button
                type="button"
                onClick={() => handleToggleFlip(cardId)}
                style={{
                  flex: 1,
                  padding: "2px 0",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 10,
                  cursor: "pointer",
                  background: isFlipped
                    ? "rgba(99,102,241,0.3)"
                    : "rgba(55,65,81,0.6)",
                  color: isFlipped ? "#818cf8" : "#9ca3af",
                  fontWeight: 600,
                }}
              >
                {isFlipped ? "공개" : "비공개"}
              </button>

              {/* 매칭 토글 */}
              <button
                type="button"
                onClick={() => handleToggleMatch(cardId)}
                style={{
                  flex: 1,
                  padding: "2px 0",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 10,
                  cursor: "pointer",
                  background: isMatched
                    ? "rgba(16,185,129,0.3)"
                    : "rgba(55,65,81,0.6)",
                  color: isMatched ? "#4ade80" : "#9ca3af",
                  fontWeight: 600,
                }}
              >
                {isMatched ? "매칭✓" : "매칭"}
              </button>
            </div>
          </div>
        );
      }

      gridRows.push(
        <div
          key={r}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: 6,
          }}
        >
          {rowCards}
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 6 }}>
        {gridRows}
      </div>
    );
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
          maxWidth: 1100,
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
            alignItems: "center",
            marginBottom: 20,
            gap: 12,
            flexWrap: "wrap",
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
              🃏 시그헌터 플립 조정실
            </h1>
            <p style={{ marginTop: 4, fontSize: 13, color: "#9ca3af" }}>
              보드 ID: <strong>{boardId}</strong> /{" "}
              {config.name} — 카드 이미지 설정 및 공개 상태를 관리합니다.
            </p>
          </div>

          {/* 전체 제어 버튼 */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* 피드백 메시지 */}
            {(message || error) && (
              <span
                style={{
                  fontSize: 12,
                  color: error ? "#f97373" : "#4ade80",
                }}
              >
                {error || message}
              </span>
            )}

            {/* 전체 공개 버튼 */}
            <button
              type="button"
              onClick={handleFlipAll}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#f5f3ff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              전체 공개
            </button>

            {/* 전체 초기화 버튼 */}
            <button
              type="button"
              onClick={handleResetAll}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, #f97373, #ef4444)",
                color: "#fee2e2",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              전체 초기화
            </button>
          </div>
        </div>

        {/* 카드 그리드 */}
        {loadingBoard ? (
          <p style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
            카드 정보를 불러오는 중입니다...
          </p>
        ) : (
          renderGrid()
        )}

        {/* 이미지 선택 모달 */}
        {selectedCardId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
            }}
            onClick={closeModal}
          >
            <div
              style={{
                width: 780,
                maxHeight: "80vh",
                background: "#020617",
                borderRadius: 16,
                padding: 16,
                border: "1px solid #4b5563",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h2 style={{ fontSize: 16, margin: 0 }}>
                  카드 {selectedCardId}에 넣을 이미지 선택
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                    background: "#111827",
                    color: "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  닫기
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  borderRadius: 10,
                  border: "1px solid #374151",
                }}
              >
                {libraryLoading ? (
                  <p style={{ padding: 12, color: "#9ca3af" }}>
                    이미지 목록을 불러오는 중...
                  </p>
                ) : libraryError ? (
                  <p style={{ padding: 12, color: "#f97373" }}>
                    {libraryError}
                  </p>
                ) : libraryItems.length === 0 ? (
                  <p style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
                    등록된 이미지가 없습니다. 먼저{" "}
                    <strong>시그 이미지 관리 페이지</strong>에서 업로드해
                    주세요.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                      gap: 10,
                      padding: 10,
                    }}
                  >
                    {libraryItems.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => handleSelectImageForCard(img)}
                        style={{
                          borderRadius: 10,
                          border: "1px solid #4b5563",
                          background: "#020617",
                          padding: 4,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          color: "#e5e7eb",
                        }}
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.title || img.id}
                          style={{
                            width: "100%",
                            height: 80,
                            borderRadius: 8,
                            objectFit: "cover",
                            marginBottom: 4,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {img.title || "(제목 없음)"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}