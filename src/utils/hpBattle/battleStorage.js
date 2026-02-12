// src/utils/hpBattle/battleStorage.js
import { rtdb } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

console.log("🔥 db in battleStorage:", rtdb);

export async function loadBattleStateOnce(battleId = "default") {
  return new Promise((resolve) => {
    const battleRef = ref(rtdb, `battles/${battleId}`);

    let unsubscribe;

    unsubscribe = onValue(
      battleRef,
      (snapshot) => {
        if (unsubscribe) unsubscribe();
        const val = snapshot.val();
        if (!val) {
          resolve(null);
          return;
        }

        let fighters = val.fighters || [];
        if (!Array.isArray(fighters)) {
          fighters = Object.values(fighters);
        }

        resolve({
          ...val,
          fighters,
        });
      },
      (error) => {
        console.error("loadBattleStateOnce error", error);
        if (unsubscribe) unsubscribe();
        resolve(null);
      },
      { onlyOnce: true }
    );
  });
}

export function subscribeBattleState(battleId, callback) {
  const battleRef = ref(rtdb, `battles/${battleId}`);

  const unsubscribe = onValue(
    battleRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        callback(null);
        return;
      }

      let fighters = val.fighters || [];
      if (!Array.isArray(fighters)) {
        fighters = Object.values(fighters);
      }

      callback({
        ...val,
        fighters,
      });
    },
    (error) => {
      console.error("subscribeBattleState error", error);
    }
  );

  return () => unsubscribe();
}

export async function saveBattleState(battleId, state) {
  try {
    const battleRef = ref(rtdb, `battles/${battleId}`);
    await set(battleRef, state);
  } catch (error) {
    console.error("saveBattleState error", error);
  }
}