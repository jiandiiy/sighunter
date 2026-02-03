// server/routes/sigRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { addSig, findAll, sampleRandom } = require("../sigStore");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads", "sig-images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

/**
 * POST /api/sigs
 * fields:
 *  - title
 *  - score
 *  - mode ("muse" | "queendom" 등)
 *  - type ("meal-bingo" | "sighunter-bingo" | "sighunter")
 *  - rarity ("normal" | "special")
 *  - isActive ("true" | "false")
 *  - image (file)
 */
router.post("/", upload.single("image"), (req, res) => {
  try {
    const { title, score, mode, type, rarity, isActive } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "image file is required" });
    }
    if (!mode || !type) {
      return res
        .status(400)
        .json({ error: "mode, type are required (game / mode)" });
    }

    const imageUrl = `/uploads/sig-images/${file.filename}`;

    const item = addSig({
      title,
      score,
      mode,
      type,
      rarity: rarity || "normal",
      imageUrl,
      isActive: isActive !== "false",
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error("POST /api/sigs error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /api/sigs/random
 * 쿼리:
 *  - mode
 *  - type
 *  - rarity (optional: "normal" | "special")
 *  - count (optional, 기본 9)
 */
router.get("/random", (req, res) => {
  try {
    const { mode, type, rarity } = req.query;
    const count = Number(req.query.count) || 9;

    const all = findAll({ mode, type, rarity, onlyActive: true });
    const sampled = sampleRandom(all, count);

    return res.json(sampled);
  } catch (err) {
    console.error("GET /api/sigs/random error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /api/sigs
 * 관리용 전체 조회
 * ?mode=&type=&rarity=&activeOnly=true|false
 */
router.get("/", (req, res) => {
  try {
    const { mode, type, rarity, activeOnly } = req.query;
    const onlyActive = activeOnly !== "false";
    const all = findAll({ mode, type, rarity, onlyActive });
    return res.json(all);
  } catch (err) {
    console.error("GET /api/sigs error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

module.exports = router;