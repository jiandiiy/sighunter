import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  queendomSigCards,
  museSigCards,
  holicSigCards,
  normalMessages as defaultNormalMessages,
  specialMessages as defaultSpecialMessages,
} from "../../../../shared/data";
import "../styles/adminPopup.css";

export default function AdminPopup({
  project, // "queendom" | "muse" | "holic"
  cardId,
  // messages: { queendom?: {normal,special}, muse?: {...}, holic?: {...} }
  messages,
  onClose,
  // onUpdate(weightsForThisCard, cardId, { project, messagesForThisProject }, allWeightsForAllCards?)
  onUpdate,
}) {
  const id = String(cardId);
  const numId = Number(cardId);

  /** 1) 프로젝트별 카드 세트 + storageKey 분리 */
  const projectConfig = {
    queendom: {
      sigCards: queendomSigCards,
      storageKey: "cardWeights_queendom",
    },
    muse: {
      sigCards: museSigCards,
      storageKey: "cardWeights_muse",
    },
    holic: {
      sigCards: holicSigCards,
      storageKey: "cardWeights_holic",
    },
  };

  const { sigCards, storageKey } =
    projectConfig[project] ?? projectConfig.queendom;

  const card = sigCards.find((c) => c.id === numId);
  const isSpecial = !!card?.isSpecial;

  const [weights, setWeights] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);
  const [, setIsApplied] = useState(false);
  const modalRef = useRef(null);

  /**
   * 2) 이 프로젝트에 해당하는 messages 선택
   *    - 우선순위: messages[project] → 공통 default
   */
  const baseAllMessages = useMemo(() => {
    const projectMessages = messages?.[project];
    if (
      projectMessages &&
      projectMessages.normal &&
      projectMessages.special
    ) {
      return projectMessages;
    }
    return {
      normal: defaultNormalMessages,
      special: defaultSpecialMessages,
    };
  }, [messages, project]);

  /** 카드 데이터 로드 */
  useEffect(() => {
    if (!card) return;

    const base = isSpecial ? baseAllMessages.special : baseAllMessages.normal;

    // 프로젝트별 localStorage 키 사용
    const savedAll =
      JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    let initial = savedAll[id];

    // 길이 안 맞으면 다시 기본값으로 초기화
    if (!initial || initial.length !== base.length) {
      initial = base.map((m) => m.weight ?? 1);
      savedAll[id] = initial;
      localStorage.setItem(storageKey, JSON.stringify(savedAll));
    }

    setWeights(initial);
    setLocalMessages(base.map((m) => ({ ...m })));
    setIsApplied(false);
  }, [id, card, isSpecial, baseAllMessages, storageKey]);

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
    setLocalMessages((prev) => [...prev, { text: "", weight: 1 }]);
    setWeights((prev) => [...prev, 1]);
  };

  /** 항목 삭제 */
  const removeMessageRow = (index) => {
    setIsApplied(false);
    setLocalMessages((prev) => prev.filter((_, i) => i !== index));
    setWeights((prev) => prev.filter((_, i) => i !== index));
  };

  /** 공통: 현재 프로젝트용 messages 세트 생성 */
  const buildUpdatedProjectMessages = (mergedMessages) => {
    return {
      normal: isSpecial ? baseAllMessages.normal : mergedMessages,
      special: isSpecial ? mergedMessages : baseAllMessages.special,
    };
  };

  /** 이 카드에만 적용 */
  const applyWeights = () => {
    if (!card) return;

    const mergedMessages = localMessages.map((m, i) => ({
      ...m,
      weight: weights[i] ?? 0,
    }));

    const updatedProjectMessages =
      buildUpdatedProjectMessages(mergedMessages);

    // 프로젝트별 cardWeights 갱신 (이 카드만)
    const all =
      JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    all[id] = mergedMessages.map((m) => m.weight ?? 0);
    localStorage.setItem(storageKey, JSON.stringify(all));

    // 상위로 전달: 이 프로젝트에 대한 messages만 넘김
    onUpdate?.(all[id], id, {
      project,
      messagesForThisProject: updatedProjectMessages,
    });

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

    const mergedMessages = localMessages.map((m, i) => ({
      ...m,
      weight: weights[i] ?? 0,
    }));

    const updatedProjectMessages =
      buildUpdatedProjectMessages(mergedMessages);

    const allWeights =
      JSON.parse(localStorage.getItem(storageKey) || "{}") || {};

    sigCards.forEach((c) => {
      const key = String(c.id);
      if (!!c.isSpecial === isSpecial) {
        allWeights[key] = mergedMessages.map((m) => m.weight ?? 0);
      }
    });

    localStorage.setItem(storageKey, JSON.stringify(allWeights));

    onUpdate?.(allWeights[id], id, {
      project,
      messagesForThisProject: updatedProjectMessages,
      allWeightsForThisProject: allWeights,
    });

    setIsApplied(true);
  };

  /** 이 타입(일반/스페셜) 메시지만 기본값으로 (현재 프로젝트 기준) */
  const resetSingleCard = () => {
    if (!card) return;
    if (
      !window.confirm(
        `이 카드가 사용하는 ${
          isSpecial ? "스페셜" : "일반"
        } 메시지 세트를 기본값으로 복원할까요? (현재 게임: ${project})`
      )
    ) {
      return;
    }

    const base = isSpecial
      ? defaultSpecialMessages
      : defaultNormalMessages;

    const init = base.map((m) => m.weight ?? 1);

    const updatedProjectMessages =
      buildUpdatedProjectMessages(base);

    const all =
      JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    all[id] = init;
    localStorage.setItem(storageKey, JSON.stringify(all));

    setLocalMessages(base.map((m) => ({ ...m })));
    setWeights(init);
    setIsApplied(false);

    onUpdate?.(init, id, {
      project,
      messagesForThisProject: updatedProjectMessages,
    });

    alert("✅ 이 게임의 메시지와 확률이 기본값으로 복원되었습니다.");
  };

  /** 이 게임의 전체(일반+스페셜) 전부 기본값으로 */
  const resetAllCards = () => {
    if (
      !window.confirm(
        `현재 게임(${project})의 모든 메시지와 확률을 기본값으로 복원하시겠습니까?`
      )
    ) {
      return;
    }

    const updatedProjectMessages = {
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

    localStorage.setItem(storageKey, JSON.stringify(all));

    const selfInit = isSpecial
      ? defaultSpecialMessages
      : defaultNormalMessages;
    const selfWeights = selfInit.map((m) => m.weight ?? 1);

    setLocalMessages(selfInit.map((m) => ({ ...m })));
    setWeights(selfWeights);
    setIsApplied(false);

    onUpdate?.(selfWeights, id, {
      project,
      messagesForThisProject: updatedProjectMessages,
      allWeightsForThisProject: all,
    });

    alert("✅ 현재 게임의 모든 메시지와 확률이 기본값으로 복원되었습니다!");
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
            [{project}] {isSpecial ? "🌟 특별 카드" : "📇 일반 카드"}
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
              🔄 이 타입(현재 게임) 메시지만 기본값
            </button>
            <button className="reset-all-btn" onClick={resetAllCards}>
              🔄 이 게임의 전체 메시지/확률 초기화
            </button>

            <button
              className="apply-btn"
              type="button"
              onClick={applyToAllCardsOfThisType}
            >
              📦 이 게임의 같은 타입 전체 카드에 동일 적용
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