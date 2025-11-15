// --- core modules ---
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import http from "http";
import { Server } from "socket.io";

// --- path setup (Mac & ESM 호환) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- express & http server ---
const app = express();
const server = http.createServer(app);

// --- socket.io 설정 ---
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",      // dev용
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://*.ngrok-free.app",   // ngrok 접근 허용
      "https://*.ngrok-free.dev"
    ],
    methods: ["GET", "POST"],
  },
  pingInterval: 25000,
  pingTimeout: 60000,
});

// ====================
// 🔹 Socket 이벤트 영역
// ====================

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  const currentGameState = {
    flippedCards: { 1: false, 2: true, 3: false },
    cardLocks: { 1: false, 2: false },
    cardMessages: { 1: "Welcome", 2: "", 3: "" },
    cardWeights: { 1: 0.5, 2: 0.3, 3: 0.2 },
  };

  // 연결 직후 초기 상태 전송
  setTimeout(() => {
    socket.emit("init", currentGameState);
    console.log("➡️ init sent (delayed)");
  }, 500);

  // Overlay 등에서 init 요청 시 응답
  socket.on("request:init", () => {
    console.log("📨 init requested:", socket.id);
    socket.emit("init", currentGameState);
  });

  // 카드 뒤집기
  socket.on("card:flip", (id) => {
    console.log("🎴 card flipped:", id);
    io.emit("card:flipped", { id, flipped: true });
  });

  socket.on("disconnect", () => console.log("🔴 disconnected:", socket.id));
});

// 테스트 이벤트 주기적 송신 (optional)
setInterval(() => {
  io.emit("card:flipped", { id: "test", flipped: true });
  console.log("🧪 test emit fired");
}, 5000);

// ====================
// 🔹 React 정적 파일 서빙
// ====================

// React build 결과(`client/dist`)를 정적 경로로 지정
app.use(express.static(path.join(__dirname, "../client/dist")));

// 모든 GET 요청을 React index.html로 리턴
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// ====================
// 🔹 서버 구동
// ====================

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running @ http://localhost:${PORT}`);
});