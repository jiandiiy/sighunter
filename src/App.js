// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SigHunterFlip from "./components/SigHunterFlip/SigHunterFlip";
import AdminPopup from "./components/SigHunterFlip/AdminPopup";
import EditMessageModal from "./components/SigHunterFlip/EditMessageModal";
import GameHub from "./components/GameCenter/GameHub";
import MinesGame from "./components/GameCenter/MinesGame";
import BoardGame from "./components/GameCenter/BoardGame/BoardGame";
import CasinoWheelHuge from "./components/GameCenter/BigWheel/CasinoWheelHuge";
import BingoBoard from "./components/GameCenter/Bingo/BingoBoard";
import SigHunterBingoBoard from "./components/GameCenter/SigHunterBingo/SigHunterBingoBoard";

// HP 배틀 관련
import HpBattle from "./components/GameCenter/HPBattle/HpBattle";
import HpControl from "./components/GameCenter/HPBattle/HpControl";
import HpOverlay from "./components/GameCenter/HPBattle/HpOverlay";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 메인 게임 허브 */}
        <Route element={<GameHub />}>
          <Route path="/" element={<SigHunterFlip />} />
          <Route path="/sig" element={<SigHunterFlip />} />
          <Route path="/mines" element={<MinesGame />} />
          <Route path="/board" element={<BoardGame />} />
          <Route path="/bigwheel" element={<CasinoWheelHuge />} />

          {/* 식대전 빙고 1 / 2 / 3 */}
          <Route
            path="/bingo/1"
            element={<BingoBoard key="bingo1" boardId="bingo1" />}
          />
          <Route
            path="/bingo/2"
            element={<BingoBoard key="bingo2" boardId="bingo2" />}
          />
          <Route
            path="/bingo/3"
            element={<BingoBoard key="bingo3" boardId="bingo3" />}
          />

          {/* 시그헌터 빙고 */}
          <Route
            path="/hunter-bingo"
            element={<SigHunterBingoBoard boardId="hunter-main" />}
          />

          {/* HP 배틀 전체 페이지 (원하면 GameHub 안에서도 라우트로 접근) */}
          <Route path="/hp-battle" element={<HpBattle />} />

          {/* HP 배틀 컨트롤만 단독으로 보고 싶을 때 */}
          <Route path="/hp-control" element={<HpControl battleId="sig-hp" />} />
        </Route>

        {/* 팝업 라우트들 */}
        <Route
          path="/edit-message"
          element={<EditMessageModal onClose={() => window.close()} />}
        />
        <Route
          path="/admin-popup"
          element={<AdminPopup onClose={() => window.close()} />}
        />

        {/* OBS용 HP 게이지/오버레이 전용 화면 */}
        <Route path="/hp-overlay" element={<HpOverlay battleId="sig-hp" />} />
      </Routes>
    </Router>
  );
}