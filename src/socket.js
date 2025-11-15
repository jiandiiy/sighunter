// src/socket.js
import { io } from "socket.io-client";

export const socket = io("http://127.0.0.1:3001", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// 디버그 로그
socket.on("connect", () => {
  console.log("🟢 Connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected");
});

socket.on("connect_error", (err) => {
  console.error("❌ Connect error:", err.message);
});

// 전역 등록 (콘솔 테스트용)
if (typeof window !== "undefined") {
  window.socket = socket;
}