// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ── 기존 컴포넌트들 ──────────────────────────────────────────
import SigHunterFlip from "./components/SigHunterFlip/SigHunterFlip";
import AdminPopup from "./components/SigHunterFlip/AdminPopup";
import EditMessageModal from "./components/SigHunterFlip/EditMessageModal";
import GameHub from "./components/GameCenter/GameHub";
import MinesGame from "./components/GameCenter/MinesGame";
import BoardGame from "./components/GameCenter/BoardGame/BoardGame";
import CasinoWheelHuge from "./components/GameCenter/BigWheel/CasinoWheelHuge";
import BingoBoard from "./components/GameCenter/Bingo/BingoBoard";
import SigHunterBingoBoard from "./components/GameCenter/SigHunterBingo/SigHunterBingoBoard";
import SigHunterBingoControl from "./components/GameCenter/SigHunterBingo/SigHunterBingoControl";
import SigImageAdminPage from "./components/GameCenter/Admin/SigImageAdminPage";

// ── HP 배틀 ──────────────────────────────────────────────────
import HpBattle from "./components/GameCenter/HPBattle/HpBattle";
import HpControl from "./components/GameCenter/HPBattle/HpControl";
import HpOverlay from "./components/GameCenter/HPBattle/HpOverlay";

// ── 신규: 보드 조정실 (Admin, GameHub 안) ────────────────────
import SigHunterBoardControl from "./components/GameCenter/Admin/SigHunterBoardControl";
import SigHunterFlipControl from "./components/GameCenter/Admin/SigHunterFlipControl";

// ── 신규: OBS 뷰어 (GameHub 밖, 독립 라우트) ─────────────────
import {
  SigHunterBingoView,
  BingoView,
  SigHunterFlipView,
} from "./components/GameCenter/OBSViewer";

export default function App() {
  return (
    <Router>
      <Routes>

        {/* ═══════════════════════════════════════════════════
            GameHub 레이아웃 안 (네비게이션 포함)
        ═══════════════════════════════════════════════════ */}
        <Route element={<GameHub />}>

          {/* 메인 게임들 */}
          <Route path="/" element={<SigHunterFlip />} />
          <Route path="/sig" element={<SigHunterFlip />} />
          <Route path="/mines" element={<MinesGame />} />
          <Route path="/board" element={<BoardGame />} />
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

          {/* 시그헌터 빙고 보드 (기존 OBS/시청자용) */}
          <Route
            path="/hunter-bingo"
            element={<SigHunterBingoBoard boardId="hunter-main" />}
          />

          {/* 시그헌터 빙고 설정 (기존 관리자용) */}
          <Route
            path="/hunter-bingo/control"
            element={<SigHunterBingoControl boardId="hunter-main" />}
          />

          {/* HP 배틀 */}
          <Route path="/hp-battle" element={<HpBattle />} />
          <Route path="/hp-control" element={<HpControl battleId="sig-hp" />} />

          {/* ─────────────────────────────────────────────────
              Admin (관리자 전용)
          ───────────────────────────────────────────────── */}

          {/* 이미지 라이브러리 CRUD */}
          <Route path="/admin/sig" element={<SigImageAdminPage />} />

          {/* 시그헌터 빙고 보드 조정실
              ex) /admin/sig-hunter-bingo/hunter-main */}
          <Route
            path="/admin/sig-hunter-bingo/:boardId"
            element={<SigHunterBoardControl />}
          />

          {/* 시그헌터 플립 조정실
              ex) /admin/sig-hunter-flip/flip-main */}
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
            OBS 전용 라우트 (GameHub 밖, 순수 뷰어)
            → OBS 브라우저 소스 URL로 직접 사용
            → /hp-overlay 와 동일한 패턴
        ═══════════════════════════════════════════════════ */}

        {/* HP 오버레이 (기존) */}
        <Route path="/hp-overlay" element={<HpOverlay battleId="sig-hp" />} />

        {/* 시그헌터 빙고 OBS 뷰어
            OBS URL: /obs/sig-hunter-bingo/hunter-main */}
        <Route
          path="/obs/sig-hunter-bingo/:boardId"
          element={<SigHunterBingoView />}
        />

        {/* 식대전 빙고 OBS 뷰어
            OBS URL: /obs/meal-bingo/bingo1 */}
        <Route
          path="/obs/bingo/:boardId"
          element={<BingoView />}
        />

        {/* 시그헌터 플립 OBS 뷰어
            OBS URL: /obs/sig-hunter-flip/flip-main */}
        <Route
          path="/obs/sig-hunter-flip/:boardId"
          element={<SigHunterFlipView />}
        />

      </Routes>
    </Router>
  );
}