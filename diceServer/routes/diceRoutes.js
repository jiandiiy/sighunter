// diceServer/routes/diceRoutes.js
// Dice Game API 라우팅 정의

const express = require('express');
const router = express.Router();
const diceController = require('../controllers/diceController');

/**
 * POST /api/dice/roll
 * 주사위 굴리기
 * Body: { mode, weightMode, targetNumber?, targetSum?, nextManualResult? }
 */
router.post('/roll', diceController.rollDice);

/**
 * GET /api/dice/history
 * 게임 히스토리 조회
 */
router.get('/history', diceController.getHistory);

/**
 * GET /api/dice/stats
 * 게임 통계 조회
 */
router.get('/stats', diceController.getStats);

/**
 * DELETE /api/dice/history
 * 히스토리 초기화 (어드민 전용)
 */
router.delete('/history', diceController.clearHistory);

module.exports = router;