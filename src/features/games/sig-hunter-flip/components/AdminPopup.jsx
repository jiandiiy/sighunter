import React, { useState, useEffect, useRef } from "react";
import {
  queendomSigCards,
  museSigCards,
  normalMessages as defaultNormalMessages,
  specialMessages as defaultSpecialMessages,
} from "../../../../shared/data";
import "../styles/adminPopup.css";

export default function AdminPopup({
  project,
  cardId,
  messages, // { normal: [...], special: [...] }
  onClose,
  // (weightsForThisCard, cardId, updatedMessagesWholeSet, allWeightsForAllCards?)
  onUpdate,
}) {
  const id = String(cardId); // 문자열 ID
  const numId = Number(cardId); // 카드 검색용 숫자

  // 프로젝트별 카드 세트 선택
  const projectCardSets = {
    queendom: queendomSigCards,
    muse: museSigCards,
  };
  const sigCards = projectCardSets[project] ?? queendomSigCards;
  const card = sigCards.find((c) => c.id === numId);

  const [weights, setWeights] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);
  const [, setIsApplied] = useState(false);
  const modalRef = useRef(null);

  const isSpecial = !!card?.isSpecial;

  /** 카드 데이터 로드 */
  useEffect(() => {
    if (!card) return;

    // Firestore에서 온 전체 메시지 세트 또는 기본값
    const baseAll =
      messages && messages.normal && messages.special
        ? messages
        : { normal: defaultNormalMessages, special: defaultSpecialMessages };

    const base = isSpecial ? baseAll.special : baseAll.normal;

    // 기존 가중치 로드
    const saved = JSON.parse(localStorage.getItem("cardWeights") || "{}");
    let initial = saved[id];

    if (!initial || initial.length !== base.length) {
      initial = base.map((m) => m.weight ?? 1);
      saved[id] = initial;
      localStorage.setItem("cardWeights", JSON.stringify(saved));
    }

    setWeights(initial);
    setLocalMessages(base.map((m) => ({ ...m })));
    setIsApplied(false);
  }, [id, card, messages, isSpecial]);

  /** 스크롤 진행 효과 (선택) */
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handleScroll = () => {
      const scrollTop = modal.scrollTop;
      const scrollHeight = modal.scrollHeight - modal.clientHeight;
      const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      modal.style.setProperty("--scroll-pos", `${percent}%`);
    };

    modal.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => modal.removeEventListener("scroll", handleScroll);
  }, []);

  /** 가중치 업데이트 */
  const updateWeight = (index, value, e) => {
    const numValue = parseInt(value, 10);
    const safeValue = Number.isFinite(numValue) ? Math.max(0, numValue) : 0;

    setIsApplied(false);

    setWeights((prev) => {
      const updated = [...prev];
      updated[index] = safeValue;

      if (e?.target) {
        e.target.style.setProperty("--range-progress", `${safeValue}%`);
      }

      return updated;
    });
  };

  /** 메시지 텍스트 수정 */
  const updateMessageText = (index, text) => {
    setIsApplied(false);
    setLocalMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text };
      return next;
    });
  };

  /** 항목 추가 */
  const addMessageRow = () => {
    setIsApplied(false);
    setLocalMessages((prev) => [
      ...prev,
      { text: "", weight: 1 }, // 최소 필드
    ]);
    setWeights((prev) => [...prev, 1]);
  };

  /** 항목 삭제 */
  const removeMessageRow = (index) => {
    setIsApplied(false);
    setLocalMessages((prev) => prev.filter((_, i) => i !== index));
    setWeights((prev) => prev.filter((_, i) => i !== index));
  };

  /** 이 카드에만 적용 */
  const applyWeights = () => {
    if (!card) return;

    // 1) 로컬 메시지 + 가중치 합쳐서 새로운 메시지 배열 생성
    const mergedMessages = localMessages.map((m, i) => ({
      ...m,
      weight: weights[i] ?? 0,
    }));

    // 2) 이 카드 타입에 맞는 전체 메시지 세트로 다시 구성
    const currentAll =
      messages && messages.normal && messages.special
        ? messages
        : { normal: defaultNormalMessages, special: defaultSpecialMessages };

    const updatedAll = {
      normal: isSpecial ? currentAll.normal : mergedMessages,
      special: isSpecial ? mergedMessages : currentAll.special,
    };

    // 3) cardWeights도 이 카드에 한해서 업데이트
    const all = JSON.parse(localStorage.getItem("cardWeights") || "{}");
    all[id] = mergedMessages.map((m) => m.weight ?? 0);
    localStorage.setItem("cardWeights", JSON.stringify(all));

    // 4) 상위로 전달 → 이 카드만 갱신
    onUpdate?.(all[id], id, updatedAll, undefined);
    setIsApplied(true);
  };

  /** 이 타입(일반/스페셜) 현재 설정을 같은 타입 전체 카드에 복사 */
  const applyToAllCardsOfThisType = () => {
    if (!card) return;

    if (
      !window.confirm(
        `지금 설정한 ${
          isSpecial ? "스페셜" : "일반"
        } 메시지/확률을 같은 타입의 모든 카드에 동일하게 적용할까요?`
      )
    ) {
      return;
    }

    // 1) 현재 로컬 편집 상태 기준 메시지 세트
    const mergedMessages = localMessages.map((m, i) => ({
      ...m,
      weight: weights[i] ?? 0,
    }));

    // 2) 전체 메시지 세트 갱신
    const currentAll =
      messages && messages.normal && messages.special
        ? messages
        : { normal: defaultNormalMessages, special: defaultSpecialMessages };

    const updatedAll = {
      normal: isSpecial ? currentAll.normal : mergedMessages,
      special: isSpecial ? mergedMessages : currentAll.special,
    };

    // 3) cardWeights: 같은 타입 카드 모두에 동일 weight 세트 적용
    const allWeights =
      JSON.parse(localStorage.getItem("cardWeights") || "{}") || {};

    sigCards.forEach((c) => {
      const key = String(c.id);
      if (!!c.isSpecial === isSpecial) {
        // 같은 타입(일반 / 스페셜)인 카드들만
        allWeights[key] = mergedMessages.map((m) => m.weight ?? 0);
      }
    });

    localStorage.setItem("cardWeights", JSON.stringify(allWeights));

    // 4) 상위로 전달 → 전체 cardWeights도 함께 전달
    onUpdate?.(
      allWeights[id], // 현재 카드용 배열
      id,
      updatedAll, // 전체 메시지 세트
      allWeights // 전체 카드 가중치
    );
    setIsApplied(true);
  };

  /** 이 타입(일반/스페셜) 메시지만 기본값으로 */
  const resetSingleCard = () => {
    if (!card) return;
    if (
      window.confirm(
        `이 카드가 사용하는 ${
          isSpecial ? "스페셜" : "일반"
        } 메시지 세트를 기본값으로 복원할까요?`
      )
    ) {
      const base = isSpecial
        ? defaultSpecialMessages
        : defaultNormalMessages;

      const init = base.map((m) => m.weight ?? 1);

      const currentAll =
        messages && messages.normal && messages.special
          ? messages
          : { normal: defaultNormalMessages, special: defaultSpecialMessages };

      const updatedAll = {
        normal: isSpecial ? currentAll.normal : base,
        special: isSpecial ? base : currentAll.special,
      };

      const all = JSON.parse(localStorage.getItem("cardWeights") || "{}");
      all[id] = init;
      localStorage.setItem("cardWeights", JSON.stringify(all));

      setLocalMessages(base.map((m) => ({ ...m })));
      setWeights(init);
      setIsApplied(false);

      onUpdate?.(init, id, updatedAll, undefined);

      alert("✅ 메시지와 확률이 기본값으로 복원되었습니다.");
    }
  };

  /** 전체(일반+스페셜) 전부 기본값으로 */
  const resetAllCards = () => {
    if (
      window.confirm("모든 메시지와 확률을 기본값으로 복원하시겠습니까?")
    ) {
      const updatedAll = {
        normal: defaultNormalMessages,
        special: defaultSpecialMessages,
      };

      const normalW = defaultNormalMessages.map((m) => m.weight ?? 1);
      const specialW = defaultSpecialMessages.map((m) => m.weight ?? 1);
      const all = {};

      sigCards.forEach((c) => {
        const key = String(c.id);
        all[key] = c.isSpecial ? specialW : normalW;
      });

      localStorage.setItem("cardWeights", JSON.stringify(all));

      const selfInit = isSpecial
        ? defaultSpecialMessages
        : defaultNormalMessages;
      const selfWeights = selfInit.map((m) => m.weight ?? 1);
      setLocalMessages(selfInit.map((m) => ({ ...m })));
      setWeights(selfWeights);
      setIsApplied(false);

      onUpdate?.(selfWeights, id, updatedAll, all);

      alert("✅ 모든 메시지와 확률이 기본값으로 복원되었습니다!");
    }
  };

  if (!card || isNaN(id)) {
    return (
      <div className="admin-overlay" onClick={onClose}>
        <div className="admin-modal">
          <h2>❌ 카드 ID 없음</h2>
          <p>올바른 카드가 선택되지 않았습니다.</p>
          <button className="close-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div
        className="admin-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-container">
          <h2>🎰 {id}번 카드 메시지 / 확률 조절</h2>
          <p className="card-type">
            {isSpecial ? "🌟 특별 카드" : "📇 일반 카드"}
          </p>

          <div className="prob-list">
            {localMessages.map((msg, i) => {
              const total = weights.reduce((a, b) => a + b, 0) || 1;
              const percent = ((weights[i] / total) * 100).toFixed(1);

              return (
                <div className="prob-control" key={i}>
                  <div className="prob-header">
                    <input
                      type="text"
                      className="msg-text-input"
                      value={msg.text || ""}
                      onChange={(e) =>
                        updateMessageText(i, e.target.value)
                      }
                      placeholder="메시지 내용"
                    />
                    <span className="prob-percent">({percent}%)</span>
                    <button
                      type="button"
                      className="remove-row-btn"
                      onClick={() => removeMessageRow(i)}
                    >
                      ✖
                    </button>
                  </div>
                  <div className="prob-inputs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weights[i] || 0}
                      onChange={(e) =>
                        updateWeight(i, e.target.value, e)
                      }
                      className="range-input"
                      style={{
                        "--range-progress": `${weights[i] || 0}%`,
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weights[i] || 0}
                      onChange={(e) =>
                        updateWeight(i, e.target.value)
                      }
                      className="number-input"
                    />
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className="add-row-btn"
              onClick={addMessageRow}
            >
              ➕ 메시지 항목 추가
            </button>
          </div>

          <div className="button-group">
            <button className="reset-single-btn" onClick={resetSingleCard}>
              🔄 이 타입 메시지만 기본값
            </button>
            <button className="reset-all-btn" onClick={resetAllCards}>
              🔄 전체 메시지/확률 초기화
            </button>

            <button
              className="apply-btn"
              type="button"
              onClick={applyToAllCardsOfThisType}
            >
              📦 이 타입 전체 카드에 동일 적용
            </button>

            <button className="apply-btn" onClick={applyWeights}>
              적용 (이 카드만)
            </button>
            <button className="close-btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}