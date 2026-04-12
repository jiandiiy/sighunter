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

/**
 * 보드 기본 텍스트 세트
 * - Board.jsx 의 boardData24 인덱스와 1:1로 맞춰서 정의
 * - UI에 보이는 칸과 효과 텍스트가 동일한 칸을 가리키도록 유지
 */
export function makeDefaultCellTexts(total) {
  // 7x7 둘레 24칸 기준 기본 셋업
  const fixed24 = [
    // 0 ~ 6: 상단 왼→오
    "출발\n(Start)\n통과 시 +100점",              // 0 START
    "타이베이\n보너스 +100점",                    // 1
    "베이징\n보너스 +150점",                      // 2
    "마닐라\n보너스 +200점",                      // 3
    "싱가포르\n보너스 +250점",                    // 4
    "황금열쇠\n랜덤 이벤트 발동",                 // 5 (special: key)
    "무인도\n2턴 동안 이동 불가",                 // 6 (special: prison)

    // 7 ~ 11: 오른쪽 상→하
    "제주\n+100점 또는 -100점 (랜덤)",            // 7
    "서울\n+200점",                               // 8
    "푸껫\n앞으로 2칸 이동",                      // 9
    "하와이\n보너스 +300점",                      // 10
    "도쿄\n뒤로 2칸 이동",                        // 11

    // 12 ~ 18: 하단 오→왼
    "세계여행\n원하는 도시로 이동",               // 12 (special: world)
    "파리\n+250점",                               // 13
    "로마\n+200점",                               // 14
    "런던\n+150점",                               // 15
    "황금열쇠\n랜덤 이벤트 발동",                 // 16 (special: key)
    "모스크바\n-200점",                          // 17
    "우주여행\n무작위 위치로 워프",               // 18 (special: space)

    // 19 ~ 23: 왼쪽 하→상
    "서울(남부)\n+100점",                         // 19
    "부산\n+150점",                               // 20
    "뉴욕\n+300점",                               // 21
    "황금열쇠\n랜덤 이벤트 발동",                 // 22 (special: key)
    "퀘백\n모두의 점수 절반",                     // 23
  ];

  const result = [];
  for (let i = 0; i < total; i++) {
    if (i < fixed24.length) {
      result.push(fixed24[i]);
    } else {
      // 24칸을 넘는 경우: 예비 텍스트
      result.push(`칸 ${i + 1}`);
    }
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