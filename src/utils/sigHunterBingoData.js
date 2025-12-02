// src/utils/sigHunterBingoData.js

// 모드 목록 (식사대전 빙고와 맞추기 위해 동일 이름 사용)
export const HUNTER_MODES = ["muse", "queendom"];

/**
 * 각 모드별 시그헌터 빙고용 기본 데이터
 * 실제 프로젝트에서는 generateSigData.js 결과를 여기로 옮기거나
 * import 해서 구성하면 됨.
 */
const HUNTER_SIG_CELLS = {
  muse: [
    { sigName: "뮤즈 시그 1", sigCount: 101 },
    { sigName: "뮤즈 시그 2", sigCount: 102 },
    { sigName: "뮤즈 시그 3", sigCount: 103 },
    { sigName: "뮤즈 시그 4", sigCount: 104 },
    { sigName: "뮤즈 시그 5", sigCount: 105 },
    { sigName: "뮤즈 시그 6", sigCount: 106 },
    { sigName: "뮤즈 시그 7", sigCount: 107 },
    { sigName: "뮤즈 시그 8", sigCount: 108 },
    { sigName: "뮤즈 시그 9", sigCount: 109 },
    { sigName: "뮤즈 시그 10", sigCount: 110 },
    { sigName: "뮤즈 시그 11", sigCount: 111 },
    { sigName: "뮤즈 시그 12", sigCount: 112 },
    { sigName: "뮤즈 시그 13", sigCount: 113 },
    { sigName: "뮤즈 시그 14", sigCount: 114 },
    { sigName: "뮤즈 시그 15", sigCount: 115 },
    { sigName: "뮤즈 시그 16", sigCount: 116 },
    { sigName: "뮤즈 시그 17", sigCount: 117 },
    { sigName: "뮤즈 시그 18", sigCount: 118 },
    { sigName: "뮤즈 시그 19", sigCount: 119 },
    { sigName: "뮤즈 시그 20", sigCount: 120 },
    { sigName: "뮤즈 시그 21", sigCount: 121 },
    { sigName: "뮤즈 시그 22", sigCount: 122 },
    { sigName: "뮤즈 시그 23", sigCount: 123 },
    { sigName: "뮤즈 시그 24", sigCount: 124 },
    { sigName: "뮤즈 시그 25", sigCount: 125 },
  ],
  queendom: [
    { sigName: "퀸덤 시그 1", sigCount: 201 },
    { sigName: "퀸덤 시그 2", sigCount: 202 },
    { sigName: "퀸덤 시그 3", sigCount: 203 },
    { sigName: "퀸덤 시그 4", sigCount: 204 },
    { sigName: "퀸덤 시그 5", sigCount: 205 },
    { sigName: "퀸덤 시그 6", sigCount: 206 },
    { sigName: "퀸덤 시그 7", sigCount: 207 },
    { sigName: "퀸덤 시그 8", sigCount: 208 },
    { sigName: "퀸덤 시그 9", sigCount: 209 },
    { sigName: "퀸덤 시그 10", sigCount: 210 },
    { sigName: "퀸덤 시그 11", sigCount: 211 },
    { sigName: "퀸덤 시그 12", sigCount: 212 },
    { sigName: "퀸덤 시그 13", sigCount: 213 },
    { sigName: "퀸덤 시그 14", sigCount: 214 },
    { sigName: "퀸덤 시그 15", sigCount: 215 },
    { sigName: "퀸덤 시그 16", sigCount: 216 },
    { sigName: "퀸덤 시그 17", sigCount: 217 },
    { sigName: "퀸덤 시그 18", sigCount: 218 },
    { sigName: "퀸덤 시그 19", sigCount: 219 },
    { sigName: "퀸덤 시그 20", sigCount: 220 },
    { sigName: "퀸덤 시그 21", sigCount: 221 },
    { sigName: "퀸덤 시그 22", sigCount: 222 },
    { sigName: "퀸덤 시그 23", sigCount: 223 },
    { sigName: "퀸덤 시그 24", sigCount: 224 },
    { sigName: "퀸덤 시그 25", sigCount: 225 },
  ],
};

/**
 * 주어진 모드에 맞는 25칸 시그헌터 빙고 셀 초기값을 반환
 * @param {"muse" | "queendom"} mode
 * @param {number} count 보드 크기 (기본 25)
 */
export function getInitialHunterCells(mode = "muse", count = 25) {
  const base = HUNTER_SIG_CELLS[mode] || [];
  const slice = base.slice(0, count);

  return slice.map((c, idx) => ({
    id: idx,
    sigName: c.sigName,
    sigCount: c.sigCount,
    owner: null, // 아직 점령자 없음
  }));
}