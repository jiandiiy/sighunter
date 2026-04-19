// src/components/HPBattle/PlayerHud.jsx
import React from "react";
import HpBar from "./HpBar";
import LevelBadge from "./LevelBadge";

export default function PlayerHud({ fighter, side = "left" }) {
  if (!fighter) return null;

  const level = fighter.level ?? 60;
  const isRight = side === "right";

  // 정보줄에 필요한 값 추출 (HpBar에서 꺼내온 것들)
  const {
    sig = 0,
    atkMult = 1,
    defMult = 1,
    guard = 0,
    maxGuard = 1,
  } = fighter;

  const bars = (
    <div className="player-hud-bars">
      {/* HP 게이지 바 */}
      <HpBar
        fighter={fighter}
        lastAction={fighter.lastAction}
        side={side}
        variant="hp"
      />
      {/* MP 게이지 바 */}
      <HpBar
        fighter={{
          ...fighter,
          hp: fighter.mp ?? 0,
          maxHp: fighter.maxMp ?? 1,
        }}
        lastAction={null}
        side={side}
        variant="mp"
      />
      {/* 정보줄: MP 바 아래에 위치 */}
      <div className={`hpbar-info-row hpbar-info-row--${side}`}>
        <span className="hpbar-info-sig">SIG x{sig}</span>
        <span className="hpbar-info-mults">
          ATK {Math.round(atkMult * 100)}% / DEF {Math.round(defMult * 100)}%
        </span>
        <span className="hpbar-info-guard">
          {guard} / {maxGuard}
        </span>
      </div>
    </div>
  );

  const badge = (
    <div className="player-hud-level-wrapper">
      <LevelBadge level={level} side={side} />
    </div>
  );

  return (
    <div className={`player-hud player-hud--${side}`}>
      {/* 순서를 JSX에서 직접 제어: 왼쪽=[방패,바들] 오른쪽=[바들,방패] */}
      <div className="player-hud-row">
        {isRight ? (
          <>
            {bars}
            {badge}
          </>
        ) : (
          <>
            {badge}
            {bars}
          </>
        )}
      </div>
    </div>
  );
}
