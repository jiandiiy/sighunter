/**
 * 🎲 SIG 카드 데이터 자동 생성 스크립트 (퀸덤 + 뮤즈 + 홀릭)
 *
 * - public/images/queendom/group01~09 : 퀸덤 일반 카드 (9그룹 → 10장 재분배)
 * - public/images/queendom/group10~11 : 퀸덤 특별 카드
 * - public/images/muse/group01~09     : 뮤즈 일반 카드 (9그룹 → 10장 재분배)
 * - public/images/muse/group10        : 뮤즈 특별 카드
 * - public/images/holic/group01~08    : 홀릭 일반 카드 (8그룹 → 10장 재분배)
 * - public/images/holic/group09       : 홀릭 특별 카드
 *
 * 실행: node scripts/generateSigData.js
 * 결과: src/data/sigData.js 자동 생성
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const baseDir = path.resolve(rootDir, "public/images");
const outputFile = path.resolve(rootDir, "src/data/sigData.js");

console.log("📂 프로젝트 루트:", rootDir);
console.log("📂 이미지 루트 경로:", baseDir);

if (!fs.existsSync(baseDir)) {
  console.error("❌ public/images 폴더를 찾을 수 없습니다!");
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* 📌 프로젝트별 설정 (한 곳에서 관리 → 실수 방지)                           */
/* -------------------------------------------------------------------------- */

const PROJECT_CONFIG = {
  queendom: {
    normalGroupCount: 9,   // group01~09
    specialGroups: ["group10", "group11"],
    totalNormalCards: 10,
    startId: 1,
  },
  muse: {
    normalGroupCount: 9,   // group01~09
    specialGroups: ["group10"],
    totalNormalCards: 10,
    startId: 12,
  },
  holic: {
    normalGroupCount: 9,   // group01~09
    specialGroups: ["group10"],
    totalNormalCards: 10,
    startId: 23,
  },
};

/* -------------------------------------------------------------------------- */
/* 🛡️ 그룹 겹침 검증 함수 (특별 그룹이 일반 그룹에 침범하면 즉시 종료)       */
/* -------------------------------------------------------------------------- */

function validateGroupSeparation(projectDir, normalGroups, specialGroups) {
  const overlap = normalGroups.filter((g) => specialGroups.includes(g));
  if (overlap.length > 0) {
    console.error(
      `\n🚨 [${projectDir}] FATAL: 일반 그룹과 특별 그룹이 겹칩니다!`
    );
    console.error(`   겹치는 그룹: ${overlap.join(", ")}`);
    console.error(`   normalGroups:  ${normalGroups.join(", ")}`);
    console.error(`   specialGroups: ${specialGroups.join(", ")}`);
    process.exit(1);
  }
  console.log(`   🛡️  그룹 분리 검증 통과 (겹침 없음)`);
}

/* -------------------------------------------------------------------------- */
/* 🧩 특정 프로젝트의 이미지 그룹 로드 함수                                  */
/* -------------------------------------------------------------------------- */

function readImagesForProject(projectDir, groupNames) {
  const result = [];
  for (const group of groupNames) {
    const groupPath = path.join(baseDir, projectDir, group);
    if (!fs.existsSync(groupPath)) {
      console.warn(`⚠️  ${projectDir}/${group} 폴더가 존재하지 않습니다.`);
      continue;
    }

    const files = fs
      .readdirSync(groupPath)
      .filter((f) => /\.(webp|png|gif|jpg|jpeg)$/i.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)?.[0] ?? 0, 10);
        const nb = parseInt(b.match(/\d+/)?.[0] ?? 0, 10);
        return na - nb;
      })
      .map((f) => `/images/${projectDir}/${group}/${f}`);

    console.log(`   ✅ ${projectDir}/${group}: ${files.length}장`);
    result.push(...files);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* 🎴 이미지 셔플 & 분배 로직                                                */
/* -------------------------------------------------------------------------- */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const IMAGES_PER_CARD = 100;

