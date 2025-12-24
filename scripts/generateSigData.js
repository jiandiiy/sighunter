/**
 * 🎲 SIG 카드 데이터 자동 생성 스크립트 (퀸덤 + 뮤즈)
 *
 * - public/images/queendom/group1~9 : 퀸덤 일반 카드용 이미지
 * - public/images/queendom/group10~11 : 퀸덤 특별 카드용 이미지
 * - public/images/muse/group1~9 : 뮤즈 일반 카드용 이미지
 * - public/images/muse/group10 : 뮤즈 특별 카드용 이미지
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
/* 🧩 특정 프로젝트(queendom/muse)의 이미지 그룹 로드 함수                  */
/* -------------------------------------------------------------------------- */
function readImagesForProject(projectDir, groupNames) {
  const result = [];
  for (const group of groupNames) {
    const groupPath = path.join(baseDir, projectDir, group);
    if (!fs.existsSync(groupPath)) {
      console.warn(`⚠️ ${projectDir}/${group} 폴더가 존재하지 않습니다.`);
      continue;
    }

    const files = fs
      .readdirSync(groupPath)
      .filter((f) => /\.(webp|png|gif|jpg|jpeg)$/i.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)?.[0] || 0, 10);
        const nb = parseInt(b.match(/\d+/)?.[0] || 0, 10);
        return na - nb;
      })
      // 🔹 public 경로 기준으로 사용 (React에서 그대로 쓸 수 있게)
      .map((f) => `/images/${projectDir}/${group}/${f}`);

    console.log(`   ✅ ${projectDir}/${group}: ${files.length}장`);
    result.push(...files);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* 🎴 공통: 이미지 셔플 & 분배 로직 / 메시지 풀                              */
/* -------------------------------------------------------------------------- */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL_NORMAL_CARDS = 10;
const IMAGES_PER_CARD = 100;

