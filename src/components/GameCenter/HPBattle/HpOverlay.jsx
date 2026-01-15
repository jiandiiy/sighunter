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

  const safeState = state || createInitialBattleState(BATTLE_MODES.ONE_VS_ONE);
  const { mode, fighters = [], lastAction } = safeState;

  return (
    <div className="hp-overlay-root">
      {/* 1 vs 1 */}
      {mode === BATTLE_MODES.ONE_VS_ONE && fighters.length >= 2 && (
        <div className="hp-overlay-mode-1v1">
          <div className="hp-overlay-header">
            <div className="hp-overlay-title">1 VS 1 BATTLE</div>
          </div>

          <div className="hp-overlay-arena">
            <div className="hp-overlay-side hp-overlay-side--left">
              <div className="hp-overlay-avatar hp-overlay-avatar--left" />
              <HpBar fighter={fighters[0]} lastAction={lastAction} side="left" />
            </div>

            <div className="hp-overlay-center">
              <div className="hp-overlay-vs-badge">VS</div>
              <div className="hp-overlay-effects" />
            </div>

            <div className="hp-overlay-side hp-overlay-side--right">
              <div className="hp-overlay-avatar hp-overlay-avatar--right" />
              <HpBar
                fighter={fighters[1]}
                lastAction={lastAction}
                side="right"
              />
            </div>
          </div>
        </div>
      )}

      {/* TEAM vs 1 (보스) */}
      {mode === BATTLE_MODES.TEAM_VS_ONE && fighters.length >= 1 && (
        <div className="hp-overlay-mode-team">
          <div className="hp-overlay-header">
            <div className="hp-overlay-title">TEAM VS BOSS</div>
          </div>

          <div className="hp-overlay-arena hp-overlay-arena--team">
            {/* 왼쪽: 팀(최대 3명 정도 가정) */}
            <div className="hp-overlay-side hp-overlay-side--left hp-overlay-team-list">
              {fighters.slice(0, fighters.length - 1).map((f) => (
                <HpBar
                  key={f.id}
                  fighter={f}
                  lastAction={lastAction}
                  side="left"
                />
              ))}
            </div>

            {/* 가운데 VS */}
            <div className="hp-overlay-center">
              <div className="hp-overlay-vs-badge">VS</div>
              <div className="hp-overlay-effects" />
            </div>

            {/* 오른쪽: BOSS (마지막 파이터라고 가정) */}
            <div className="hp-overlay-side hp-overlay-side--right">
              <div className="hp-overlay-avatar hp-overlay-avatar--right" />
              <HpBar
                fighter={fighters[fighters.length - 1]}
                lastAction={lastAction}
                side="right"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1 vs 1 vs 1 (FFA_3) */}
      {mode === BATTLE_MODES.FFA_3 && fighters.length >= 3 && (
        <div className="hp-overlay-mode-ffa">
          <div className="hp-overlay-header">
            <div className="hp-overlay-title">1 VS 1 VS 1</div>
          </div>

          <div className="hp-overlay-arena hp-overlay-arena--ffa">
            <div className="hp-overlay-side hp-overlay-side--left">
              <HpBar
                fighter={fighters[0]}
                lastAction={lastAction}
                side="left"
              />
            </div>

            <div className="hp-overlay-center">
              <div className="hp-overlay-vs-badge">VS</div>
              <div className="hp-overlay-effects" />
            </div>

            <div className="hp-overlay-side hp-overlay-side--right">
              <HpBar
                fighter={fighters[1]}
                lastAction={lastAction}
                side="right"
              />
            </div>
          </div>

          {/* 세 번째 플레이어를 아래에 배치 */}
          <div className="hp-overlay-ffa-bottom">
            <HpBar
              fighter={fighters[2]}
              lastAction={lastAction}
              side="left"
            />
          </div>
        </div>
      )}
    </div>
  );
}