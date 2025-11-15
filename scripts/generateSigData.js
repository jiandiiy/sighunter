/**
 * 🎲 SIG 카드 데이터 자동 생성 스크립트
 * 
 * - public/images/group1~8 : 일반 카드용 이미지
 * - public/images/group9~10 : 특별 카드용 이미지
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
console.log("📂 이미지 경로:", baseDir);

if (!fs.existsSync(baseDir)) {
  console.error("❌ public/images 폴더를 찾을 수 없습니다!");
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* 🧩 이미지 그룹 로드 함수                                                   */
/* -------------------------------------------------------------------------- */
function readImages(groupNames) {
  const result = [];
  for (const group of groupNames) {
    const groupPath = path.join(baseDir, group);
    if (!fs.existsSync(groupPath)) {
      console.warn(`⚠️ ${group} 폴더가 존재하지 않습니다.`);
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
      .map((f) => `/images/${group}/${f}`);

    console.log(`   ✅ ${group}: ${files.length}장`);
    result.push(...files);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* 📸 일반 / 특별 이미지 로드                                                */
/* -------------------------------------------------------------------------- */

const normalGroups = ["group1","group2","group3","group4","group5","group6","group7","group8"];
const specialGroups = ["group9","group10"];

const normalImages = readImages(normalGroups);
let specialImages = readImages(specialGroups);

console.log(`\n📦 일반 카드 이미지 총 ${normalImages.length}장`);
console.log(`🌟 특별 카드 이미지 총 ${specialImages.length}장`);

if (normalImages.length === 0) {
  console.error("❌ 일반 카드 이미지가 없습니다. group1~8 폴더를 확인하세요.");
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* 🎴 이미지 셔플 및 분배 로직                                               */
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
/* 🃏 카드 데이터 구성                                                       */
/* -------------------------------------------------------------------------- */

const distributedCards = distributeImages(normalImages, TOTAL_NORMAL_CARDS, IMAGES_PER_CARD);
const sigCards = [];

for (let i = 0; i < TOTAL_NORMAL_CARDS; i++) {
  sigCards.push({
    id: i + 1,
    amount: 1000 * (i + 1),
    frontImages: distributedCards[i],
    isSpecial: false,
  });
}

if (specialImages.length === 0) {
  console.warn("⚠️ 특별 이미지가 없으므로 일반 이미지 일부를 사용합니다.");
  specialImages = shuffle(normalImages).slice(0, 50);
}

sigCards.push({
  id: 11,
  amount: 50000,
  frontImages: shuffle(specialImages),
  isSpecial: true,
});

/* -------------------------------------------------------------------------- */
/* 🎯 메시지(보상) 가중치 설정                                               */
/* -------------------------------------------------------------------------- */

const normalMessagePool = [
  { text: "기여도 두배 🎁",  tier: "일반", color: "#ffffff", bgColor: "#443288", weight: 60 },
  { text: "기여도 세배 🎉",  tier: "희귀", color: "#22543d", bgColor: "#9ae6b4", weight: 15 },
  { text: "10,000원 당첨!", tier: "레어",  color: "#1d4438", bgColor: "#68d391", weight: 1 },
  { text: "5,000원 당첨!",  tier: "레어",  color: "#1d4438", bgColor: "#68d391", weight: 5 },
  { text: "1,000원 당첨!",  tier: "희귀", color: "#22543d", bgColor: "#9ae6b4", weight: 19 },
];

const specialMessagePool = [
  { text: "🎊 100,000원 당첨!", tier: "레전드", color: "#2f1410",
    bgColor: "linear-gradient(90deg, #face6d, #f97393)", weight: 10 },
  { text: "기여도 세배 🌟", tier: "전설", color: "#2f1410",
    bgColor: "linear-gradient(90deg, #face6d, #f97393)", weight: 70 },
  { text: "💎 50,000원 당첨!", tier: "레전드", color: "#2f1410",
    bgColor: "linear-gradient(90deg, #face6d, #f97393)", weight: 20 },
];

/* -------------------------------------------------------------------------- */
/* 📄 sigData.js 파일 생성                                                   */
/* -------------------------------------------------------------------------- */

const output = `// ⚙️ 자동 생성된 파일
export const sigCards = ${JSON.stringify(sigCards, null, 2)};
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
console.log("\n✅ 확률 설정:");
console.log("📇 일반 카드(1~10):");
console.log("   • 기여도 두배: 60%");
console.log("   • 기여도 세배: 15%");
console.log("   • 10,000원: 1%");
console.log("   • 5,000원: 5%");
console.log("   • 1,000원: 19%");
console.log("\n🌟 특별 카드(11):");
console.log("   • 100,000원: 10%");
console.log("   • 기여도 세배: 70%");
console.log("   • 50,000원: 20%");
console.log("\n💡 작동 방식:");
console.log("   • 카드를 뒤집을 때마다 가중치 기반으로 랜덤 선택");
console.log("   • 같은 결과가 여러 번 나올 수 있음");
console.log("   • 확률에 따라 높은 % 항목이 자주 나옴\n");