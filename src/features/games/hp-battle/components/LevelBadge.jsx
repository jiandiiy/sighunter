// src/components/HPBattle/LevelBadge.jsx
import React from "react";

/**
 * shield.jpg: 은빛 날개 원형 프레임 이미지
 * - 이미지 자체가 방패 외곽 장식
 * - 중앙 검은 원 안에 레벨 숫자를 절대 위치로 오버레이
 */
export default function LevelBadge({ level = 1, side = "left" }) {
  return (
    <div className="level-badge-root">
      {/* 방패 프레임 이미지 */}
      <img
        src="/images/overlay/shield.png"
        alt="shield"
        className="level-badge-img"
      />
      {/* 중앙 레벨 숫자 */}
      <span className="level-badge-number">{level}</span>
    </div>
  );
}
