// src/components/HPBattle/HpOverlay.jsx
import React, { useEffect, useState } from "react";
import HpBar from "./HpBar";
import {
  BATTLE_MODES,
  createInitialBattleState,
} from "../../../utils/hpBattle/battleTypes";
import { subscribeBattleState } from "../../../utils/hpBattle/battleStorage";
import "./HpBattle.css";

export default function HpOverlay({ battleId = "sig-hp" }) {
  const [state, setState] = useState(() =>
    createInitialBattleState(BATTLE_MODES.ONE_VS_ONE)
  );

  useEffect(() => {
    const unsubscribe = subscribeBattleState(battleId, (val) => {
      if (val) setState(val);
    });
    return () => unsubscribe();
  }, [battleId]);

  // state가 혹시 null/undefined로 들어와도 방어
  const safeState = state || createInitialBattleState(BATTLE_MODES.ONE_VS_ONE);
  const { mode, fighters = [], lastAction } = safeState;

  return (
    <div className="hp-overlay-root">
      {mode === BATTLE_MODES.TEAM_VS_ONE && fighters.length >= 1 && (
        <div className="hp-overlay-mode-team-vs-one">
          <div className="hp-overlay-title">TEAM vs BOSS</div>
          <div className="hp-overlay-boss-wrap">
            <HpBar fighter={fighters[0]} lastAction={lastAction} />
          </div>
        </div>
      )}

      {mode === BATTLE_MODES.ONE_VS_ONE && fighters.length >= 2 && (
        <div className="hp-overlay-mode-1v1">
          <div className="hp-overlay-title">1 vs 1 BATTLE</div>
          <div className="hp-overlay-1v1-bars">
            <div className="hp-overlay-1v1-left">
              <HpBar fighter={fighters[0]} lastAction={lastAction} />
            </div>
            <div className="hp-overlay-1v1-vs">VS</div>
            <div className="hp-overlay-1v1-right">
              <HpBar fighter={fighters[1]} lastAction={lastAction} />
            </div>
          </div>
        </div>
      )}

      {mode === BATTLE_MODES.FFA_3 && fighters.length >= 3 && (
        <div className="hp-overlay-mode-ffa3">
          <div className="hp-overlay-title">1 vs 1 vs 1</div>
          <div className="hp-overlay-ffa3-bars">
            {fighters.slice(0, 3).map((f) => (
              <div key={f.id} className="hp-overlay-ffa3-item">
                <HpBar fighter={f} lastAction={lastAction} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}