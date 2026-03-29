// src/components/HPBattle/HpOverlay.jsx
import React, { useEffect, useState } from "react";
import HpBar from "./HpBar";
import {
  BATTLE_MODES,
  createInitialBattleState,
} from "../../../shared/utils";
import { subscribeBattleState } from "../../../shared/utils";
import "../styles/HpBattle.css";

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
      <div className="hp-overlay-inner">
        {/* ===========================
            ONE_VS_ONE (기본 이미지 레이아웃)
        ============================ */}
        {mode === BATTLE_MODES.ONE_VS_ONE && fighters.length >= 2 && (
          <>
            <div className="hp-overlay-top">
              <div className="hp-overlay-top-inner">
                {/* 왼쪽 */}
                <div className="hp-overlay-side hp-overlay-side--left">
                  <div className="hp-name-label">{fighters[0].name}</div>
                  <HpBar
                    fighter={fighters[0]}
                    lastAction={lastAction}
                    side="left"
                  />
                </div>

                {/* 중앙 ∞ */}
                <div className="hp-overlay-center-icon">∞</div>

                {/* 오른쪽 */}
                <div className="hp-overlay-side hp-overlay-side--right">
                  <div className="hp-name-label">{fighters[1].name}</div>
                  <HpBar
                    fighter={fighters[1]}
                    lastAction={lastAction}
                    side="right"
                  />
                </div>
              </div>
            </div>

            {/* 하단 About HP 영역 */}
            <div className="hp-overlay-bottom">
              <div className="hp-overlay-bottom-inner">
                <div className="hp-overlay-bottom-label">About HP</div>
                <div className="hp-overlay-bottom-text">
                  Reduce the opponent&apos;s HP to 0
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===========================
            TEAM_VS_ONE
            - 왼쪽: 팀 여러 명 세로
            - 중앙: ∞ (또는 BOSS 아이콘)
            - 오른쪽: 보스 HP 바 한 개
        ============================ */}
        {mode === BATTLE_MODES.TEAM_VS_ONE && fighters.length >= 1 && (
          <>
            <div className="hp-overlay-top">
              <div className="hp-overlay-top-inner">
                {/* 왼쪽: 팀 리스트 */}
                <div className="hp-overlay-side hp-overlay-side--left">
                  <div className="hp-name-label">TEAM</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {fighters
                      .filter((f) => f.id !== "boss")
                      .map((f) => (
                        <HpBar
                          key={f.id}
                          fighter={f}
                          lastAction={lastAction}
                          side="left"
                        />
                      ))}
                  </div>
                </div>

                {/* 중앙 아이콘 (∞ 그대로 사용) */}
                <div className="hp-overlay-center-icon">∞</div>

                {/* 오른쪽: 보스 (id === "boss" 가정, 없으면 마지막 파이터) */}
                <div className="hp-overlay-side hp-overlay-side--right">
                  <div className="hp-name-label">
                    {fighters.find((f) => f.id === "boss")?.name ||
                      fighters[fighters.length - 1].name}
                  </div>
                  <HpBar
                    fighter={
                      fighters.find((f) => f.id === "boss") ||
                      fighters[fighters.length - 1]
                    }
                    lastAction={lastAction}
                    side="right"
                  />
                </div>
              </div>
            </div>

            {/* 하단 설명 바 (원하면 문구만 팀전에 맞게 변경 가능) */}
            <div className="hp-overlay-bottom">
              <div className="hp-overlay-bottom-inner">
                <div className="hp-overlay-bottom-label">About HP</div>
                <div className="hp-overlay-bottom-text">
                  Reduce the boss&apos;s HP to 0
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===========================
            FFA_3 (1 vs 1 vs 1)
            - 상단: 1 vs 1 (왼/오른쪽)
            - 하단 중앙: 3번째 플레이어 HP 바
        ============================ */}
        {mode === BATTLE_MODES.FFA_3 && fighters.length >= 3 && (
          <>
            <div className="hp-overlay-top">
              <div className="hp-overlay-top-inner">
                {/* 왼쪽 */}
                <div className="hp-overlay-side hp-overlay-side--left">
                  <div className="hp-name-label">{fighters[0].name}</div>
                  <HpBar
                    fighter={fighters[0]}
                    lastAction={lastAction}
                    side="left"
                  />
                </div>

                {/* 중앙 ∞ (여기서는 단순 VS 뱃지 느낌으로 유지) */}
                <div className="hp-overlay-center-icon">∞</div>

                {/* 오른쪽 */}
                <div className="hp-overlay-side hp-overlay-side--right">
                  <div className="hp-name-label">{fighters[1].name}</div>
                  <HpBar
                    fighter={fighters[1]}
                    lastAction={lastAction}
                    side="right"
                  />
                </div>
              </div>
            </div>

            {/* 하단: 3번째 플레이어 */}
            <div className="hp-overlay-bottom">
              <div className="hp-overlay-bottom-inner">
                <div className="hp-overlay-bottom-label">
                  {fighters[2].name}
                </div>
                <div className="hp-overlay-bottom-text">
                  <HpBar
                    fighter={fighters[2]}
                    lastAction={lastAction}
                    side="left"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* 다른 모드이거나 데이터 부족 시 빈 오버레이 유지 */}
        {![BATTLE_MODES.ONE_VS_ONE, BATTLE_MODES.TEAM_VS_ONE, BATTLE_MODES.FFA_3].includes(
          mode
        ) && (
          <div className="hp-overlay-top">
            <div className="hp-overlay-top-inner" />
          </div>
        )}
      </div>
    </div>
  );
}