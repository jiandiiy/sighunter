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

// ✅ group1~group8 수집 (일반 카드용)
const normalGroups = [
  "group1", "group2", "group3", "group4",
  "group5", "group6", "group7", "group8"
];
let normalImages = [];

for (const group of normalGroups) {
  const groupPath = path.join(baseDir, group);
  if (!fs.existsSync(groupPath)) {
    console.warn(`⚠️ ${group} 폴더가 없습니다.`);
    continue;
  }

  const files = fs
    .readdirSync(groupPath)
    .filter(f => /\.(webp|png|gif|jpg|jpeg)$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || 0, 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || 0, 10);
      return na - nb;
    })
    .map(f => `/images/${group}/${f}`);

  normalImages.push(...files);
  console.log(`   ✅ ${group}: ${files.length}장`);
}

console.log(`\n📦 일반 카드용 이미지 총: ${normalImages.length}장`);

if (normalImages.length === 0) {
  console.error("❌ 일반 카드용 이미지가 하나도 없습니다!");
  console.error("   public/images/group1 ~ group8 폴더를 확인하세요.");
  process.exit(1);
}

// ✅ group9~group10 수집 (특별 카드용)
const specialGroups = ["group9", "group10"];
let specialImages = [];

for (const group of specialGroups) {
  const groupPath = path.join(baseDir, group);
  if (!fs.existsSync(groupPath)) {
    console.warn(`⚠️ ${group} 폴더가 없습니다.`);
    continue;
  }

  const files = fs
    .readdirSync(groupPath)
    .filter(f => /\.(webp|png|gif|jpg|jpeg)$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || 0, 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || 0, 10);
      return na - nb;
    })
    .map(f => `/images/${group}/${f}`);

  specialImages.push(...files);
  console.log(`   ✅ ${group}: ${files.length}장`);
}

console.log(`\n🌟 특별 카드용 이미지 총: ${specialImages.length}장`);

// ✅ 섞기 함수
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

console.log(`\n🎯 카드당 필요 이미지: ${IMAGES_PER_CARD}장`);
console.log(`📸 보유한 고유 이미지: ${normalImages.length}장`);

// ✅ 중복 최소화 분배 알고리즘
function distributeImagesMinimalDuplication(images, numCards, perCard) {
  const totalNeeded = numCards * perCard;
  const uniqueCount = images.length;
  
  console.log(`\n🔄 중복 최소화 분배 시작...`);
  console.log(`   필요: ${totalNeeded}장, 보유: ${uniqueCount}장`);
  
  if (uniqueCount >= totalNeeded) {
    // ✅ 케이스 1: 충분한 이미지 - 중복 없이 분배 가능
    console.log(`   ✅ 중복 없이 분배 가능!`);
    const shuffled = shuffle(images);
    const cards = [];
    
    for (let i = 0; i < numCards; i++) {
      cards.push(shuffled.slice(i * perCard, (i + 1) * perCard));
    }
    
    return cards;
  } else {
    // ✅ 케이스 2: 이미지 부족 - 중복 최소화 전략
    console.log(`   ⚠️ 이미지 부족 - 중복 최소화 모드`);
    
    const cards = Array.from({ length: numCards }, () => []);
    const usageCount = new Map();
    
    images.forEach(img => usageCount.set(img, 0));
    
    for (let cardIdx = 0; cardIdx < numCards; cardIdx++) {
      const needed = perCard;
      
      const sortedImages = [...images].sort((a, b) => {
        const countA = usageCount.get(a) || 0;
        const countB = usageCount.get(b) || 0;
        if (countA !== countB) return countA - countB;
        return Math.random() - 0.5;
      });
      
      for (let i = 0; i < needed && i < sortedImages.length; i++) {
        const img = sortedImages[i % sortedImages.length];
        cards[cardIdx].push(img);
        usageCount.set(img, (usageCount.get(img) || 0) + 1);
      }
      
      while (cards[cardIdx].length < needed) {
        const img = sortedImages[cards[cardIdx].length % sortedImages.length];
        cards[cardIdx].push(img);
        usageCount.set(img, (usageCount.get(img) || 0) + 1);
      }
      
      cards[cardIdx] = shuffle(cards[cardIdx]);
    }
    
    const usageCounts = Array.from(usageCount.values());
    const minUsage = Math.min(...usageCounts);
    const maxUsage = Math.max(...usageCounts);
    const avgUsage = (usageCounts.reduce((a, b) => a + b, 0) / usageCounts.length).toFixed(2);
    
    console.log(`   📊 이미지 사용 통계:`);
    console.log(`      최소 사용: ${minUsage}회`);
    console.log(`      최대 사용: ${maxUsage}회`);
    console.log(`      평균 사용: ${avgUsage}회`);
    
    return cards;
  }
}

// ✅ 카드별 이미지 분배
const distributedCards = distributeImagesMinimalDuplication(
  normalImages,
  TOTAL_NORMAL_CARDS,
  IMAGES_PER_CARD
);

const sigCards = [];

console.log("\n📋 카드별 이미지 할당 결과:");

for (let i = 0; i < TOTAL_NORMAL_CARDS; i++) {
  const cardImages = distributedCards[i];
  const uniqueInCard = new Set(cardImages).size;
  
  sigCards.push({
    id: i + 1,
    amount: 1000 * (i + 1),
    frontImages: cardImages,
    isSpecial: false,
  });
  
  console.log(`   ✅ Card ${i + 1}: ${cardImages.length}장 (고유: ${uniqueInCard}장)`);
}

