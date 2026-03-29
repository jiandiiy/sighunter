// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ── 게임들 ──────────────────────────────────────────
// 각 폴더에 index import 형태로 정리
import SigHunterFlip from "./games/sig-hunter-flip";
import MinesGame from "./games/mines";
import BoardGame from "./games/board-game";
import BigWheel from "./games/big-wheel";
import HpBattle from "./games/hp-battle";
import SigHunterBingoBoard from "./games/sig-hunter-bingo";
import BingoBoard from "./games/meal-bingo";

// SigHunterFlip 팝업 관련 (폴더 내부 파일 직접 import)
import AdminPopup from "./games/sig-hunter-flip/components/AdminPopup";
import EditMessageModal from "./games/sig-hunter-flip/components/EditMessageModal";

// ── 레이아웃 ───────────────────────────────────────
import GameHub from "./layout/GameHub";

// ── HP 배틀 ────────────────────────────────────────
import HpControl from "./games/hp-battle/components/HpControl";
import HpOverlay from "./games/hp-battle/components/HpOverlay";

// ── Admin ─────────────────────────────────────────
import SigImageAdminPage from "./Admin/SigImageAdminPage";
import SigHunterBoardControl from "./Admin/SigHunterBoardControl";
import SigHunterFlipControl from "./Admin/SigHunterFlipControl"; 

// ── OBS 뷰어 ───────────────────────────────────────
import {
  SigHunterBingoView,
  BingoView,
  SigHunterFlipView,
} from "./obs";

// ───────────────────────────────────────────────────
// ★ Vercel 프로젝트별 기본 진입 경로
//   예) REACT_APP_DEFAULT_ROUTE=/bingo/1
// ───────────────────────────────────────────────────
const DEFAULT_ROUTE = process.env.REACT_APP_DEFAULT_ROUTE || null;

export default function App() {
  return (
    <Router>
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

          {/* 기존 라우트 유지 (경로만 새 구조에 맞게) */}
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
        <Route
          path="/obs/sig-hunter-bingo/:boardId"
          element={<SigHunterBingoView />}
        />
        <Route
          path="/obs/bingo/:boardId"
          element={<BingoView />}
        />
        <Route
          path="/obs/sig-hunter-flip/:boardId"
          element={<SigHunterFlipView />}
        />
      </Routes>
    </Router>
  );
}