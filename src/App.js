import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SigHunterFlip from "./components/SigHunterFlip/SigHunterFlip";
import AdminPopup from "./components/SigHunterFlip/AdminPopup";
import EditMessageModal from "./components/SigHunterFlip/EditMessageModal";
import AdminPage from "./components/pages/AdminPage";
import OverlayPage from "./components/pages/OverlayPage";


export default function App() {
  return (
    <Router>
      <Routes>
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
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/overlay" element={<OverlayPage />} />

      </Routes>
    </Router>
  );
}