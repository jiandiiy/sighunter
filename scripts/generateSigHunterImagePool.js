// scripts/generateSigHunterImagePool.js
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const baseDir = path.join(rootDir, "public/images");
const outputFile = path.join(rootDir, "src/data/sigHunterImagePool.js");

// 모드별로 사용할 그룹 목록 (group8을 쓰고 싶으면 배열에 추가)
const GROUPS_BY_MODE = {
  muse: ["group01", "group02", "group03", "group04", "group05", "group06", "group07", "group09","group10"],
  queendom: ["group01", "group02", "group03", "group04", "group05", "group06", "group07", "group09", "group10"],
   holic: ["group01", "group02", "group03", "group04", "group05", "group06", "group07", "group08", "group09"],
};

function readImagesForMode(mode) {
  const modeDir = path.join(baseDir, mode);
  const groups = GROUPS_BY_MODE[mode] || [];

  const result = {};

  groups.forEach((group) => {
    const groupPath = path.join(modeDir, group);
    if (!fs.existsSync(groupPath)) {
      console.warn(`⚠️ ${mode}/${group} 폴더 없음`);
      result[group] = [];
      return;
    }

    const files = fs
      .readdirSync(groupPath)
      .filter((f) => /\.(webp|png|jpg|jpeg|gif)$/i.test(f))
      .sort()
      .map((f) => `/images/${mode}/${group}/${f}`);

    console.log(`✅ ${mode}/${group}: ${files.length}장`);
    result[group] = files;
  });

  return result;
}

if (!fs.existsSync(baseDir)) {
  console.error("❌ public/images 폴더를 찾을 수 없습니다.");
  process.exit(1);
}

const muse = readImagesForMode("muse");
const queendom = readImagesForMode("queendom");
const holic = readImagesForMode("holic");

const output = `// ⚙️ 자동 생성된 시그헌터 빙고 이미지 풀 (그룹별)
export const sigHunterImagePool = {
  muse: ${JSON.stringify(muse, null, 2)},
  queendom: ${JSON.stringify(queendom, null, 2)},
   holic: ${JSON.stringify(holic, null, 2)},
};
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, output, "utf8");

console.log("🎉 sigHunterImagePool.js 생성 완료:", outputFile);