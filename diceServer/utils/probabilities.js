// diceServer/utils/probabilities.js
// 주사위 확률 계산 엔진 (4가지 가중치 모드)

/**
 * 정상 확률 (균등)
 * 1-6이 모두 1/6 확률
 */
function rollNormal() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * 높은 숫자 확률
 * 6이 40% 확률로 나올 확률이 높음
 */
function rollHighNumber() {
  const rand = Math.random();
  if (rand < 0.4) return 6;
  if (rand < 0.6) return 5;
  if (rand < 0.75) return 4;
  if (rand < 0.85) return 3;
  if (rand < 0.93) return 2;
  return 1;
}

/**
 * 높은 합계 확률 (2개 주사위 모드용)
 * 합계가 높게(9-12) 나올 확률 높음
 */
function rollHighSum() {
  const rand = Math.random();
  // 높은 숫자(5-6)가 나올 확률 증가
  if (rand < 0.5) return 6;
  if (rand < 0.75) return 5;
  if (rand < 0.88) return 4;
  if (rand < 0.95) return 3;
  if (rand < 0.98) return 2;
  return 1;
}

/**
 * 수동 설정 모드
 * 특정 숫자를 반환
 */
function rollManual(targetNumber) {
  // targetNumber가 1-6 범위인지 검증
  if (targetNumber >= 1 && targetNumber <= 6) {
    return targetNumber;
  }
  // 잘못된 값이면 정상 롤로 폴백
  return rollNormal();
}

/**
 * 메인 롤 함수
 * weightMode에 따라 적절한 함수 호출
 */
function roll(weightMode = 'normal', targetNumber = null) {
  switch (weightMode) {
    case 'normal':
      return rollNormal();
    case 'high_number':
      return rollHighNumber();
    case 'high_sum':
      return rollHighSum();
    case 'manual':
      return rollManual(targetNumber);
    default:
      return rollNormal();
  }
}

/**
 * 2개 주사위 롤
 */
function rollDoubleDice(weightMode = 'normal', targetSum = null) {
  if (weightMode === 'manual' && targetSum !== null) {
    // 수동 모드에서 합계가 지정된 경우
    // 합계가 2-12 범위인지 확인
    if (targetSum >= 2 && targetSum <= 12) {
      // 예: targetSum = 10이면 [4, 6], [5, 5], [6, 4] 중 하나 반환
      const possibilities = [];
      for (let i = 1; i <= 6; i++) {
        if (targetSum - i >= 1 && targetSum - i <= 6) {
          possibilities.push([i, targetSum - i]);
        }
      }
      if (possibilities.length > 0) {
        const chosen = possibilities[Math.floor(Math.random() * possibilities.length)];
        return chosen;
      }
    }
  }

  // 일반적인 경우: 각각 롤
  const dice1 = roll(weightMode);
  const dice2 = roll(weightMode);
  return [dice1, dice2];
}

/**
 * 통계 계산용 함수
 * 현재까지의 결과를 분석
 */
function analyzeResults(results) {
  const analysis = {
    totalRolls: results.length,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  };

  if (results.length === 0) return analysis;

  let sum = 0;
  results.forEach((result) => {
    const value = Array.isArray(result) ? result[0] + result[1] : result;
    sum += value;

    // 분포 기록 (단일 주사위만)
    if (!Array.isArray(result)) {
      analysis.distribution[result]++;
    }
  });

  analysis.average = (sum / results.length).toFixed(2);
  return analysis;
}

module.exports = {
  roll,
  rollDoubleDice,
  analyzeResults,
};