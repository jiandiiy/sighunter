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
    sig = 0,        
    atkMult = 1,    
    defMult = 1,    
    buffs = [],
    debuffs = [],
    isBoss = false,
  } = fighter;

  const ratio = Math.max(0, Math.min(1, maxHp > 0 ? hp / maxHp : 0));
   const isLowHp = ratio <= 0.3; 

  const isTarget =
    lastAction && lastAction.toId === id && Date.now() - lastAction.time < 800;

  const isAttacked = isTarget && lastAction.type === "attack";
  const isHealed = isTarget && lastAction.type === "heal";
  const isDefended = isTarget && lastAction.type === "defend";
  const isItem = isTarget && lastAction.type === "item";
    const isSig = isTarget && lastAction.type === "sig";

  let barClass = "hpbar-bar";
  if (isAttacked) barClass += " hpbar-attack";
  if (isHealed) barClass += " hpbar-heal";
  if (isDefended) barClass += " hpbar-defend";
  if (isItem) barClass += " hpbar-item";
  if (isSig) barClass += " hpbar-sig";
  if (isLowHp) barClass += " hpbar-lowhp";          
  if (isBoss) barClass += " hpbar-boss";    
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

         {/* 시그/배율 정보 영역 */}
        <div className="hpbar-bottom-info">
          <span className="hpbar-sig-tag">SIG x{sig}</span>
          <span className="hpbar-mults-tag">
            ATK {Math.round(atkMult * 100)}% / DEF{" "}
            {Math.round(defMult * 100)}%
          </span>
        </div>

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