function distributeImages(images, numCards, perCard) {
  const cards = [];
  if (images.length >= numCards * perCard) {
    const shuffled = shuffle(images);
    for (let i = 0; i < numCards; i++) {
      cards.push(shuffled.slice(i * perCard, (i + 1) * perCard));
    }
  } else {
    // 이미지가 부족할 때 → 사용 횟수 기반 균등 재분배
    const usageCount = new Map(images.map((img) => [img, 0]));
    for (let c = 0; c < numCards; c++) {
      const cardImages = [];
      for (let i = 0; i < perCard; i++) {
        const sorted = [...images].sort(
          (a, b) => (usageCount.get(a) ?? 0) - (usageCount.get(b) ?? 0)
        );
        const pick = sorted[0];
        cardImages.push(pick);
        usageCount.set(pick, (usageCount.get(pick) ?? 0) + 1);
      }
      cards.push(shuffle(cardImages));
    }
  }
  return cards;
}

/* -------------------------------------------------------------------------- */
/* 메시지 풀                                                                  */
/* -------------------------------------------------------------------------- */

const normalMessagePool = [
  { text: "화장실\n1개", color: "#ffffff", bgColor: "#4a5568", weight: 0 },
  { text: "레전드 ✨", color: "#1f2937", bgColor: "#fcd34d", weight: 0 },
  { text: "기여도\n두배", color: "#ffffff", bgColor: "#6366f1", weight: 60 },
  { text: "기여도\n세배", color: "#ffffff", bgColor: "#7c3aed", weight: 30 },
  { text: "기여도\n네배", color: "#ffffff", bgColor: "#9333ea", weight: 5 },
  { text: "1000원\n당첨!", color: "#1f2937", bgColor: "#fbbf24", weight: 0 },
  { text: "전설 🏆", color: "#ffffff", bgColor: "#f97316", weight: 0 },
  { text: "10000\n원당첨!", color: "#ffffff", bgColor: "#ef4444", weight: 0 },
  { text: "퇴근!🏠", color: "#ffffff", bgColor: "#ec4899", weight: 0 },
  { text: "꽝 🤡", color: "#ffffff", bgColor: "#1f2937", weight: 5 },
];

const specialMessagePool = [
  {
    text: "기여도 두배 🎁",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    weight: 60,
  },
  {
    text: "기여도 세배 🌟",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #7c3aed, #ec4899)",
    weight: 35,
  },
  {
    text: "기여도 네배 🔥",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #f97316, #ef4444)",
    weight: 5,
  },
  {
    text: "💰 30,000원\n당첨!",
    color: "#1f2937",
    bgColor: "linear-gradient(90deg, #fde68a, #fbbf24)",
    weight: 0,
  },
  {
    text: "💎 50,000원\n당첨!",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #38bdf8, #6366f1)",
    weight: 0,
  },
  {
    text: "🎊 100,000원\n당첨!",
    color: "#1f2937",
    bgColor: "linear-gradient(90deg, #facc15, #f97316)",
    weight: 0,
  },
  {
    text: "퇴근 🏠",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #ef4444, #ec4899)",
    weight: 0,
  },
  {
    text: "화장실 무제한 ♾️",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #60a5fa, #3b82f6)",
    weight: 0,
  },
  {
    text: "레전드 💠",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #a78bfa, #7c3aed)",
    weight: 0,
  },
  {
    text: "전설 🔱",
    color: "#ffffff",
    bgColor: "linear-gradient(90deg, #f472b6, #ec4899)",
    weight: 0,
  },
];

/* -------------------------------------------------------------------------- */
/* 🧮 프로젝트별 sigCards 생성 함수                                          */
/* -------------------------------------------------------------------------- */

