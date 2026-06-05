// diceServer/controllers/diceController.js
// Dice Game 요청 핸들링 및 응답 관리

const diceService = require('../services/diceService');

/**
 * 모드 정규화: 1/2 → single/double
 */
const normalizeMode = (mode) => {
  if (mode === 1 || mode === 'single') return 'single';
  if (mode === 2 || mode === 'double') return 'double';
  return null;
};

/**
 * POST /api/dice/roll
 * 주사위 굴리기 요청 처리
 */
exports.rollDice = async (req, res) => {
  try {
    const { mode, weightMode, targetNumber, targetSum, nextManualResult } = req.body;

    // 모드 검증 및 정규화
    const normalizedMode = normalizeMode(mode);
    if (!normalizedMode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode. Must be 1, 2, "single", or "double"',
      });
    }

    if (!weightMode || !['normal', 'high_number', 'high_sum', 'manual'].includes(weightMode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weightMode. Must be one of: normal, high_number, high_sum, manual',
      });
    }

    // manual 모드에서는 nextManualResult 필수
    if (weightMode === 'manual' && nextManualResult === undefined) {
      return res.status(400).json({
        success: false,
        message: 'nextManualResult is required for manual weightMode',
      });
    }

    // 서비스에서 주사위 롤링 처리
    const result = await diceService.rollDice({
      mode: normalizedMode,
      weightMode,
      targetNumber,
      targetSum,
      nextManualResult,
    });

    return res.status(200).json({
      success: true,
      dice1: result.dice1,
      dice2: result.dice2,
      sum: result.sum,
      specialEffect: result.specialEffect,
    });
  } catch (error) {
    console.error('Error in rollDice:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to roll dice',
    });
  }
};

/**
 * GET /api/dice/history
 * 게임 히스토리 조회
 */
exports.getHistory = async (req, res) => {
  try {
    const history = diceService.getHistory();
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error in getHistory:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch history',
    });
  }
};

/**
 * GET /api/dice/stats
 * 게임 통계 조회
 */
exports.getStats = async (req, res) => {
  try {
    const stats = diceService.getStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch stats',
    });
  }
};

/**
 * DELETE /api/dice/history
 * 히스토리 초기화 (어드민 전용)
 */
exports.clearHistory = async (req, res) => {
  try {
    diceService.clearHistory();
    return res.status(200).json({
      success: true,
      message: 'History cleared successfully',
    });
  } catch (error) {
    console.error('Error in clearHistory:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear history',
    });
  }
};