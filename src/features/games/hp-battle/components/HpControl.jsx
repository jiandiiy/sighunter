// src/components/HPBattle/HpControl.jsx
import React, { useEffect, useState } from "react";
import {
  BATTLE_MODES,
  ACTION_TYPES,
  SIG_CONFIG,
  ITEMS,
  createInitialBattleState,
} from "../../../../shared/utils";
import {
  loadBattleStateOnce,
  saveBattleState,
} from "../../../../shared/utils";
import "../styles/HpBattle.css";

const { ATTACK_PER_SIG, HEAL_PER_SIG, SHIELD_PER_SIG } = SIG_CONFIG;
const DEFAULT_SIG = 980;

export default function HpControl({ battleId = "sig-hp" }) {
  const [state, setState] = useState(() =>
    createInitialBattleState(BATTLE_MODES.ONE_VS_ONE)
  );
  const [sigValue, setSigValue] =  useState(DEFAULT_SIG);
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");

  useEffect(() => {
    let alive = true;
    async function init() {
      const stored = await loadBattleStateOnce(battleId);
      if (!alive) return;
      if (stored) setState(stored);
    }
    init();
    return () => {
      alive = false;
    };
  }, [battleId]);

  useEffect(() => {
    saveBattleState(battleId, state);
  }, [battleId, state]);

  const { mode, fighters } = state;

  const handleChangeMode = (nextMode) => {
    setState(createInitialBattleState(nextMode));
    setSelectedFrom("");
    setSelectedTo("");
  };

  const updateFighters = (updater) => {
    setState((prev) => ({ ...prev, fighters: updater(prev.fighters) }));
  };

  const applyAction = (actionType) => {
    const sig = parseInt(sigValue, 10) || 0;

    setState((prev) => {
      const now = Date.now();
      const fightersCopy = prev.fighters.map((f) => ({ ...f }));

      const fromId =
        mode === BATTLE_MODES.TEAM_VS_ONE && actionType === ACTION_TYPES.ATTACK
          ? "team"
          : selectedFrom || null;

      const toId = selectedTo || null;
      if (!toId) return prev;

      const target = fightersCopy.find((f) => f.id === toId);
      if (!target) return prev;

      if (actionType === ACTION_TYPES.ATTACK) {
        let baseDamage = sig * ATTACK_PER_SIG;

        const attacker =
          fromId && fromId !== "team"
            ? fightersCopy.find((f) => f.id === fromId)
            : null;

        let atkMult = attacker?.atkMult ?? 1;   // ★ 기본 배율
  attacker?.buffs?.forEach((b) => {
    if (b.kind === "atk-mult") atkMult *= b.value;
  });

        let defMult = target.defMult ?? 1;      // ★ 방어 배율
  target.debuffs?.forEach((d) => {
    if (d.kind === "def-mult") defMult *= 1 / d.value;
  });

        let damage = Math.round(baseDamage * atkMult * defMult);
        let remainingDamage = damage;

        if (target.shield && target.shield > 0) {
          const absorb = Math.min(target.shield, remainingDamage);
          target.shield -= absorb;
          remainingDamage -= absorb;
        }

        target.hp = Math.max(0, target.hp - remainingDamage);
      }

      if (actionType === ACTION_TYPES.HEAL) {
        const heal = sig * HEAL_PER_SIG;
        target.hp = Math.min(target.maxHp, target.hp + heal);
      }

      if (actionType === ACTION_TYPES.DEFEND) {
        const shieldGain = sig * SHIELD_PER_SIG;
        target.shield = (target.shield || 0) + shieldGain;
      }
      // ★ 시그 자체를 누적 + 배율 계산
    if (actionType === ACTION_TYPES.SIG) {
      const nextSig = Math.max(0, (target.sig || 0) + sig);

      // 예시 규칙: 시그 1개당 ATK +5%, DEF +2%
      const atkMult = 1 + nextSig * 0.05;
      const defMult = 1 + nextSig * 0.02;

      // 시그에 따른 HP 보정(선택사항)
      const hpDelta = sig * HEAL_PER_SIG; // 혹은 별도 상수
      const nextHp = Math.max(
        0,
        Math.min(target.maxHp, target.hp + hpDelta)
      );

      target.sig = nextSig;
      target.atkMult = atkMult;
      target.defMult = defMult;
      target.hp = nextHp;
    }

      return {
        ...prev,
        fighters: fightersCopy,
        lastAction: {
          type: actionType,
          fromId,
          toId,
          value:
            actionType === ACTION_TYPES.ATTACK
              ? sig * ATTACK_PER_SIG
              : actionType === ACTION_TYPES.HEAL
              ? sig * HEAL_PER_SIG
              : undefined,
          sigUsed: sig,
          time: now,
        },
      };
    });
  };

  const handleSetHp = (id, val) => {
    const hpNum = parseInt(val, 10);
    if (Number.isNaN(hpNum)) return;
    setState((prev) => {
      const fightersCopy = prev.fighters.map((f) =>
        f.id === id
          ? { ...f, hp: Math.max(0, Math.min(f.maxHp, hpNum)) }
          : f
      );
      return {
        ...prev,
        fighters: fightersCopy,
        lastAction: {
          type: ACTION_TYPES.SET_HP,
          toId: id,
          value: hpNum,
          time: Date.now(),
        },
      };
    });
  };

  const handleSetMaxHp = (id, val) => {
    const maxNum = parseInt(val, 10);
    if (Number.isNaN(maxNum) || maxNum <= 0) return;
    setState((prev) => {
      const fightersCopy = prev.fighters.map((f) => {
        if (f.id !== id) return f;
        const newHp = Math.min(f.hp, maxNum);
        return { ...f, maxHp: maxNum, hp: newHp };
      });
      return { ...prev, fighters: fightersCopy };
    });
  };

  const handleSetName = (id, val) => {
    setState((prev) => {
      const fightersCopy = prev.fighters.map((f) =>
        f.id === id ? { ...f, name: val } : f
      );
      return { ...prev, fighters: fightersCopy };
    });
  };

  const applyItem = () => {
    if (!selectedItemId || !selectedTo) return;
    const item = ITEMS.find((i) => i.id === selectedItemId);
    if (!item) return;

    setState((prev) => {
      const fightersCopy = prev.fighters.map((f) => ({ ...f }));
      const target = fightersCopy.find((f) => f.id === selectedTo);
      if (!target) return prev;

      const now = Date.now();

      if (item.type === "heal") {
        target.hp = Math.min(target.maxHp, target.hp + item.amount);
      } else if (item.type === "shield") {
        target.shield = (target.shield || 0) + item.amount;
      } else if (item.type === "buff" && item.buff) {
        const newBuff = {
          id: item.id + "_" + now,
          kind: item.buff.kind,
          value: item.buff.value,
          durationLeft: item.buff.duration,
        };
        target.buffs = [...(target.buffs || []), newBuff];
      } else if (item.type === "debuff" && item.debuff) {
        const newDebuff = {
          id: item.id + "_" + now,
          kind: item.debuff.kind,
          value: item.debuff.value,
          durationLeft: item.debuff.duration,
        };
        target.debuffs = [...(target.debuffs || []), newDebuff];
      }

      return {
        ...prev,
        fighters: fightersCopy,
        lastAction: {
          type: ACTION_TYPES.ITEM,
          fromId: selectedFrom || null,
          toId: selectedTo,
          itemId: item.id,
          time: now,
        },
      };
    });
  };

  // PLAYER 1 / PLAYER 2 등 좌우 카드 분리
  const leftFighter = fighters[0];
  const rightFighter = fighters[1] || fighters[0]; // 1vs1 기준, 없으면 fallback

  return (
    <div className="hpctrl-root">
      <header className="hpctrl-header">
        <h1 className="hpctrl-title">HP Battle Control</h1>
        <div className="hpctrl-mode-tabs">
          <button
            className={
              "hpctrl-tab" +
              (mode === BATTLE_MODES.TEAM_VS_ONE ? " hpctrl-tab--active" : "")
            }
            onClick={() => handleChangeMode(BATTLE_MODES.TEAM_VS_ONE)}
          >
            TEAM vs 1
          </button>
          <button
            className={
              "hpctrl-tab" +
              (mode === BATTLE_MODES.ONE_VS_ONE ? " hpctrl-tab--active" : "")
            }
            onClick={() => handleChangeMode(BATTLE_MODES.ONE_VS_ONE)}
          >
            1 vs 1
          </button>
          <button
            className={
              "hpctrl-tab" +
              (mode === BATTLE_MODES.FFA_3 ? " hpctrl-tab--active" : "")
            }
            onClick={() => handleChangeMode(BATTLE_MODES.FFA_3)}
          >
            1 vs 1 vs 1
          </button>
        </div>
      </header>

      {/* 좌우 플레이어 + 중앙 컨트롤 */}
      <section className="hpctrl-layout">
        {/* 왼쪽 플레이어 카드 */}
        {leftFighter && (
          <section className="hpctrl-player hpctrl-player--left">
            <h2 className="hpctrl-player-title">{leftFighter.name}</h2>

            <label className="hpctrl-player-row">
              <span>Name:</span>
              <input
                type="text"
                value={leftFighter.name}
                onChange={(e) =>
                  handleSetName(leftFighter.id, e.target.value)
                }
              />
            </label>

            <label className="hpctrl-player-row">
              <span>Max HP:</span>
              <input
                type="number"
                value={leftFighter.maxHp}
                onChange={(e) =>
                  handleSetMaxHp(leftFighter.id, e.target.value)
                }
              />
            </label>
            <label className="hpctrl-player-row">
              <span>HP:</span>
              <input
                type="number"
                value={leftFighter.hp}
                onChange={(e) =>
                  handleSetHp(leftFighter.id, e.target.value)
                }
              />
            </label>
            <label className="hpctrl-player-row">
              <span>Shield:</span>
              <input
                type="number"
                value={leftFighter.shield || 0}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) || 0;
                  updateFighters((prev) =>
                    prev.map((x) =>
                      x.id === leftFighter.id
                        ? { ...x, shield: Math.max(0, v) }
                        : x
                    )
                  );
                }}
              />
            </label>
          </section>
        )}

        {/* 중앙 액션 영역 */}
        <section className="hpctrl-center">
          <div className="hpctrl-center-row">
            <div className="hpctrl-center-col">
              <label className="hpctrl-label-inline">
                시그 개수:
                <input
                  type="number"
                  value={sigValue}
                  min={0}
                  onChange={(e) => setSigValue(e.target.value)}
                  className="hpctrl-sig-input"
                />
              </label>
              <div className="hpctrl-sig-desc">
                어택: {ATTACK_PER_SIG} / 시그, 힐: {HEAL_PER_SIG} / 시그, 쉴드:{" "}
                {SHIELD_PER_SIG} / 시그
              </div>
            </div>
          </div>

          <div className="hpctrl-center-row">
            <div className="hpctrl-center-col">
              <label>
                From:
                <select
                  value={selectedFrom}
                  onChange={(e) => setSelectedFrom(e.target.value)}
                >
                  <option value="">선택</option>
                  {mode === BATTLE_MODES.TEAM_VS_ONE && (
                    <option value="team">TEAM (단체)</option>
                  )}
                  {fighters.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="hpctrl-center-col">
              <label>
                To:
                <select
                  value={selectedTo}
                  onChange={(e) => setSelectedTo(e.target.value)}
                >
                  <option value="">선택</option>
                  {fighters.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="hpctrl-buttons">
            <button onClick={() => applyAction(ACTION_TYPES.ATTACK)}>
              어택
            </button>
            <button onClick={() => applyAction(ACTION_TYPES.DEFEND)}>
              방어(쉴드)
            </button>
            <button onClick={() => applyAction(ACTION_TYPES.HEAL)}>
              증가(힐)
            </button>
             <button onClick={() => applyAction(ACTION_TYPES.SIG)}>
    시그만 적용(+/-)
             </button>
          </div>

          <div className="hpctrl-item-block">
            <h3 className="hpctrl-item-title">아이템 적용</h3>
            <div className="hpctrl-item-row">
              <label>
                아이템:
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  <option value="">선택</option>
                  {ITEMS.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={applyItem}>적용</button>
            </div>
          </div>
        </section>

        {/* 오른쪽 플레이어 카드 */}
        {rightFighter && (
          <section className="hpctrl-player hpctrl-player--right">
            <h2 className="hpctrl-player-title">{rightFighter.name}</h2>

            <label className="hpctrl-player-row">
              <span>Name:</span>
              <input
                type="text"
                value={rightFighter.name}
                onChange={(e) =>
                  handleSetName(rightFighter.id, e.target.value)
                }
              />
            </label>

            <label className="hpctrl-player-row">
              <span>Max HP:</span>
              <input
                type="number"
                value={rightFighter.maxHp}
                onChange={(e) =>
                  handleSetMaxHp(rightFighter.id, e.target.value)
                }
              />
            </label>
            <label className="hpctrl-player-row">
              <span>HP:</span>
              <input
                type="number"
                value={rightFighter.hp}
                onChange={(e) =>
                  handleSetHp(rightFighter.id, e.target.value)
                }
              />
            </label>
            <label className="hpctrl-player-row">
              <span>Shield:</span>
              <input
                type="number"
                value={rightFighter.shield || 0}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) || 0;
                  updateFighters((prev) =>
                    prev.map((x) =>
                      x.id === rightFighter.id
                        ? { ...x, shield: Math.max(0, v) }
                        : x
                    )
                  );
                }}
              />
            </label>
          </section>
        )}
      </section>
    </div>
  );
}