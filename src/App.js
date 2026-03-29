// src/App.js

import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ── 레이아웃 ───────────────────────────────────────
import GameHub from "./layout/GameHub";
// ── SigHunterFlip 팝업 / HP 배틀 컴포넌트 (자주 쓰이므로 즉시 로드) ──
import AdminPopup from "./games/sig-hunter-flip/components/AdminPopup";
import EditMessageModal from "./games/sig-hunter-flip/components/EditMessageModal";

import HpControl from "./games/hp-battle/components/HpControl";
import HpOverlay from "./games/hp-battle/components/HpOverlay";

// ── lazy 로드: 게임 엔트리 ─────────────────────────
const SigHunterFlip = lazy(() => import("./games/sig-hunter-flip"));
const MinesGame = lazy(() => import("./games/mines"));
const BoardGame = lazy(() => import("./games/board-game"));
const BigWheel = lazy(() => import("./games/big-wheel"));
const HpBattle = lazy(() => import("./games/hp-battle"));
const SigHunterBingoBoard = lazy(() => import("./games/sig-hunter-bingo"));
const BingoBoard = lazy(() => import("./games/meal-bingo"));

// ── lazy 로드: Admin ──────────────────────────────
const SigImageAdminPage = lazy(() => import("./Admin/SigImageAdminPage"));
const SigHunterBoardControl = lazy(() => import("./Admin/SigHunterBoardControl"));
const SigHunterFlipControl = lazy(() => import("./Admin/SigHunterFlipControl"));

// ── lazy 로드: OBS 뷰어 ────────────────────────────
const ObsModule = lazy(() => import("./obs"));
// ObsModule 안에서 { SigHunterBingoView, BingoView, SigHunterFlipView } export 중


// ───────────────────────────────────────────────────
// ★ Vercel 프로젝트별 기본 진입 경로
//   예) REACT_APP_DEFAULT_ROUTE=/bingo/1
// ───────────────────────────────────────────────────
const DEFAULT_ROUTE = process.env.REACT_APP_DEFAULT_ROUTE || null;

// 공통 로딩 UI
function PageFallback() {
  return (
    <div style={{ padding: 16 }}>
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ═══════════════════════════════════════════════
              GameHub 레이아웃 (네비게이션 포함)
          ═══════════════════════════════════════════════ */}
          <Route element={<GameHub />}>
            {/* DEFAULT_ROUTE 설정 시 / → 해당 경로로 리다이렉트 */}
            <Route
              path="/"
              element={
                DEFAULT_ROUTE ? (
                  <Navigate to={DEFAULT_ROUTE} replace />
                ) : (
                  <SigHunterFlip />
                )
              }
            />

            {/* 기존 라우트 유지 */}
            <Route path="/sig" element={<SigHunterFlip />} />
            <Route path="/mines" element={<MinesGame />} />
            <Route path="/board" element={<BoardGame />} />
            <Route path="/bigwheel" element={<BigWheel />} />

            {/* 식대전 빙고 1 / 2 / 3 */}
            <Route
              path="/bingo/1"
              element={
                <BingoBoard key="bingo1" boardId="bingo1" currentBoardNo="1" />
              }
            />
            <Route
              path="/bingo/2"
              element={
                <BingoBoard key="bingo2" boardId="bingo2" currentBoardNo="2" />
              }
            />
            <Route
              path="/bingo/3"
              element={
                <BingoBoard key="bingo3" boardId="bingo3" currentBoardNo="3" />
              }
            />

            {/* 시그헌터 빙고 */}
            <Route
              path="/hunter-bingo"
              element={<SigHunterBingoBoard boardId="hunter-main" />}
            />

            {/* HP 배틀 */}
            <Route path="/hp-battle" element={<HpBattle />} />
            <Route path="/hp-control" element={<HpControl battleId="sig-hp" />} />

            {/* Admin */}
            <Route path="/admin/sig" element={<SigImageAdminPage />} />
            <Route
              path="/admin/sig-hunter-bingo/:boardId"
              element={<SigHunterBoardControl />}
            />
            <Route
              path="/admin/sig-hunter-flip/:boardId"
              element={<SigHunterFlipControl />}
            />
          </Route>
          {/* ═══ GameHub 끝 ═══════════════════════════════ */}

          {/* ═══════════════════════════════════════════════
              팝업 라우트 (독립 창)
          ═══════════════════════════════════════════════ */}
          <Route
            path="/edit-message"
            element={<EditMessageModal onClose={() => window.close()} />}
          />
          <Route
            path="/admin-popup"
            element={<AdminPopup onClose={() => window.close()} />}
          />

          {/* ═══════════════════════════════════════════════
              OBS 전용 라우트 (GameHub 밖)
          ═══════════════════════════════════════════════ */}
          <Route path="/hp-overlay" element={<HpOverlay battleId="sig-hp" />} />

          {/* ObsModule 안의 named export 사용 */}
          <Route
            path="/obs/sig-hunter-bingo/:boardId"
            element={
              <Suspense fallback={<PageFallback />}>
                <ObsModule.SigHunterBingoView />
              </Suspense>
            }
          />
          <Route
            path="/obs/bingo/:boardId"
            element={
              <Suspense fallback={<PageFallback />}>
                <ObsModule.BingoView />
              </Suspense>
            }
          />
          <Route
            path="/obs/sig-hunter-flip/:boardId"
            element={
              <Suspense fallback={<PageFallback />}>
                <ObsModule.SigHunterFlipView />
              </Suspense>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}