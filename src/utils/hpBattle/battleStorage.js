// src/utils/hpBattle/battleStorage.js
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";

console.log("🔥 db in battleStorage:", db);

export async function loadBattleStateOnce(battleId = "default") {
  return new Promise((resolve) => {
    const battleRef = ref(db, `battles/${battleId}`);

    let unsubscribe; // ✅ 먼저 선언만

    unsubscribe = onValue(
      battleRef,
      (snapshot) => {
        if (unsubscribe) unsubscribe(); // ✅ 호출
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
  const battleRef = ref(db, `battles/${battleId}`);

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
    const battleRef = ref(db, `battles/${battleId}`);
    await set(battleRef, state);
  } catch (error) {
    console.error("saveBattleState error", error);
  }
}