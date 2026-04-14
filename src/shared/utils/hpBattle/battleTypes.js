// src/utils/hpBattle/battleTypes.js

export const BATTLE_MODES = {
  TEAM_VS_ONE: "team-vs-one",
  ONE_VS_ONE: "one-vs-one",
  FFA_3: "ffa-3",
};

export const ACTION_TYPES = {
  ATTACK: "attack",
  DEFEND: "defend",
  HEAL: "heal",
  BUFF: "buff",
  DEBUFF: "debuff",
  SET_HP: "set-hp",
  ITEM: "item",
  SIG: "sig",
};

export const SIG_CONFIG = {
  ATTACK_PER_SIG: 10,
  HEAL_PER_SIG: 8,
  SHIELD_PER_SIG: 12,
};

export const ITEMS = [
  {
    id: "heal_potion",
    name: "힐 포션",
    type: "heal",
    amount: 200,
  },
  {
    id: "big_heal",
    name: "대형 힐",
    type: "heal",
    amount: 500,
  },
  {
    id: "shield_potion",
    name: "쉴드 포션",
    type: "shield",
    amount: 300,
  },
  {
    id: "atk_buff",
    name: "공격 버프",
    type: "buff",
    buff: {
      kind: "atk-mult",
      value: 1.5,
      duration: 3,
    },
  },
  {
    id: "def_debuff",
    name: "방어 디버프",
    type: "debuff",
    debuff: {
      kind: "def-mult",
      value: 0.7,
      duration: 3,
    },
  },
];
const DEFAULT_SIG = 980;

export function createFighter({ id, name, maxHp, isBoss = false }) {
  return {
    id,
    name,
    maxHp,
    hp: maxHp,
    shield: 0,
    buffs: [],
    debuffs: [],
    sig: DEFAULT_SIG,       
    atkMult: 1,   
    defMult: 1, 
    isBoss,  
  };
}

export function createInitialBattleState(mode) {
  switch (mode) {
    case BATTLE_MODES.TEAM_VS_ONE:
      return {
         mode,
        fighters: [
          createFighter({
            id: "boss",
            name: "BOSS",
            maxHp: 5000,
            isBoss: true,   // ★ 보스 플래그
          }),
        ],
        teamInfo: { name: "TEAM", totalDamage: 0 },
        lastAction: null,
      };

    case BATTLE_MODES.ONE_VS_ONE:
      return {
        mode,
        fighters: [
          createFighter({ id: "p1", name: "PLAYER 1", maxHp: 3000 }),
          createFighter({ id: "p2", name: "PLAYER 2", maxHp: 3000 }),
        ],
        lastAction: null,
      };

    case BATTLE_MODES.FFA_3:
      return {
        mode,
        fighters: [
          createFighter({ id: "p1", name: "PLAYER 1", maxHp: 2500 }),
          createFighter({ id: "p2", name: "PLAYER 2", maxHp: 2500 }),
          createFighter({ id: "p3", name: "PLAYER 3", maxHp: 2500 }),
        ],
        lastAction: null,
      };

    default:
      return {
        mode: BATTLE_MODES.ONE_VS_ONE,
        fighters: [
          createFighter({ id: "p1", name: "PLAYER 1", maxHp: 3000 }),
          createFighter({ id: "p2", name: "PLAYER 2", maxHp: 3000 }),
        ],
        lastAction: null,
      };
  }
}