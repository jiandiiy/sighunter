// src/components/HPBattle/HpBar.jsx
import React from "react";
import "./HpBattle.css";

export default function HpBar({ fighter, lastAction }) {
  // fighter가 없을 때 바로 return 해서 렌더를 막거나,
  // 기본값을 주고 안전하게 구조분해합니다.

  if (!fighter) {
    // 아직 데이터 안 온 상태면 아무 것도 안 그리거나 로딩 표시
    return null;
  }

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

  return (
    <div className="hpbar-root">
      <div className="hpbar-header">
        <span className="hpbar-name">{name}</span>
        <span className="hpbar-value">
          {hp} / {maxHp}
        </span>
      </div>
      <div className={barClass}>
        <div className="hpbar-fill" style={{ width: `${ratio * 100}%` }} />
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