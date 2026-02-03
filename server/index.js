// server/index.js
// Express 앱 초기 세팅 및 시그 관련 라우터 연결

const express = require("express");
const cors = require("cors");
const path = require("path");

const sigRoutes = require("./routes/sigRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS 설정 (개발용: origin '*'로 개방, 필요시 도메인 제한)
app.use(
  cors({
    origin: "*",
  })
);

// JSON 본문 파싱
app.use(express.json());

// 업로드된 이미지 정적 제공
// 예: http://localhost:4000/uploads/sig-images/파일명.png
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 시그 관련 API 라우트 연결 (/api/sigs/...)
app.use("/api/sigs", sigRoutes);

// 서버 시작
app.listen(PORT, () => {
  console.log(`SIG server listening on port ${PORT}`);
});