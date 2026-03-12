// src/components/GameCenter/BoardGame/constants.js

/** 말(토큰) 한 개 생성 함수 */
export function makeToken(id, name, color) {
  return { id, name, color, pos: 0, score: 0 };
}

/** 말 색상 팔레트 (새 말 추가 시 순환하며 사용) */
export const TOKEN_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#e11d48",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#facc15",
  "#4ade80",
  "#60a5fa",
  "#fb7185",
  "#fbbf24",
  "#2dd4bf",
  "#a3e635",
  "#6366f1",
  "#f97316",
  "#22c55e",
  "#e11d48",
];

/** 보드 기본 텍스트 세트 (브루마블 느낌) */
export function makeDefaultCellTexts(total) {
  const base = [
    "출발\n(Start)",
    "보너스\n+100점",
    "벌칙\n-100점",
    "앞으로 2칸 이동",
    "한 턴 쉬기",
    "시그헌터 1회",
    "지뢰게임 1회",
    "보너스\n+200점",
    "벌칙\n지뢰 선택",
    "뒤로 3칸 이동",
    "아이템 획득",
    "모두의 점수 절반",
    "랜덤 BJ랑 자리 바꾸기",
    "보너스\n+300점",
    "벌칙\n다시 출발로",
    "지뢰게임\n2회 연속",
    "시그헌터\n3번 뽑기",
    "보너스\n+500점",
    "벌칙\n시청자 벌칙 수행",
    "전부 재도전",
  ];

  const result = [];
  for (let i = 0; i < total; i++) {
    if (i < base.length) result.push(base[i]);
    else result.push(`칸 ${i + 1}`);
  }
  return result;
}

/** 한 칸의 스타일(글씨 크기/굵기/색) 기본값 */
export function makeDefaultCellStyles(total) {
  return Array.from({ length: total }, () => ({
    fontSize: 20,
    fontWeight: 700,
    color: "#f9fafb",
  }));
}