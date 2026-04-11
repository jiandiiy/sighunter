/**
 * scripts/generateSigHunterImagePresets.js
 *
 * - IMAGE_SOURCE=local    : public/images 폴더를 읽어서 presets 생성
 * - IMAGE_SOURCE=storage  : Firebase Storage prefix를 list 해서 presets 생성
 *
 * 수동 숫자 매칭 키:
 *   key = `${mode}/${group}/${file}`
 * (scripts/sigHunterManualCounts.js 키 포맷과 동일해야 함)
 */

const fs = require("fs");
const path = require("path");

const manualCounts = require("./sigHunterManualCounts");

const rootDir = path.resolve(__dirname, "..");
const outputFile = path.join(rootDir, "src/shared/data/sigHunterImagePresets.js");

// 실행 방식 선택
// 예) IMAGE_SOURCE=local node scripts/generateSigHunterImagePool.js
// 예) IMAGE_SOURCE=storage node scripts/generateSigHunterImagePool.js
const IMAGE_SOURCE = process.env.IMAGE_SOURCE || "local";

// Storage 설정
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "sig-hunter.firebasestorage.app";
const STORAGE_BASE_PREFIX = process.env.STORAGE_BASE_PREFIX || "images"; // gs://.../images/... 기준

// Local 설정
const localBaseDir = path.join(rootDir, "public/images");

// 모드/그룹
const MODES = ["muse", "queendom", "holic"];

const GROUPS_BY_MODE = {
  muse: ["group01", "group02", "group03", "group04", "group05", "group06", "group07", "group09", "group10", "group11", "group12"],
  queendom: ["group01", "group02", "group03", "group04", "group05", "group06", "group07", "group09", "group10", "group11", "group12"],
  holic: ["group01", "group02", "group03", "group04", "group05", "group06", "group07", "group09", "group10", "group11", "group12"],
};

function toPublicFirebaseStorageUrl(bucket, objectPath) {
  // objectPath 예: images/queendom/group12/sig_10000.webp
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}

function extOk(name) {
  return /\.(webp|png|jpg|jpeg)$/i.test(name);
}

async function main() {
  const data = {};
  const missingManual = [];

  // storage 초기화는 1번만
  let storageBucket = null;
  if (IMAGE_SOURCE === "storage") {
    const admin = require("firebase-admin");
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: STORAGE_BUCKET,
    });
    storageBucket = admin.storage().bucket();
  }

  for (const mode of MODES) {
    data[mode] = {};

    const groups = GROUPS_BY_MODE[mode] || [];
    for (const group of groups) {
      const items = [];

      if (IMAGE_SOURCE === "local") {
        if (!fs.existsSync(localBaseDir)) {
          console.error("❌ public/images 폴더 없음:", localBaseDir);
          process.exit(1);
        }

        const modeDir = path.join(localBaseDir, mode);
        const groupDir = path.join(modeDir, group);

        if (!fs.existsSync(modeDir)) {
          console.warn(`⚠️ 모드 폴더 없음: ${modeDir}`);
          data[mode][group] = [];
          continue;
        }
        if (!fs.existsSync(groupDir)) {
          console.warn(`⚠️ ${mode}/${group} 폴더 없음`);
          data[mode][group] = [];
          continue;
        }

        const files = fs.readdirSync(groupDir).filter(extOk).sort();

        console.log(`\n▶︎ ${mode}/${group}: ${files.length}개 처리 시작 (local: 수동만 사용)`);

        for (const file of files) {
          const webPath = `/images/${mode}/${group}/${file}`;
          const key = `${mode}/${group}/${file}`;

          if (Object.prototype.hasOwnProperty.call(manualCounts, key)) {
            const manual = manualCounts[key];
            console.log(`  - ${file} : 수동 지정 -> ${manual}`);
            items.push({
              path: webPath,
              rawText: "[MANUAL]",
              count: manual,
            });
          } else {
            console.log(`  - ${file} : ⚠️ 수동 값 없음 -> 0 으로 설정`);
            missingManual.push({ mode, group, file, path: webPath });
            items.push({
              path: webPath,
              rawText: "[NO_MANUAL]",
              count: 0,
            });
          }
        }

        data[mode][group] = items;
        continue;
      }

      if (IMAGE_SOURCE === "storage") {
        const prefix = `${STORAGE_BASE_PREFIX}/${mode}/${group}/`; // images/queendom/group12/
        console.log(`\n▶︎ ${mode}/${group}: Storage prefix ${prefix} 조회 시작`);

        const [files] = await storageBucket.getFiles({ prefix });

        const imageFiles = files
          .map((f) => f.name) // objectPath 전체
          .filter(extOk)
          .sort();

        console.log(`✅ ${mode}/${group}: ${imageFiles.length}개 처리`);

        for (const objectPath of imageFiles) {
          const file = objectPath.split("/").pop();
          const key = `${mode}/${group}/${file}`;
          const urlPath = toPublicFirebaseStorageUrl(STORAGE_BUCKET, objectPath);

          if (Object.prototype.hasOwnProperty.call(manualCounts, key)) {
            const manual = manualCounts[key];
            items.push({
              path: urlPath, // URL 처리 가능하다고 했으니 그대로 URL 저장
              rawText: "[MANUAL]",
              count: manual,
            });
          } else {
            console.log("MISSING DEBUG", { mode, group, file, objectPath, key });
            missingManual.push({ mode, group, file, objectPath });
            items.push({
              path: urlPath,
              rawText: "[NO_MANUAL]",
              count: 0,
            });
          }
        }

        data[mode][group] = items;
        continue;
      }

      console.error(`❌ IMAGE_SOURCE 값이 올바르지 않습니다: ${IMAGE_SOURCE}`);
      process.exit(1);
    }
  }

  const output = `// ⚙️ 자동 생성: 시그헌터 빙고 이미지 풀 (수동 숫자만 사용)
// scripts/generateSigHunterImagePresets.js 에 의해 생성됨
// 수동 숫자: scripts/sigHunterManualCounts.js 참고
export const sigHunterImagePresets = ${JSON.stringify(data, null, 2)};
`;

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, output, "utf8");
  console.log("\n🎉 sigHunterImagePresets.js 생성 완료:", outputFile);

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