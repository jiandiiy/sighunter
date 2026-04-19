// src/components/HPBattle/HpBar.jsx
import React from "react";
import "../styles/HpBattle.css";

export default function HpBar({
  fighter,
  lastAction,
  side = "left",
  variant = "hp", // "hp" | "mp"
}) {
  if (!fighter) return null;

  const {
    id = "unknown",
    hp = 0,
    maxHp = 1,
    shield = 0,
    isBoss = false,
  } = fighter;

  const ratio = Math.max(0, Math.min(1, maxHp > 0 ? hp / maxHp : 0));
  const isLowHp = ratio <= 0.3;

  const isTarget =
    lastAction && lastAction.toId === id && Date.now() - lastAction.time < 800;

  const isAttacked = isTarget && lastAction.type === "attack";
  const isHealed   = isTarget && lastAction.type === "heal";
  const isDefended = isTarget && lastAction.type === "defend";
  const isItem     = isTarget && lastAction.type === "item";
  const isSig      = isTarget && lastAction.type === "sig";

  let barClass = "hpbar-bar";
  if (isAttacked) barClass += " hpbar-attack";
  if (isHealed)   barClass += " hpbar-heal";
  if (isDefended) barClass += " hpbar-defend";
  if (isItem)     barClass += " hpbar-item";
  if (isSig)      barClass += " hpbar-sig";
  if (variant === "hp" && isLowHp) barClass += " hpbar-lowhp";
  if (variant === "hp" && isBoss)  barClass += " hpbar-boss";
  barClass += side === "right" ? " hpbar-bar--right" : " hpbar-bar--left";

  return (
    <div
      className={`hpbar-root hpbar-root--${side}`}
      data-variant={variant}
    >
      {/* hpbar-header 제거 — 수치는 바 안쪽으로 이동 */}

      <div className={barClass}>
        <div className="hpbar-frame">
          <div
            className="hpbar-energy-fill"
            style={{ width: `${ratio * 100}%` }}
          />
          {/* 현재값: 바 왼쪽 안 / 최대값: 바 오른쪽 안 */}
         <span className={`hpbar-value hpbar-value--${side}`}>
    {side === "right" ? `${maxHp} / ${hp}` : `${hp} / ${maxHp}`}
  </span>
        </div>

        {/* 쉴드: HP 바에서만 표시 */}
        {variant === "hp" && shield > 0 && (
          <div className="hpbar-shield">🛡 {shield}</div>
        )}
      </div>
    </div>
  );
}
