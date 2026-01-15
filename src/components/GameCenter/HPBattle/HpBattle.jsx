// src/GameCenter/HPBattle/HpBattle.jsx
import React from "react";
import HpBar from "./HpBar";
import HpControl from "./HpControl";
import HpOverlay from "./HpOverlay";
import "./HpBattle.css";

export default function HpBattle() {
  const battleId = "sig-hp"; // 컨트롤/오버레이/게이지에서 같이 쓰는 ID

  return (
    <div className="hp-battle-page">
      {/* 상단: 게이지바 */}
      <HpBar battleId={battleId} />

      {/* 중간: 공격 이펙트 오버레이 (필요 없으면 빼도 됨) */}
      <HpOverlay battleId={battleId} />

      {/* 하단: HP Battle Control 패널 */}
      <HpControl battleId={battleId} />
    </div>
  );
}