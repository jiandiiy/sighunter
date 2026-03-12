// scripts/uploadImagesToStorage.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "sig-hunter.firebasestorage.app",
});

const bucket = admin.storage().bucket();

// ✅ 로컬 기준 폴더
const baseDir = path.join(__dirname, "../public/images");

// ✅ Storage 루트 경로 (폴더 구조 그대로 유지)
//    public/images/muse/group01/a.webp → images/muse/group01/a.webp
const remotePrefix = "sig-hunter/images";

// ✅ 진행 상황 카운터
let uploadCount = 0;
let skipCount = 0;
let failCount = 0;

async function uploadDir(localDir, remoteDir) {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });

  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = `${remoteDir}/${entry.name}`;

    if (entry.isDirectory()) {
      // 하위 폴더 재귀
      await uploadDir(localPath, remotePath);

    } else if (/\.(webp|png|jpg|jpeg)$/i.test(entry.name)) {
      try {
        // ✅ 이미 업로드된 파일 스킵 (재실행 시 중복 방지)
        const [exists] = await bucket.file(remotePath).exists();
        if (exists) {
          console.log(`⏭️  스킵 (이미 존재): ${remotePath}`);
          skipCount++;
          continue;
        }

        await bucket.upload(localPath, {
          destination: remotePath,
          metadata: {
            cacheControl: "public, max-age=31536000",
          },
        });

        uploadCount++;
        console.log(`✅ [${uploadCount}] ${remotePath}`);

      } catch (e) {
        failCount++;
        console.error(`❌ 실패: ${remotePath}`, e.message);
      }
    }
  }
}

async function main() {
  console.log("🚀 업로드 시작...\n");
  console.log(`📁 로컬 경로: ${baseDir}`);
  console.log(`☁️  Storage 경로: gs://sig-hunter.firebasestorage.app/${remotePrefix}/\n`);

  await uploadDir(baseDir, remotePrefix);

  console.log("\n=============================");
  console.log(`✅ 업로드 완료: ${uploadCount}개`);
  console.log(`⏭️  스킵 (기존 파일): ${skipCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log("=============================");
}

main().catch((e) => {
  console.error("💥 치명적 오류:", e);
  process.exit(1);
});