// scripts/generateSigHunterImagePoolWithOCR.js
// ⛔ OCR 안 씀: 수동 테이블만 사용해서 src/data/sigHunterImagePool.js 생성

const fs = require("fs");
const path = require("path");
const manualCounts = require("./sigHunterManualCounts");

const rootDir = path.resolve(__dirname, "..");
const baseDir = path.join(rootDir, "public/images");
const outputFile = path.join(rootDir, "src/data/sigHunterImagePool.js");

const MODES = ["muse", "queendom"];

/**
 * ✅ 이미지 풀에 포함할 그룹들
 *
 * - 1~7 : 공통 일반 칸
 * - 8   : (예시) 3x3 중앙 전용
 * - 9,10: 5x5 중앙 전용
 *
 * 실제 사용하는 그룹 키에 맞게 이 배열만 조정하면 됩니다.
 */
const GROUPS = [
  "group1",
  "group2",
  "group3",
  "group4",
  "group5",
  "group6",
  "group7",
  "group9",
  "group10",
  "group11",
  "group12",
];

async function main() {
  if (!fs.existsSync(baseDir)) {
    console.error("❌ public/images 폴더 없음:", baseDir);
    process.exit(1);
  }

  const data = {};
  const missingManual = [];

  for (const mode of MODES) {
    const modeDir = path.join(baseDir, mode);
    if (!fs.existsSync(modeDir)) {
      console.warn(`⚠️ 모드 폴더 없음: ${modeDir}`);
      continue;
    }

    data[mode] = {};

    for (const group of GROUPS) {
      const groupDir = path.join(modeDir, group);
      if (!fs.existsSync(groupDir)) {
        console.warn(`⚠️ ${mode}/${group} 폴더 없음`);
        data[mode][group] = [];
        continue;
      }

      const files = fs
        .readdirSync(groupDir)
        .filter((f) => /\.(webp|png|jpg|jpeg)$/i.test(f))
        .sort();

      console.log(`\n▶︎ ${mode}/${group}: ${files.length}개 처리 시작 (수동만 사용)`);

      const items = [];
      for (const file of files) {
        const webPath = `/images/${mode}/${group}/${file}`;
        const key = `${mode}/${group}/${file}`;

        if (Object.prototype.hasOwnProperty.call(manualCounts, key)) {
          const manual = manualCounts[key];
          console.log(`  - ${file} : 수동 지정 -> ${manual}`);
          items.push({
            path: webPath,
            rawText: "[MANUAL]", // OCR 안 쓰므로 고정
            count: manual,
          });
        } else {
          console.log(`  - ${file} : ⚠️ 수동 값 없음 -> 0 으로 설정`);
          missingManual.push({ mode, group, file, path: webPath });
          items.push({
            path: webPath,
            rawText: "[NO_MANUAL]", // 수동도 없음
            count: 0, // 필요하면 null 로 변경 가능
          });
        }
      }

      data[mode][group] = items;
    }
  }

  // 데이터 파일 출력
  const output = `// ⚙️ 자동 생성: 시그헌터 이미지 풀 (수동 숫자만 사용)
// scripts/generateSigHunterImagePoolWithOCR.js 에 의해 생성됨
// 수동 숫자: scripts/sigHunterManualCounts.js 참고
export const sigHunterImagePool = ${JSON.stringify(data, null, 2)};
`;

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, output, "utf8");
  console.log("\n🎉 sigHunterImagePool.js 생성 완료:", outputFile);

  if (missingManual.length) {
    console.log("\n❗ 수동 값이 비어 있는 이미지들 (sigHunterManualCounts.js 에 추가 필요):");
    missingManual.forEach((f) => {
      console.log(`- ${f.mode}/${f.group}/${f.file}`);
    });
  } else {
    console.log("\n✅ 모든 이미지에 대해 수동 숫자 지정 완료");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});