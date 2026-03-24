// src/components/GameCenter/OBSViewer/SigHunterBingoView.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  onSnapshot,
  doc,
  collection,
  getDoc,
} from "firebase/firestore";
import { db } from "../shared/core/firebase";
import ObsCell from "./ObsCell";
import "./obs.css";

const DEFAULT_CONFIG = {
  rows: 5,
  cols: 5,
  name: "시그헌터 빙고",
};

export default function SigHunterBingoView() {
  const { boardId } = useParams();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cells, setCells] = useState({});
  const [loading, setLoading] = useState(true);

  // Firestore 실시간 구독
  useEffect(() => {
    if (!boardId) return;

    const boardRef = doc(db, "sigHunterBingos", boardId);
    const cellsRef = collection(boardRef, "cells");
    let unsubCells;

    (async () => {
      try {
        setLoading(true);

        // config 읽기
        const snap = await getDoc(boardRef);
        if (snap.exists() && snap.data()?.config) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data().config });
        } else {
          setConfig(DEFAULT_CONFIG);
        }

        // cells 실시간 구독
        unsubCells = onSnapshot(cellsRef, (qs) => {
          const map = {};
          qs.forEach((d) => {
            map[d.id] = d.data();
          });
          setCells(map);
          setLoading(false);
        });
      } catch (e) {
        console.error("[SigHunterBingoView] error", e);
        setLoading(false);
      }
    })();

    return () => {
      if (unsubCells) unsubCells();
    };
  }, [boardId]);

  const { rows, cols } = config;

  const renderGrid = () => {
    const gridRows = [];

    for (let r = 0; r < rows; r++) {
      const rowCells = [];

      for (let c = 0; c < cols; c++) {
        const cellId = String(r * cols + c + 1); // 1 ~ rows*cols
        const cellData = cells[cellId];

        rowCells.push(
          <ObsCell
            key={cellId}
            cellId={cellId}
            imageUrl={cellData?.imageUrl || null}
            title={cellData?.title || ""}
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
          {rowCells}
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
      {/* 타이틀 (OBS에서 안 보이게 하고 싶으면 삭제) */}
      <div className="obs-header">
        <h1>SIG HUNTER BINGO</h1>
        <p>
          {boardId}
          {config.name ? ` · ${config.name}` : ""}
        </p>
      </div>

      {/* 그리드 영역 */}
      <div className="obs-grid-wrapper">
        {loading ? (
          <div className="obs-loading">
            <div className="obs-spinner" style={{ width: 36, height: 36 }} />
            <span>보드를 불러오는 중입니다...</span>
          </div>
        ) : (
          renderGrid()
        )}
      </div>
    </div>
  );
}