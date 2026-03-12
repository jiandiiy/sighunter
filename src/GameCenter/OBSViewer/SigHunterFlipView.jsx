// src/components/GameCenter/OBSViewer/SigHunterFlipView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  onSnapshot,
  doc,
  collection,
  getDoc,
} from "firebase/firestore";
import { db } from "../../core/firebase";
import ObsFlipCard from "./ObsFlipCard";
import "./obs.css";

// 기본 보드 config (Firestore에 config 문서 없을 때 fallback)
const DEFAULT_CONFIG = {
  rows: 4,
  cols: 6,
  name: "시그헌터 플립",
  flipMode: "single", // "single": 한 장씩 | "all": 전체 공개
};

export default function SigHunterFlipView() {
  const { boardId } = useParams();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cards, setCards] = useState({});   // { cardId: { imageUrl, isFlipped, isMatched, ... } }
  const [loading, setLoading] = useState(true);

  // Firestore 실시간 구독
  useEffect(() => {
    if (!boardId) return;

    const boardRef = doc(db, "sigHunterFlipBoards", boardId);
    const cardsRef = collection(boardRef, "cards");
    let unsubCards;

    (async () => {
      try {
        setLoading(true);

        // config 문서 읽기
        const snap = await getDoc(boardRef);
        if (snap.exists() && snap.data()?.config) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data().config });
        } else {
          setConfig(DEFAULT_CONFIG);
        }

        // cards 실시간 구독 (카드 상태 변경 시 즉시 반영)
        unsubCards = onSnapshot(cardsRef, (qs) => {
          const map = {};
          qs.forEach((d) => {
            map[d.id] = d.data();
          });
          setCards(map);
          setLoading(false);
        });
      } catch (e) {
        console.error("[SigHunterFlipView] error", e);
        setLoading(false);
      }
    })();

    return () => {
      if (unsubCards) unsubCards();
    };
  }, [boardId]);

  const { rows, cols } = config;

  // 통계: 전체/뒤집힌/매칭 카드 수
  const stats = useMemo(() => {
    const cardList = Object.values(cards);
    return {
      total: rows * cols,
      flipped: cardList.filter((c) => c.isFlipped).length,
      matched: cardList.filter((c) => c.isMatched).length,
    };
  }, [cards, rows, cols]);

  // 그리드 렌더링
  const renderGrid = () => {
    const gridRows = [];

    for (let r = 0; r < rows; r++) {
      const rowCards = [];

      for (let c = 0; c < cols; c++) {
        const cardId = String(r * cols + c + 1); // 1 ~ rows*cols
        const cardData = cards[cardId];

        rowCards.push(
          <ObsFlipCard
            key={cardId}
            cardId={cardId}
            imageUrl={cardData?.imageUrl || null}
            backImageUrl={cardData?.backImageUrl || null}
            title={cardData?.title || ""}
            isFlipped={cardData?.isFlipped ?? false}
            isMatched={cardData?.isMatched ?? false}
          />
        );
      }

      gridRows.push(
        <div
          key={r}
          className="obs-grid-row"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {rowCards}
        </div>
      );
    }

    return (
      <div
        className="obs-grid"
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {gridRows}
      </div>
    );
  };

  return (
    <div className="obs-root">
      {/* 상단 헤더 */}
      <div className="obs-header">
        <h1>SIG HUNTER FLIP</h1>
        <p>
          {boardId}
          {config.name ? ` · ${config.name}` : ""}
        </p>

        {/* 통계 바 */}
        {!loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 20,
              marginTop: 6,
              fontSize: 12,
              color: "rgba(209,213,219,0.8)",
            }}
          >
            {/* 전체 카드 수 */}
            <span>
              전체{" "}
              <strong style={{ color: "#e5e7eb" }}>{stats.total}</strong>장
            </span>

            {/* 뒤집힌 카드 수 */}
            <span>
              공개{" "}
              <strong style={{ color: "#60a5fa" }}>{stats.flipped}</strong>장
            </span>

            {/* 매칭 완료 */}
            <span>
              매칭{" "}
              <strong style={{ color: "#4ade80" }}>{stats.matched}</strong>장
            </span>

            {/* 진행률 */}
            <span>
              진행률{" "}
              <strong style={{ color: "#fbbf24" }}>
                {stats.total > 0
                  ? Math.round((stats.flipped / stats.total) * 100)
                  : 0}
                %
              </strong>
            </span>
          </div>
        )}

        {/* 진행률 바 */}
        {!loading && (
          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 999,
              background: "rgba(55,65,81,0.8)",
              overflow: "hidden",
              maxWidth: 320,
              margin: "8px auto 0",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
                width: `${
                  stats.total > 0
                    ? (stats.flipped / stats.total) * 100
                    : 0
                }%`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        )}
      </div>

      {/* 카드 그리드 */}
      <div className="obs-grid-wrapper">
        {loading ? (
          <div className="obs-loading">
            <div
              className="obs-spinner"
              style={{ width: 36, height: 36 }}
            />
            <span>카드를 불러오는 중입니다...</span>
          </div>
        ) : (
          renderGrid()
        )}
      </div>
    </div>
  );
}