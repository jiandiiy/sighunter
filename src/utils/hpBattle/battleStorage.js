// src/utils/hpBattle/battleStorage.js
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

console.log("🔥 db in battleStorage:", db); // <= 이 줄 반드시 추가

export async function loadBattleStateOnce(battleId = "default") {
  return new Promise((resolve) => {
    const battleRef = ref(db, `battles/${battleId}`);

    const unsubscribe = onValue(
      battleRef,
      (snapshot) => {
        unsubscribe();
        const val = snapshot.val();
        resolve(val || null);
      },
      (error) => {
        console.error("loadBattleStateOnce error", error);
        resolve(null);
      },
      { onlyOnce: true }
    );
  });
}

export function subscribeBattleState(battleId, callback) {
  const battleRef = ref(db, `battles/${battleId}`);

  const unsubscribe = onValue(
    battleRef,
    (snapshot) => {
      const val = snapshot.val();
      callback(val || null);
    },
    (error) => {
      console.error("subscribeBattleState error", error);
    }
  );

  return () => unsubscribe();
}

export async function saveBattleState(battleId, state) {
  try {
    const battleRef = ref(db, `battles/${battleId}`);
    await set(battleRef, state);
  } catch (error) {
    console.error("saveBattleState error", error);
  }
}