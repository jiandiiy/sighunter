// server/routes/sigRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  addSig,
  findAll,
  sampleRandom,
  updateSig,
  removeSig,
} = require("../sigStore");

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
 */
router.post("/", upload.single("image"), (req, res) => {
  try {
    const {
      title,
      score,
      mode,
      type,
      rarity,
      isActive,
      slotIndex,
      boardIndex,
    } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "image file is required" });
    }
    if (!mode || !type) {
      return res
        .status(400)
        .json({ error: "mode, type are required (game / mode)" });
    }

    // meal-bingo 인 경우에는 빙고판 번호 필수
    if (type === "meal-bingo" && (!boardIndex || boardIndex === "")) {
      return res
        .status(400)
        .json({ error: "boardIndex is required for meal-bingo" });
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
      slotIndex:
        typeof slotIndex === "string" && slotIndex.trim() !== ""
          ? Number(slotIndex)
          : null,
      boardIndex:
        typeof boardIndex === "string" && boardIndex.trim() !== ""
          ? Number(boardIndex)
          : null,
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error("POST /api/sigs error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

/**
 * PATCH /api/sigs/:id
 * body: { title?, score?, slotIndex?, boardIndex?, isActive? }
 */
router.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { title, score, slotIndex, boardIndex, isActive } = req.body;

    const patch = {};
    if (title !== undefined) patch.title = title;
    if (score !== undefined) patch.score = score;

    if (slotIndex !== undefined) {
      patch.slotIndex =
        slotIndex === null || slotIndex === "" ? null : Number(slotIndex);
    }

    if (boardIndex !== undefined) {
      patch.boardIndex =
        boardIndex === null || boardIndex === ""
          ? null
          : Number(boardIndex);
    }

    if (isActive !== undefined) patch.isActive = !!isActive;

    const updated = updateSig(id, patch);
    if (!updated) {
      return res.status(404).json({ error: "not found" });
    }
    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/sigs/:id error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

/**
 * DELETE /api/sigs/:id
 */
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const ok = removeSig(id);
    if (!ok) {
      return res.status(404).json({ error: "not found" });
    }
    return res.status(204).end();
  } catch (err) {
    console.error("DELETE /api/sigs/:id error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /api/sigs/random
 */
router.get("/random", (req, res) => {
  try {
    const { mode, type, rarity, boardIndex } = req.query;
    const count = Number(req.query.count) || 9;

    const all = findAll({
      mode,
      type,
      rarity,
      boardIndex,
      onlyActive: true,
    });
    const sampled = sampleRandom(all, count);

    return res.json(sampled);
  } catch (err) {
    console.error("GET /api/sigs/random error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /api/sigs
 */
router.get("/", (req, res) => {
  try {
    const { mode, type, rarity, activeOnly, boardIndex } = req.query;
    const onlyActive = activeOnly !== "false";
    const all = findAll({ mode, type, rarity, boardIndex, onlyActive });
    return res.json(all);
  } catch (err) {
    console.error("GET /api/sigs error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

module.exports = router;