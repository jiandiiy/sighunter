import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SigHunterFlip from "./components/SigHunterFlip/SigHunterFlip";
import AdminPopup from "./components/SigHunterFlip/AdminPopup";
import EditMessageModal from "./components/SigHunterFlip/EditMessageModal";
import GameHub from "./components/GameCenter/GameHub";
import MinesGame from "./components/GameCenter/MinesGame";
import BoardGame from "./components/GameCenter/BoardGame/BoardGame";
import BigWheelGame from "./components/GameCenter/BigWheelGame";




export default function App() {
  return (
    <Router>
      <Routes>
        {/* 메인 게임 허브 */}
        <Route element={<GameHub />}>
          {/* 기본: 시그헌터 */}
          <Route path="/" element={<SigHunterFlip />} />
          <Route path="/sig" element={<SigHunterFlip />} />

          {/* 지뢰게임 */}
          <Route path="/mines" element={<MinesGame />} />
            <Route path="/board" element={<BoardGame />} />  
            <Route path="/bigwheel" element={<BigWheelGame />} />  
        </Route>

        <Route path="/" element={<SigHunterFlip />} />
         {/* ✏️ 메시지 수정 모달을 팝업 창용 라우트로 */}
        <Route
          path="/edit-message"
          element={<EditMessageModal onClose={() => window.close()} />}
        />

        {/* ⚙️ 어드민 확률 조절 팝업 창용 라우트 */}
        <Route
          path="/admin-popup"
          element={<AdminPopup onClose={() => window.close()} />}
        />

      </Routes>
    </Router>
  );
}