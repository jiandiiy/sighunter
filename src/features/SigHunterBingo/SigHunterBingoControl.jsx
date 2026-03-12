// src/components/GameCenter/SigHunterBingo/SigHunterBingoControl.jsx

import React from "react";
import "./SigHunterBingoBoard.css";
import {
  useSigHunterBingoState,
  AVAILABLE_SIZES,
} from "./useSigHunterBingoState";

export default function SigHunterBingoControl({ boardId = "hunter1" }) {
  const {
    loading,
    mode,
    size,
    cellCount,
    cells,
    HUNTER_MODES,
    handleChangeMode,
    handleChangeSize,
    handleResetBoard,
    handleChangeCellImage,
    getCurrentImage,
    fileInputRefs,
  } = useSigHunterBingoState(boardId);

  if (loading) {
    return <div style={{ color: "#fff" }}>로딩 중...</div>;
  }

  return (
    <div className="hunter-root">
      <header className="hunter-header">
        <div className="hunter-header-row">
          {/* 모드 탭 */}
          <div className="hunter-mode-tabs">
            {HUNTER_MODES.map((m) => (
              <button
                key={m}
                className={
                  "hunter-tab" + (mode === m ? " hunter-tab--active" : "")
                }
                onClick={() => handleChangeMode(m)}
              >
                {m === "muse" ? "뮤즈" : "퀸덤"}
              </button>
            ))}
          </div>

          {/* 3x3 / 5x5 탭 */}
          <div className="hunter-mode-tabs" style={{ marginLeft: 12 }}>
            {AVAILABLE_SIZES.map((s) => (
              <button
                key={s}
                className={
                  "hunter-tab" + (size === s ? " hunter-tab--active" : "")
                }
                onClick={() => handleChangeSize(s)}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        <h2 className="hunter-title-text">
          🎯 시그 땅따먹기 – 이미지 설정 페이지 🎯
        </h2>
      </header>

      <div className="hunter-main">
        <div className="hunter-main-left">
          <div className="hunter-line-count-under-board">
            <button
              type="button"
              className="hunter-reset-btn"
              onClick={handleResetBoard}
            >
              현재 모드/사이즈 초기화
            </button>
          </div>

          {/* 메인 그리드 + 셀별 이미지 미리보기 */}
          <div
            className="hunter-grid"
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {cells.slice(0, cellCount).map((cell) => {
              const currentImage = getCurrentImage(cell);

              return (
                <div key={cell.id} className="hunter-cell">
                  <div className="hunter-cell-inner">
                    <div className="hunter-cell-front">
                      {/* 현재 셀 이미지 미리보기 */}
                      {currentImage ? (
                        <div className="hunter-sig-image-wrap">
                          <img
                            src={currentImage}
                            alt={cell.sigName}
                            className="hunter-sig-image"
                          />
                        </div>
                      ) : (
                        <div className="hunter-sig-image-placeholder">
                          이미지 없음
                        </div>
                      )}

                      {/* 설정 전용: 이미지 업로드 버튼 */}
                      <button
                        type="button"
                        className="hunter-img-change-btn"
                        onClick={() => {
                          const input = fileInputRefs.current[cell.id];
                          if (input) input.click();
                        }}
                        title="이미지 설정/변경"
                      >
                        📷 이미지 설정
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        ref={(el) => {
                          fileInputRefs.current[cell.id] = el;
                        }}
                        onChange={(e) => handleChangeCellImage(e, cell.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 우측: 사용 안내 + (선택) 전체 이미지 썸네일 목록 */}
        <aside className="hunter-main-right">
          <section className="hunter-log-section">
            <h3 className="hunter-log-title">사용 안내</h3>
            <div className="hunter-log-list">
              <div className="hunter-log-item">
                <span className="hunter-log-text">
                  각 칸의 &quot;📷 이미지 설정&quot; 버튼을 눌러 이미지를
                  업로드하면,
                  <br />
                  시그헌터 빙고 보드(OBS에 띄운 페이지)에 실시간으로
                  반영됩니다.
                </span>
              </div>
              <div className="hunter-log-item">
                <span className="hunter-log-text">
                  같은 보드 ID(<code>{boardId}</code>)를 사용하는 보드 화면과
                  설정 화면은
                  <br />
                  Firebase 저장소를 통해 항상 동기화됩니다.
                </span>
              </div>
            </div>
          </section>

          {/* (옵션) 등록된 이미지 전체 썸네일 목록 */}
          <section className="hunter-log-section" style={{ marginTop: 16 }}>
            <h3 className="hunter-log-title">등록된 이미지 미리보기</h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {cells
                .slice(0, cellCount)
                .filter((cell) => getCurrentImage(cell))
                .map((cell) => {
                  const img = getCurrentImage(cell);
                  return (
                    <div
                      key={`thumb-${cell.id}`}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 6,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.2)",
                        cursor: "pointer",
                      }}
                      title={`셀 ${cell.id}`}
                      onClick={() => {
                        const input = fileInputRefs.current[cell.id];
                        if (input) input.click();
                      }}
                    >
                      <img
                        src={img}
                        alt={`cell-${cell.id}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  );
                })}

              {cells.filter((c) => getCurrentImage(c)).length === 0 && (
                <div style={{ color: "#aaa", fontSize: 12 }}>
                  아직 등록된 이미지가 없습니다.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}