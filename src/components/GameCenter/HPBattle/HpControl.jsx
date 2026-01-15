// src/components/HPBattle/HpControl.jsx
import React, { useEffect, useState } from "react";
import {
  BATTLE_MODES,
  ACTION_TYPES,
  SIG_CONFIG,
  ITEMS,
  createInitialBattleState,
} from "../../../utils/hpBattle/battleTypes";
import {
  loadBattleStateOnce,
  saveBattleState,
} from "../../../utils/hpBattle/battleStorage";
import "./HpBattle.css";

const { ATTACK_PER_SIG, HEAL_PER_SIG, SHIELD_PER_SIG } = SIG_CONFIG;

export default function HpControl({ battleId = "sig-hp" }) {
  const [state, setState] = useState(() =>
    createInitialBattleState(BATTLE_MODES.ONE_VS_ONE)
  );
  const [sigValue, setSigValue] = useState(1);
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

        let atkMult = 1;
        attacker?.buffs?.forEach((b) => {
          if (b.kind === "atk-mult") atkMult *= b.value;
        });

        let defMult = 1;
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

  return (
    <div className="hpctrl-root">
      <header className="hpctrl-header">
        <h1>HP Battle Control</h1>
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

      <section className="hpctrl-main">
        <div className="hpctrl-fighters">
          {fighters.map((f) => (
            <div key={f.id} className="hpctrl-fighter-card">
              <div className="hpctrl-fighter-header">
                <span className="hpctrl-fighter-name">{f.name}</span>
              </div>
              <div className="hpctrl-row">
                <label>
                  Max HP:
                  <input
                    type="number"
                    value={f.maxHp}
                    onChange={(e) =>
                      handleSetMaxHp(f.id, e.target.value)
                    }
                  />
                </label>
              </div>
              <div className="hpctrl-row">
                <label>
                  HP:
                  <input
                    type="number"
                    value={f.hp}
                    onChange={(e) => handleSetHp(f.id, e.target.value)}
                  />
                </label>
              </div>
              <div className="hpctrl-row">
                <label>
                  Shield:
                  <input
                    type="number"
                    value={f.shield || 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) || 0;
                      updateFighters((prev) =>
                        prev.map((x) =>
                          x.id === f.id ? { ...x, shield: Math.max(0, v) } : x
                        )
                      );
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="hpctrl-actions">
          <div className="hpctrl-row">
            <label>
              시그 개수:
              <input
                type="number"
                value={sigValue}
                min={0}
                onChange={(e) => setSigValue(e.target.value)}
                style={{ width: 80, marginLeft: 8 }}
              />
            </label>
            <span style={{ marginLeft: 8, fontSize: 12 }}>
              어택: {ATTACK_PER_SIG} / 시그, 힐: {HEAL_PER_SIG} / 시그, 쉴드:{" "}
              {SHIELD_PER_SIG} / 시그
            </span>
          </div>

          <div className="hpctrl-row">
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

            <label style={{ marginLeft: 16 }}>
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

          <div className="hpctrl-row hpctrl-buttons">
            <button onClick={() => applyAction(ACTION_TYPES.ATTACK)}>
              어택
            </button>
            <button onClick={() => applyAction(ACTION_TYPES.DEFEND)}>
              방어(쉴드)
            </button>
            <button onClick={() => applyAction(ACTION_TYPES.HEAL)}>
              증가(힐)
            </button>
          </div>

          <div className="hpctrl-row">
            <h3>아이템 적용</h3>
            <div style={{ marginTop: 4 }}>
              <label>
                아이템:
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  style={{ marginLeft: 4 }}
                >
                  <option value="">선택</option>
                  {ITEMS.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </label>
              <button style={{ marginLeft: 8 }} onClick={applyItem}>
                적용
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}