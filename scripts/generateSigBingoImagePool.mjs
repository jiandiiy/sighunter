// scripts/generateSigBingoImagePool.mjs
// ⚙️ 시그 빙고 이미지 풀 자동 생성 스크립트
import { promises as fs } from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_IMAGES_ROOT = path.join(PROJECT_ROOT, "public", "images");

// ✅ 여기에서 "식대전" 모드 이름이랑 폴더 구조를 정의해 주세요
// 예시1: muse/queendom 구조 그대로 쓴다면
const bingoConfig = {
  muse: [
    "muse/group01",
    "muse/group02",
  ],
  queendom: [
    "queendom/group01",
    "queendom/group02",
  ],
  holic: [
    "holic/group01",
    "holic/group02",
  ],

};

async function readImagesFromDir(relativeDir) {
  const dir = path.join(PUBLIC_IMAGES_ROOT, relativeDir);
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (e) {
    console.warn(`[generateSigBingoImagePool] 디렉터리 없음: ${relativeDir}`);
    return [];
  }

  return files
    .filter((f) => f.endsWith(".webp") || f.endsWith(".png") || f.endsWith(".jpg"))
    .sort()
    .map((f) => `/images/${relativeDir}/${f}`);
}

async function buildPoolForMode(mode, dirs) {
  const all = [];
  for (const d of dirs) {
    const paths = await readImagesFromDir(d);
    all.push(...paths);
  }
  return all;
}

async function main() {
  const result = {};

  for (const [mode, dirs] of Object.entries(bingoConfig)) {
    result[mode] = await buildPoolForMode(mode, dirs);
  }

  const outPath = path.join(PROJECT_ROOT, "src", "shared", "data", "sigBingoImagePresets.js");

  const fileContent = `// ⚙️ 자동 생성: 시그 빙고 이미지 풀
// scripts/generateSigBingoImagePool.mjs 에 의해 생성됨
// 이 파일은 직접 수정하지 마세요.
export const bingoImagePool = ${JSON.stringify(result, null, 2)};
`;

  await fs.writeFile(outPath, fileContent, "utf8");
  console.log(`[generateSigBingoImagePool] 생성 완료: ${outPath}`);
}

main().catch((err) => {
  console.error("[generateSigBingoImagePool] 에러:", err);
  process.exit(1);
});