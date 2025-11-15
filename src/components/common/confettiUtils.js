import confetti from "canvas-confetti";

// 🎇 불꽃놀이 효과
export const fireConfetti = (tier) => {
  try {
    const isLegend = ["전설", "레전드"].includes(tier);
    const isRare = ["희귀", "레어"].includes(tier);
    if (!isLegend && !isRare) return;

    const colors = isLegend
      ? ["#FFD700", "#FFA500", "#FF69B4", "#FA709A", "#FFF4B3"]
      : ["#93F9B9", "#77A1D3", "#B2FEFA", "#1D976C"];

    confetti({
      particleCount: 120,
      spread: 120,
      origin: { y: 0.6 },
      colors,
    });
  } catch (error) {
    console.error("Confetti 오류:", error);
  }
};

// 🎲 가중치 기반 선택
export function weightedPick(messages, weights) {
  const useWeights =
    Array.isArray(weights) && weights.length === messages.length
      ? weights
      : messages.map((m) => m.weight ?? 0);

  console.log(
    "🎲 [weightedPick] length:",
    messages.length,
    "weights:",
    useWeights
  );

  const total = useWeights.reduce((sum, w) => sum + (w || 0), 0) || 1;
  const r = Math.random() * total;
  console.log("🎲 [weightedPick] total:", total, "r:", r);

  let acc = 0;
  for (let i = 0; i < messages.length; i++) {
    acc += useWeights[i] || 0;
    if (r <= acc) {
      console.log("🎯 [weightedPick] picked index:", i, "msg:", messages[i]);
      return messages[i];
    }
  }
  return messages[messages.length - 1];
}