// src/components/HPBattle/HpBar.jsx
import React from "react";
import "../styles/HpBattle.css";

export default function HpBar({ fighter, lastAction, side = "left" }) {
  if (!fighter) return null;

  const {
    id = "unknown",
    name = "PLAYER",
    hp = 0,
    maxHp = 1,
    shield = 0,
    buffs = [],
    debuffs = [],
  } = fighter;

  const ratio = Math.max(0, Math.min(1, maxHp > 0 ? hp / maxHp : 0));

  const isTarget =
    lastAction && lastAction.toId === id && Date.now() - lastAction.time < 800;

  const isAttacked = isTarget && lastAction.type === "attack";
  const isHealed = isTarget && lastAction.type === "heal";
  const isDefended = isTarget && lastAction.type === "defend";
  const isItem = isTarget && lastAction.type === "item";

  let barClass = "hpbar-bar";
  if (isAttacked) barClass += " hpbar-attack";
  if (isHealed) barClass += " hpbar-heal";
  if (isDefended) barClass += " hpbar-defend";
  if (isItem) barClass += " hpbar-item";
  barClass += side === "right" ? " hpbar-bar--right" : " hpbar-bar--left";

  return (
    <div className={`hpbar-root hpbar-root--${side}`}>
      <div className="hpbar-header">
        <span className="hpbar-name">{name}</span>
        <span className="hpbar-value">
          {hp} / {maxHp}
        </span>
      </div>

      {/* ENERGY 스타일 바 */}
      <div className={barClass}>
        <div className="hpbar-frame">
          {/* 파란 에너지 채움 */}
          <div
            className="hpbar-energy-fill"
            style={{ width: `${ratio * 100}%` }}
          />
       
        </div>

        {/* 버프/디버프/쉴드: 프레임 위에 겹쳐서 표시 */}
        {shield > 0 && <div className="hpbar-shield">🛡 {shield}</div>}
        <div className="hpbar-tags">
          {buffs.map((b) => (
            <span key={b.id} className="hpbar-tag hpbar-tag--buff">
              {b.kind === "atk-mult" ? "ATK↑" : "BUFF"}
            </span>
          ))}
          {debuffs.map((d) => (
            <span key={d.id} className="hpbar-tag hpbar-tag--debuff">
              {d.kind === "def-mult" ? "DEF↓" : "DEBUFF"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}