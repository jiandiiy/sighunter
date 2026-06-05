// diceServer/services/diceService.js
// Dice Game 비즈니스 로직 (롤링, 히스토리, 통계)

const probabilities = require('../utils/probabilities');

// 메모리 저장소 (실제 프로덕션에서는 DB 사용)
let gameHistory = [];
let gameStats = {
  totalRolls: 0,
  singleModeRolls: 0,
  doubleModeRolls: 0,
  weightModes: {
    normal: 0,
    high_number: 0,
    high_sum: 0,
    manual: 0,
  },
};

/**
 * 주사위 굴리기 메인 로직
 * 프론트엔드 기대 형식: { dice1, dice2, sum, specialEffect }
 */
async function rollDice({ mode, weightMode, targetNumber, targetSum, nextManualResult }) {
  try {
    let diceResult;
    let dice1, dice2, sum;
    let specialEffect = null;

    // 모드에 따라 주사위 굴림
    if (mode === 'single') {
      diceResult = probabilities.roll(weightMode, targetNumber || nextManualResult);
      dice1 = diceResult;
      dice2 = null;
      sum = diceResult;
      
      // 특별 효과: 1 (min) 또는 6 (max)
      if (diceResult === 6) specialEffect = 'max';
      if (diceResult === 1) specialEffect = 'min';
    } else if (mode === 'double') {
      diceResult = probabilities.rollDoubleDice(weightMode, targetSum);
      [dice1, dice2] = diceResult;
      sum = dice1 + dice2;
      
      // 특별 효과: 더블 (같은 숫자) 또는 맥스 (6,6)
      if (dice1 === dice2) specialEffect = 'double';
      if (dice1 === 6 && dice2 === 6) specialEffect = 'max';
    }

    // 프론트엔드가 기대하는 형식으로 반환
    const result = {
      dice1,
      dice2,
      sum,
      specialEffect,
      timestamp: new Date().toISOString(),
      mode,
      weightMode,
    };

    // 히스토리에 추가 (내부 기록용 - 원본 데이터 보존)
    gameHistory.push({
      id: generateId(),
      ...result,
    });

    // 통계 업데이트
    updateStats(mode, weightMode);

    // 프론트엔드로 반환 (불필요한 필드 제거)
    return {
      dice1: result.dice1,
      dice2: result.dice2,
      sum: result.sum,
      specialEffect: result.specialEffect,
    };
  } catch (error) {
    console.error('Error in rollDice:', error);
    throw error;
  }
}

/**
 * 게임 통계 업데이트
 */
function updateStats(mode, weightMode) {
  gameStats.totalRolls++;

  if (mode === 'single') {
    gameStats.singleModeRolls++;
  } else if (mode === 'double') {
    gameStats.doubleModeRolls++;
  }

  if (gameStats.weightModes[weightMode] !== undefined) {
    gameStats.weightModes[weightMode]++;
  }
}

/**
 * 히스토리 조회
 */
function getHistory(limit = 50) {
  // 최근 limit개만 반환 (최신순)
  return gameHistory.slice(-limit).reverse();
}

/**
 * 전체 통계 조회
 */
function getStats() {
  return {
    ...gameStats,
    recentRolls: gameHistory.slice(-10).reverse(),
  };
}

/**
 * 히스토리 초기화 (어드민 전용)
 */
function clearHistory() {
  gameHistory = [];
  gameStats = {
    totalRolls: 0,
    singleModeRolls: 0,
    doubleModeRolls: 0,
    weightModes: {
      normal: 0,
      high_number: 0,
      high_sum: 0,
      manual: 0,
    },
  };
  console.log('Game history and stats cleared');
}

/**
 * 고유 ID 생성 (간단한 방식)
 */
function generateId() {
  return `roll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  rollDice,
  getHistory,
  getStats,
  clearHistory,
};