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
export const weightedPick = (arr, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
};