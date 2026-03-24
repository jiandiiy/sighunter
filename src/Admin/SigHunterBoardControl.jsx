// src/pages/admin/SigHunterBoardControl.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  onSnapshot,
  doc,
  collection,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../src/shared/core/firebase";
import { fetchSigItems } from "../../src/shared/api/sigHunterImageLibraryApi";

// 기본 보드 설정 (config 문서 없을 때 fallback)
const DEFAULT_CONFIG = {
  rows: 5,
  cols: 5,
  name: "시그헌터 메인 보드",
};

export default function SigHunterBoardControl() {
  const { boardId } = useParams();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cells, setCells] = useState({}); // { cellId: { imageUrl, imageId, ... } }
  const [loadingBoard, setLoadingBoard] = useState(true);

  // 이미지 선택 모달 상태
  const [selectedCellId, setSelectedCellId] = useState(null);

  // 라이브러리 목록 (sig-images)
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");

  // 1) 보드 config + cells 실시간 구독
  useEffect(() => {
    if (!boardId) return;

    const boardRef = doc(db, "sigHunterBingoBoards", boardId);
    const cellsRef = collection(boardRef, "cells");
    let unsubCells;

    (async () => {
      try {
        setLoadingBoard(true);

        // config 문서 읽기 (없으면 DEFAULT_CONFIG 사용)
        const snap = await getDoc(boardRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.config) {
            setConfig({
              ...DEFAULT_CONFIG,
              ...data.config,
            });
          } else {
            setConfig(DEFAULT_CONFIG);
          }
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
          setLoadingBoard(false);
        });
      } catch (e) {
        console.error("[BoardControl] load board error", e);
        setLoadingBoard(false);
      }
    })();

    return () => {
      if (unsubCells) unsubCells();
    };
  }, [boardId]);

  // 2) 라이브러리 목록 불러오기 (시그 이미지 CRUD 페이지에서 쓰는 것과 동일한 API)
  const loadLibrary = useCallback(async () => {
    try {
      setLibraryError("");
      setLibraryLoading(true);

      // 필요하면 mode/type/rarity 필터를 prop/쿼리로 받거나 상단에 select 만들어도 됨
      const list = await fetchSigItems({
        type: "sighunter-bingo", // 빙고용 타입만 쓰고 싶을 때
        activeOnly: true,
      });

      setLibraryItems(list);
    } catch (e) {
      console.error("[BoardControl] load library error", e);
      setLibraryError("이미지 목록을 불러오는데 실패했습니다.");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // 3) 칸 클릭 → 모달 오픈 + 라이브러리 로딩
  const openCellModal = async (cellId) => {
    setSelectedCellId(cellId);
    await loadLibrary();
  };

  const closeModal = () => {
    setSelectedCellId(null);
  };

  // 4) 특정 이미지를 칸에 매핑 (Firestore 업데이트)
  const handleSelectImageForCell = async (image) => {
    if (!selectedCellId || !boardId) return;

    try {
      const boardRef = doc(db, "sigHunterBingoBoards", boardId);
      const cellRef = doc(boardRef, "cells", selectedCellId);

      await setDoc(
        cellRef,
        {
          imageId: image.id,
          imageUrl: image.imageUrl,
          title: image.title || "",
          updatedAt: new Date(),
        },
        { merge: true }
      );

      closeModal();
    } catch (e) {
      console.error("[BoardControl] select image error", e);
      alert("이 칸에 이미지를 설정하는 중 오류가 발생했습니다.");
    }
  };

  // 5) 그리드 렌더링
  const renderGrid = () => {
    const { rows, cols } = config;
    const gridRows = [];

    for (let r = 0; r < rows; r++) {
      const rowCells = [];
      for (let c = 0; c < cols; c++) {
        // cellId: 1~N (기존 slotIndex와 맞추고 싶으면 이렇게)
        const cellId = String(r * cols + c + 1);
        const cellData = cells[cellId];

        rowCells.push(
          <div
            key={cellId}
            style={{
              border: "1px solid #4b5563",
              borderRadius: 10,
              background: "#020617",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
            onClick={() => openCellModal(cellId)}
          >
            {cellData?.imageUrl ? (
              <img
                src={cellData.imageUrl}
                alt={cellData.title || cellId}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  color: "#6b7280",
                  fontSize: 12,
                  textAlign: "center",
                  padding: 4,
                }}
              >
                + 이미지 등록
              </span>
            )}

            {/* 칸 번호 라벨 */}
            <span
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.75)",
                color: "#e5e7eb",
              }}
            >
              {cellId}
            </span>
          </div>
        );
      }

      gridRows.push(
        <div
          key={r}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: 8,
          }}
        >
          {rowCells}
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gap: 8,
        }}
      >
        {gridRows}
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "24px 12px 40px",
        boxSizing: "border-box",
        background: "radial-gradient(circle at top, #111827 0, #020617 45%)",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.98))",
          borderRadius: 20,
          border: "1px solid rgba(148, 163, 184, 0.6)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.9)",
          padding: 24,
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
              🎮 시그헌터 빙고 보드 조정실
            </h1>
            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              보드 ID: <strong>{boardId}</strong> /{" "}
              {config.name || "이름 없음"} — 각 칸을 눌러 이미지를 설정하세요.
            </p>
          </div>
        </div>

        {/* 보드 */}
        {loadingBoard ? (
          <p
            style={{
              textAlign: "center",
              padding: 40,
              color: "#9ca3af",
            }}
          >
            보드 정보를 불러오는 중입니다...
          </p>
        ) : (
          <div
            style={{
              maxWidth: 620,
              margin: "0 auto",
              aspectRatio: "1 / 1",
            }}
          >
            {renderGrid()}
          </div>
        )}

        {/* 이미지 선택 모달 */}
        {selectedCellId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
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
                  marginBottom: 8,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    margin: 0,
                  }}
                >
                  칸 {selectedCellId}에 넣을 이미지 선택
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
                  <p
                    style={{
                      padding: 12,
                      fontSize: 13,
                      color: "#9ca3af",
                    }}
                  >
                    이미지 목록을 불러오는 중입니다...
                  </p>
                ) : libraryError ? (
                  <p
                    style={{
                      padding: 12,
                      fontSize: 13,
                      color: "#f97373",
                    }}
                  >
                    {libraryError}
                  </p>
                ) : libraryItems.length === 0 ? (
                  <p
                    style={{
                      padding: 12,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    등록된 이미지가 없습니다. 먼저{" "}
                    <strong>시그 이미지 관리 페이지</strong>에서 업로드해 주세요.
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
                        onClick={() => handleSelectImageForCell(img)}
                        style={{
                          borderRadius: 10,
                          border: "1px solid #4b5563",
                          background:
                            "linear-gradient(135deg,#020617,#020617)",
                          padding: 4,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          textAlign: "left",
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