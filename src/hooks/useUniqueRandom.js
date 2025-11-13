import { useCallback } from "react";

/**
 * 가중치 기반 랜덤 선택 훅 (중복 허용, 확률에 따른 랜덤 선택)
 * @param {Array} items - 선택할 아이템 배열 (weight 속성 포함)
 * @returns {Function} 가중치에 따라 랜덤 아이템을 반환하는 함수
 */
export default function useUniqueRandom(items) {
  const pickWeightedRandom = useCallback(() => {
    try {
      if (!items || items.length === 0) {
        console.error("useUniqueRandom: items 배열이 비어있습니다.");
        return null;
      }

      // ✅ 전체 가중치 합계 계산
      const totalWeight = items.reduce(
        (sum, item) => sum + (item.weight || 1), 
        0
      );

      // ✅ 0 ~ totalWeight 범위의 랜덤 값 생성
      let random = Math.random() * totalWeight;
      
      // ✅ 가중치에 따라 항목 선택
      for (const item of items) {
        const itemWeight = item.weight || 1;
        random -= itemWeight;

        if (random <= 0) {
          // weight 속성 제거 후 반환
          const { weight, ...result } = item;
          
          console.log(`🎲 선택됨: ${result.text} (확률: ${((itemWeight / totalWeight) * 100).toFixed(1)}%)`);
          
          return result;
        }
      }

      // ✅ 폴백 (부동소수점 오차 방지)
      const lastItem = items[items.length - 1];
      const { weight, ...result } = lastItem;
      
      console.warn("⚠️ 폴백 선택:", result.text);
      
      return result;

    } catch (error) {
      console.error("useUniqueRandom 오류:", error);
      if (items && items.length > 0) {
        const { weight, ...result } = items[0];
        return result;
      }
      return null;
    }
  }, [items]);

  return pickWeightedRandom;
}