function generateProjectSigCards(projectDir) {
  const config = PROJECT_CONFIG[projectDir];
  if (!config) {
    console.error(`❌ PROJECT_CONFIG에 "${projectDir}" 설정이 없습니다.`);
    process.exit(1);
  }

  const { normalGroupCount, specialGroups, totalNormalCards, startId } = config;

  console.log(`\n📂 [${projectDir}] 이미지 로드 시작`);

  // 일반 그룹 목록 생성
  const normalGroups = Array.from(
    { length: normalGroupCount },
    (_, i) => `group${String(i + 1).padStart(2, "0")}`
  );

  // 🛡️ 핵심: 특별 그룹이 일반 그룹에 섞여있는지 검증 → 겹치면 즉시 종료
  console.log(`   normalGroups:  ${normalGroups.join(", ")}`);
  console.log(`   specialGroups: ${specialGroups.join(", ")}`);
  validateGroupSeparation(projectDir, normalGroups, specialGroups);

  // 이미지 로드 (완전히 분리된 경로에서만 읽음)
  const normalImages = readImagesForProject(projectDir, normalGroups);
  let specialImages = readImagesForProject(projectDir, specialGroups);

  console.log(`\n📦 [${projectDir}] 일반 카드 이미지 총 ${normalImages.length}장`);
  console.log(`🌟 [${projectDir}] 특별 카드 이미지 총 ${specialImages.length}장`);

  if (normalImages.length === 0) {
    console.error(`❌ [${projectDir}] 일반 카드 이미지가 없습니다.`);
    process.exit(1);
  }

  // totalNormalCards(10)장으로 재분배
  const distributedCards = distributeImages(
    normalImages,
    totalNormalCards,
    IMAGES_PER_CARD
  );

  const sigCards = [];

  // 일반 카드 생성
  for (let i = 0; i < totalNormalCards; i++) {
    sigCards.push({
      id: startId + i,
      amount: 1000 * (i + 1),
      frontImages: distributedCards[i],
      isSpecial: false,
    });
  }

  // 특별 카드 생성 (특별 이미지 없으면 일반 이미지 일부 사용)
  if (specialImages.length === 0) {
    console.warn(`⚠️  [${projectDir}] 특별 이미지가 없어 일반 이미지 일부를 사용합니다.`);
    specialImages = shuffle(normalImages).slice(0, 50);
  }

  sigCards.push({
    id: startId + totalNormalCards, // queendom: 11, muse: 22, holic: 33
    amount: 50000,
    frontImages: shuffle(specialImages),
    isSpecial: true,
  });

  return sigCards;
}

/* -------------------------------------------------------------------------- */
/* 📄 sigData.js 파일 생성                                                   */
/* -------------------------------------------------------------------------- */

const queendomSigCards = generateProjectSigCards("queendom");
const museSigCards     = generateProjectSigCards("muse");
const holicSigCards    = generateProjectSigCards("holic");

const output = `// ⚙️ 자동 생성된 파일 (퀸덤 + 뮤즈 + 홀릭)
export const queendomSigCards = ${JSON.stringify(queendomSigCards, null, 2)};
export const museSigCards = ${JSON.stringify(museSigCards, null, 2)};
export const holicSigCards = ${JSON.stringify(holicSigCards, null, 2)};

export const normalMessages = ${JSON.stringify(normalMessagePool, null, 2)};
export const specialMessages = ${JSON.stringify(specialMessagePool, null, 2)};
export const messages = [...normalMessages, ...specialMessages];
`;

const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(outputFile, output, "utf8");

/* -------------------------------------------------------------------------- */
/* ✅ 완료 로그                                                               */
/* -------------------------------------------------------------------------- */
console.log("\n🎉 sigData.js 생성 완료!");
console.log(`📄 위치: ${outputFile}`);
console.log("\n📋 카드 id 배정:");
console.log("   • queendom: 1~11  (일반 10장 + 스페셜 1장)");
console.log("   • muse:    12~22  (일반 10장 + 스페셜 1장)");
console.log("   • holic:   23~33  (일반 10장 + 스페셜 1장)");
console.log("\n📊 그룹 → 카드 분배 방식:");
console.log("   • queendom: group01~09 (9그룹) → 10장 재분배");
console.log("   • muse:     group01~09 (9그룹) → 10장 재분배");
console.log("   • holic:    group01~09 (9그룹) → 10장 재분배");
console.log("\n✅ 확률 설정:");
console.log("📇 일반 카드 — 기여도 두배: 60 / 세배: 30 / 네배: 5 / 꽝: 5");
console.log("🌟 특별 카드 — 기여도 두배: 60 / 세배: 35 / 네배: 5");
console.log("\n💡 이미지 침범 방지: validateGroupSeparation() 검증 통과 시에만 생성됨\n");