// ✅ 특별 카드 처리
if (specialImages.length === 0) {
  console.warn("⚠️ 특별 카드용 이미지가 없습니다.");
  console.warn("   → 일반 이미지 중 50장을 사용합니다.");
  specialImages = shuffle([...normalImages]).slice(0, 50);
}

sigCards.push({
  id: 11,
  amount: 50000,
  frontImages: shuffle([...specialImages]),
  isSpecial: true,
});

console.log(`   🌟 특별 카드 (Card 11): ${sigCards[10].frontImages.length}장 할당`);

// ✅ 검증
console.log("\n🔍 빈 카드 검사 중...");
const emptyCards = sigCards.filter(c => !c.frontImages || c.frontImages.length === 0);
if (emptyCards.length > 0) {
  console.error(`❌ 빈 카드 발견: Card ${emptyCards.map(c => c.id).join(", ")}`);
  process.exit(1);
}
console.log("✅ 모든 카드에 이미지 할당됨!");

console.log("\n🔍 카드 간 중복 분석 중...");
const normalCardsOnly = sigCards.filter(c => !c.isSpecial);
const allNormalImages = normalCardsOnly.flatMap(c => c.frontImages);
const totalImages = allNormalImages.length;
const uniqueImages = new Set(allNormalImages).size;
const duplicateCount = totalImages - uniqueImages;
const duplicationRate = ((duplicateCount / totalImages) * 100).toFixed(2);

console.log(`   📊 전체 통계:`);
console.log(`      총 이미지 슬롯: ${totalImages}개`);
console.log(`      고유 이미지: ${uniqueImages}개`);
console.log(`      중복 슬롯: ${duplicateCount}개`);
console.log(`      중복률: ${duplicationRate}%`);

const imageUsage = {};
allNormalImages.forEach(img => {
  imageUsage[img] = (imageUsage[img] || 0) + 1;
});

const usageDistribution = {};
Object.values(imageUsage).forEach(count => {
  usageDistribution[count] = (usageDistribution[count] || 0) + 1;
});

console.log(`\n   📈 사용 빈도 분포:`);
Object.entries(usageDistribution)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([count, images]) => {
    console.log(`      ${count}번 사용: ${images}개 이미지`);
  });

const topUsed = Object.entries(imageUsage)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

if (topUsed.length > 0 && topUsed[0][1] > 1) {
  console.log(`\n   🔝 가장 많이 사용된 이미지 (상위 5개):`);
  topUsed.forEach(([img, count]) => {
    console.log(`      ${path.basename(img)}: ${count}번`);
  });
}

console.log("\n📊 최종 카드 구성:");
sigCards.forEach((c) => {
  const type = c.isSpecial ? "🌟 특별" : "📇 일반";
  const imgCount = c.frontImages?.length || 0;
  const uniqueCount = new Set(c.frontImages).size;
  const sample = c.frontImages?.[0] || "없음";
  console.log(`   Card ${c.id} (${type}): ${imgCount}장 (고유: ${uniqueCount}장)`);
  console.log(`      첫 이미지: ${path.basename(sample)}`);
});

// ✅ 확률 기반 메시지 정의 (가중치 포함)
const normalMessagePool = [
  { text: "기여도 두배 🎁", tier: "일반", color: "#ffffff", bgColor: "#443288", weight: 60 },
  { text: "기여도 세배 🎉", tier: "희귀", color: "#22543d", bgColor: "#9ae6b4", weight: 15 },
  { text: "10,000원 당첨!", tier: "레어", color: "#1d4438", bgColor: "#68d391", weight: 1 },
  { text: "5,000원 당첨!", tier: "레어", color: "#1d4438", bgColor: "#68d391", weight: 5 },
  { text: "1,000원 당첨!", tier: "희귀", color: "#22543d", bgColor: "#9ae6b4", weight: 19 },
];

const specialMessagePool = [
  { text: "🎊 100,000원 당첨!", tier: "레전드", color: "#2f1410", bgColor: "linear-gradient(90deg, #face6d, #f97393)", weight: 10 },
  { text: "기여도 세배 🌟", tier: "전설", color: "#2f1410", bgColor: "linear-gradient(90deg, #face6d, #f97393)", weight: 70 },
  { text: "💎 50,000원 당첨!", tier: "레전드", color: "#2f1410", bgColor: "linear-gradient(90deg, #face6d, #f97393)", weight: 20 },
];

// ✅ 파일 생성
const output = `// ⚙️ 자동 생성된 파일

export const sigCards = ${JSON.stringify(sigCards, null, 2)};

// 일반 카드(1~10) 메시지 풀 (가중치 포함)
export const normalMessages = ${JSON.stringify(normalMessagePool, null, 2)};

// 특별 카드(11) 메시지 풀 (가중치 포함)
export const specialMessages = ${JSON.stringify(specialMessagePool, null, 2)};

// 하위 호환성을 위한 통합 배열
export const messages = [...normalMessages, ...specialMessages];
`;

const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(outputFile, output, "utf8");

console.log("\n🎉 sigData.js 생성 완료!");
console.log(`📄 위치: ${outputFile}`);
console.log("\n✅ 확률 설정:");
console.log("\n📇 일반 카드(1~10):");
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