// main.js
const { app, BrowserWindow, screen } = require("electron");


function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    // 브라우저에서 딱 맞게 보이던 정도로 추정한 값
    width: 1400,   // 필요하면 1366, 1440 등으로 조정
    height: 1400,   // 필요하면 800 정도로
    backgroundColor: "transparent",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.webContents.on("did-finish-load", () => {
  console.log("✅ did-finish-load");
  console.log("✅ zoom factor:", win.webContents.getZoomFactor());
});

  // 실제: Vercel URL
  win.loadURL("https://sighunter-five.vercel.app/");

  // 초기 확대 비율 100% 로 고정
  win.webContents.setZoomFactor(0.75);

  // 로딩 실패/성공 여부 로그
  win.webContents.on("did-fail-load", (event, code, desc, url) => {
    console.log("❌ did-fail-load:", code, desc, url);
  });

  win.webContents.on("did-finish-load", () => {
    console.log("✅ did-finish-load");
  });

  // 필요하면 개발자 도구
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});