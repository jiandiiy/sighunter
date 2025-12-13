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

          {/* 식대전 빙고 1 / 2 */}
          <Route path="/bingo/1" element={<BingoBoard key="bingo1" />} />
          <Route path="/bingo/2" element={<BingoBoard key="bingo2" />} />

          {/* 시그헌터 빙고 */}
          <Route
            path="/hunter-bingo"
            element={<SigHunterBingoBoard boardId="hunter-main" />}
          />
        </Route>

        {/* ⛔ 중복 루트 제거: 이건 위의 "/" 와 겹치므로 빼는 게 안전 */}
        {/* <Route path="/" element={<SigHunterFlip />} /> */}

        {/* 팝업 라우트들 */}
        <Route
          path="/edit-message"
          element={<EditMessageModal onClose={() => window.close()} />}
        />
        <Route
          path="/admin-popup"
          element={<AdminPopup onClose={() => window.close()} />}
        />
      </Routes>
    </Router>
  );
}