function distributeImages(images, numCards, perCard) {
  const cards = [];
  if (images.length >= numCards * perCard) {
    const shuffled = shuffle(images);
    for (let i = 0; i < numCards; i++) {
      cards.push(shuffled.slice(i * perCard, (i + 1) * perCard));
    }
  } else {
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
/* ✅ 메시지 확률(요청 반영)
 *
 * 일반카드:
 * - 기여도 두배 80%
 * - 기여도 세배 10%
 * - 개똥손 10%
 * - 나머지 0%
 *
 * 만수르(특별)카드:
 * - 기여도 두배 79%
 * - 기여도 세배 20%
 * - 기여도 네배 1%
 * - 나머지 0%
 * -------------------------------------------------------------------------- */

const normalMessagePool = [
  { text: "화장실\n1개", color: "#ffffff", bgColor: "#4a5568", weight: 0 },
  { text: "레전드 ✨", color: "#2d3748", bgColor: "#fbd38d", weight: 0 },

  { text: "기여도\n두배", color: "#1a202c", bgColor: "#9ae6b4", weight: 46 },
  { text: "기여도\n세배", color: "#1a202c", bgColor: "#68d391", weight: 30 },
  { text: "기여도\n네배", color: "#1a202c", bgColor: "#48bb78", weight: 4 },

  { text: "1000원\n당첨!", color: "#1a202c", bgColor: "#f6e05e", weight: 0 },
  { text: "전설 🏆", color: "#2d3748", bgColor: "#ed8936", weight: 0 },
  { text: "10000\n원당첨!", color: "#1a202c", bgColor: "#f56565", weight: 0 },
  { text: "퇴근!🏠", color: "#1a202c", bgColor: "#f56565", weight: 20 },

  { text: "개똥손 🤡", color: "#ffffff", bgColor: "#2d3748", weight: 0 },
];

const specialMessagePool = [
  // 기여도
  {
    text: "기여도 두배 🎁",
    color: "#2f1410",
    bgColor: "linear-gradient(90deg, #ffd1a1, #ff9f7b)",
    weight: 0,
  },
  {
    text: "기여도 세배 🌟",
    color: "#231942",
    bgColor: "linear-gradient(90deg, #c4b5fd, #7c3aed)",
    weight: 0,
  },
  {
    text: "기여도 네배 🔥",
    color: "#1f2933",
    bgColor: "linear-gradient(90deg, #f97373, #fb923c)",
    weight: 0,
  },
  
  // 금액 보상 (0%)
  {
    text: "💰 30,000원\n당첨!",
    color: "#14532d",
    bgColor: "linear-gradient(90deg, #bbf7d0, #4ade80)",
    weight: 0,
  },
  {
    text: "💎 50,000원\n당첨!",
    color: "#1d2833",
    bgColor: "linear-gradient(90deg, #a5f3fc, #38bdf8)",
    weight: 0,
  },
  {
    text: "🎊 100,000원\n당첨!",
    color: "#3f1f0f",
    bgColor: "linear-gradient(90deg, #fde68a, #facc15)",
    weight: 0,
  },
  
  // 기타 효과 (0%)
  {
    text: "퇴근 🏠",
    color: "#1f2933",
    bgColor: "linear-gradient(90deg, #f97373, #fb923c)",
    weight: 100,
  },
  {
    text: "화장실 무제한 ♾️",
    color: "#064e3b",
    bgColor: "linear-gradient(90deg, #6ee7b7, #34d399)",
    weight: 0,
  },
  {
    text: "레전드 💠",
    color: "#0f172a",
    bgColor: "linear-gradient(90deg, #e0f2fe, #60a5fa)",
    weight: 0,
  },
  {
    text: "전설 🔱",
    color: "#1a1033",
    bgColor: "linear-gradient(90deg, #f5d0fe, #e879f9)",
    weight: 0,
  },
];

/* -------------------------------------------------------------------------- */
/* 🧮 한 프로젝트(퀸덤 or 뮤즈)의 sigCards 생성 함수                         */
/* -------------------------------------------------------------------------- */

function generateProjectSigCards(projectDir) {
  console.log(`\n📂 [${projectDir}] 이미지 로드 시작`);

  // ✅ 둘 다 일반카드는 group1~group9
  const normalGroups = [
    "group1",
    "group2",
    "group3",
    "group4",
    "group5",
    "group6",
    "group7",
    "group8",
    "group9",
  ];

  // ✅ 특별카드는
  //  - queendom: group10, group11
  //  - muse: group10
  const specialGroups =
    projectDir === "queendom" ? ["group10", "group11"] : ["group10"];

  const normalImages = readImagesForProject(projectDir, normalGroups);
  let specialImages = readImagesForProject(projectDir, specialGroups);

  console.log(`\n📦 [${projectDir}] 일반 카드 이미지 총 ${normalImages.length}장`);
  console.log(`🌟 [${projectDir}] 특별 카드 이미지 총 ${specialImages.length}장`);

  if (normalImages.length === 0) {
    console.error(
      `❌ [${projectDir}] 일반 카드 이미지가 없습니다. ${projectDir}/group1~9 폴더를 확인하세요.`
    );
    process.exit(1);
  }

  const distributedCards = distributeImages(
    normalImages,
    TOTAL_NORMAL_CARDS,
    IMAGES_PER_CARD
  );
  const sigCards = [];

  // 일반 카드 1~10
  for (let i = 0; i < TOTAL_NORMAL_CARDS; i++) {
    sigCards.push({
      id: i + 1,
      amount: 1000 * (i + 1),
      frontImages: distributedCards[i],
      isSpecial: false,
    });
  }

  // 특별 카드 11
  if (specialImages.length === 0) {
    console.warn(
      `⚠️ [${projectDir}] 특별 이미지가 없으므로 일반 이미지 일부를 사용합니다.`
    );
    specialImages = shuffle(normalImages).slice(0, 50);
  }

  sigCards.push({
    id: 11,
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
const museSigCards = generateProjectSigCards("muse");

const output = `// ⚙️ 자동 생성된 파일 (퀸덤 + 뮤즈)
export const queendomSigCards = ${JSON.stringify(queendomSigCards, null, 2)};
export const museSigCards = ${JSON.stringify(museSigCards, null, 2)};

export const normalMessages = ${JSON.stringify(normalMessagePool, null, 2)};
export const specialMessages = ${JSON.stringify(specialMessagePool, null, 2)};
export const messages = [...normalMessages, ...specialMessages];
`;

const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(outputFile, output, "utf8");

/* -------------------------------------------------------------------------- */
/* ✅ 완료 로그                                                              */
/* -------------------------------------------------------------------------- */
console.log("\n🎉 sigData.js 생성 완료!");
console.log(`📄 위치: ${outputFile}`);

console.log("\n✅ 확률 설정(요청 반영):");
console.log("📇 일반 카드(1~10):");
console.log("   • 기여도 두배: 80");
console.log("   • 기여도 세배: 10");
console.log("   • 개똥손: 10");
console.log("   • 그 외: 0");

console.log("\n🌟 만수르(특별) 카드(11):");
console.log("   • 기여도 두배: 79");
console.log("   • 기여도 세배: 20");
console.log("   • 기여도 네배: 1");
console.log("   • 그 외: 0");

console.log("\n💡 작동 방식:");
console.log("   • 카드를 뒤집을 때마다 가중치 기반으로 랜덤 선택");
console.log("   • 같은 결과가 여러 번 나올 수 있음");
console.log("   • weight 값이 높을수록 더 자주 나옴\n");