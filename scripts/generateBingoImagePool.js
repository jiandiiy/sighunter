// scripts/generateBingoImagePool.js
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const baseDir = path.join(rootDir, "public/images");
const outputFile = path.join(rootDir, "src/data/sigBingoImagePool.js");

function readImages(mode) {
  const modeDir = path.join(baseDir, mode);
  const groups = ["group1", "group2", "group3", "group4", "group5", "group6"];

  const result = [];

  groups.forEach((group) => {
    const groupPath = path.join(modeDir, group);
    if (!fs.existsSync(groupPath)) {
      console.warn(`⚠️ ${mode}/${group} 폴더 없음`);
      return;
    }

    const files = fs
      .readdirSync(groupPath)
      .filter((f) => /\.(webp|png|jpg|jpeg|gif)$/i.test(f))
      .sort() // 필요하면 정렬
      .map((f) => `/images/${mode}/${group}/${f}`);

    console.log(`✅ ${mode}/${group}: ${files.length}장`);
    result.push(...files);
  });

  return result;
}

if (!fs.existsSync(baseDir)) {
  console.error("❌ public/images 폴더를 찾을 수 없습니다.");
  process.exit(1);
}

const museImages = readImages("muse");
const queendomImages = readImages("queendom");

const output = `// ⚙️ 자동 생성된 빙고 이미지 풀
export const bingoImagePool = {
  muse: ${JSON.stringify(museImages, null, 2)},
  queendom: ${JSON.stringify(queendomImages, null, 2)},
};
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, output, "utf8");

console.log("🎉 sigBingoImagePool.js 생성 완료:", outputFile);