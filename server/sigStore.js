// server/sigStore.js
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "sig-items.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readAll() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeAll(items) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

// type 예시:
//  - "meal-bingo"       : 식대전 빙고
//  - "sighunter-bingo"  : 시그헌터 빙고
//  - "sighunter"        : 시그헌터(카드)
// rarity 예시:
//  - "normal"           : 일반 카드
//  - "special"          : 스페셜 카드
function addSig({
  title,
  score,
  mode,
  type,
  rarity = "normal",
  imageUrl,
  isActive = true,
}) {
  const items = readAll();
  const now = new Date().toISOString();

  const item = {
    id: uuidv4(),
    title: title || "",
    score: Number.isNaN(Number(score)) ? 0 : Number(score),
    mode, // "muse" | "queendom"
    type, // "meal-bingo" | "sighunter-bingo" | "sighunter"
    rarity: rarity || "normal", // "normal" | "special"
    imageUrl,
    isActive: Boolean(isActive),
    createdAt: now,
    updatedAt: now,
  };

  items.push(item);
  writeAll(items);

  return item;
}

function findAll({ mode, type, rarity, onlyActive = true } = {}) {
  let items = readAll();

  if (mode) {
    items = items.filter((i) => i.mode === mode);
  }
  if (type) {
    items = items.filter((i) => i.type === type);
  }
  if (rarity) {
    items = items.filter((i) => i.rarity === rarity);
  }
  if (onlyActive) {
    items = items.filter((i) => i.isActive);
  }

  return items;
}

function sampleRandom(items, count) {
  const copy = [...items];
  const result = [];
  const max = Math.min(count, copy.length);

  for (let i = 0; i < max; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }

  return result;
}

module.exports = {
  addSig,
  findAll,
  sampleRandom,
};