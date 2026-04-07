// src/GameCenter/HPBattle/HpBattle.jsx
import React from "react";
import HpControl from "./HpControl";
import HpOverlay from "./HpOverlay";
import "../styles/HpBattle.css";

export default function HpBattle() {
  const battleId = "sig-hp";

  return (
    <div className="hp-battle-root">
   <div className="hp-battle-page">
  <div className="hp-battle-overlay-preview">
    <HpOverlay battleId={battleId} />
  </div>
  <div className="hp-battle-control-area">
    <HpControl battleId={battleId} />
  </div>
    </div>
    </div>
  );
}