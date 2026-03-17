// src/App.js 전체 교체

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ── 기존 컴포넌트들 ──────────────────────────────────────────
import SigHunterFlip      from "./features/SigHunterFlip/SigHunterFlip";
import AdminPopup         from "./features/SigHunterFlip/AdminPopup";
import EditMessageModal   from "./features/SigHunterFlip/EditMessageModal";
import GameHub            from "./GameCenter/GameHub";
import MinesGame          from "./features/MinesGame";
import BoardGame          from "./features/BoardGame/BoardGame";
import CasinoWheelHuge    from "./features/BigWheel/CasinoWheelHuge";
import BingoBoard         from "./features/Bingo/BingoBoard";
import SigHunterBingoBoard   from "./features/SigHunterBingo/SigHunterBingoBoard";
import SigHunterBingoControl from "./features/SigHunterBingo/SigHunterBingoControl";
import SigImageAdminPage  from "./GameCenter/Admin/SigImageAdminPage";

// ── HP 배틀 ──────────────────────────────────────────────────
import HpBattle   from "./features/HPBattle/HpBattle";
import HpControl  from "./features/HPBattle/HpControl";
import HpOverlay  from "./features/HPBattle/HpOverlay";

// ── Admin ────────────────────────────────────────────────────
import SigHunterBoardControl from "./GameCenter/Admin/SigHunterBoardControl";
import SigHunterFlipControl  from "./GameCenter/Admin/SigHunterFlipControl";

// ── OBS 뷰어 ─────────────────────────────────────────────────
import {
  SigHunterBingoView,
  BingoView,
  SigHunterFlipView,
} from "./GameCenter/OBSViewer";

// ──────────────────────────────────────────────────────────────
// ★ Vercel 프로젝트별 기본 진입 경로
//   각 Vercel 프로젝트의 환경변수에서 설정
//   예) REACT_APP_DEFAULT_ROUTE=/bingo/1
// ──────────────────────────────────────────────────────────────
const DEFAULT_ROUTE = process.env.REACT_APP_DEFAULT_ROUTE || null;

export default function App() {
  return (
    <Router>
      <Routes>

        {/* ═══════════════════════════════════════════════════
            GameHub 레이아웃 (네비게이션 포함)
        ═══════════════════════════════════════════════════ */}
        <Route element={<GameHub />}>

          {/* ★ DEFAULT_ROUTE 가 설정된 Vercel 프로젝트면
                / 접속 시 해당 게임으로 바로 리다이렉트       */}
          <Route
            path="/"
            element={
              DEFAULT_ROUTE
                ? <Navigate to={DEFAULT_ROUTE} replace />
                : <SigHunterFlip />   // 기존 동작 유지
            }
          />

          {/* 기존 라우트 전부 유지 ─────────────────────────── */}
          <Route path="/sig"     element={<SigHunterFlip />} />
          <Route path="/mines"   element={<MinesGame />} />
          <Route path="/board"   element={<BoardGame />} />
          <Route path="/bigwheel" element={<CasinoWheelHuge />} />

          {/* 식대전 빙고 1 / 2 / 3 */}
          <Route
            path="/bingo/1"
            element={<BingoBoard key="bingo1" boardId="bingo1" currentBoardNo="1" />}
          />
          <Route
            path="/bingo/2"
            element={<BingoBoard key="bingo2" boardId="bingo2" currentBoardNo="2" />}
          />
          <Route
            path="/bingo/3"
            element={<BingoBoard key="bingo3" boardId="bingo3" currentBoardNo="3" />}
          />

          {/* 시그헌터 빙고 */}
          <Route
            path="/hunter-bingo"
            element={<SigHunterBingoBoard boardId="hunter-main" />}
          />
          <Route
            path="/hunter-bingo/control"
            element={<SigHunterBingoControl boardId="hunter-main" />}
          />

          {/* HP 배틀 */}
          <Route path="/hp-battle"  element={<HpBattle />} />
          <Route path="/hp-control" element={<HpControl battleId="sig-hp" />} />

          {/* Admin */}
          <Route path="/admin/sig"  element={<SigImageAdminPage />} />
          <Route
            path="/admin/sig-hunter-bingo/:boardId"
            element={<SigHunterBoardControl />}
          />
          <Route
            path="/admin/sig-hunter-flip/:boardId"
            element={<SigHunterFlipControl />}
          />

        </Route>
        {/* ═══ GameHub 끝 ═══════════════════════════════════ */}


        {/* ═══════════════════════════════════════════════════
            팝업 라우트 (독립 창)
        ═══════════════════════════════════════════════════ */}
        <Route
          path="/edit-message"
          element={<EditMessageModal onClose={() => window.close()} />}
        />
        <Route
          path="/admin-popup"
          element={<AdminPopup onClose={() => window.close()} />}
        />


        {/* ═══════════════════════════════════════════════════
            OBS 전용 라우트 (GameHub 밖)
        ═══════════════════════════════════════════════════ */}
        <Route path="/hp-overlay"
          element={<HpOverlay battleId="sig-hp" />}
        />
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