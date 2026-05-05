// src/features/games/sig-hunter-flip/components/AdminPopup.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  queendomSigCards,
  museSigCards,
  holicSigCards,
  queendomNormalMessages,
  queendomSpecialMessages,
  museNormalMessages,
  museSpecialMessages,
  holicNormalMessages,
  holicSpecialMessages,
} from "../../../../shared/data";
import "../styles/adminPopup.css";

const DEFAULT_MESSAGES_BY_PROJECT = {
  queendom: {
    normal: queendomNormalMessages,
    special: queendomSpecialMessages,
  },
  muse: {
    normal: museNormalMessages,
    special: museSpecialMessages,
  },
  holic: {
    normal: holicNormalMessages,
    special: holicSpecialMessages,
  },
};

const PROJECT_CONFIG = {
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

export default function AdminPopup({
  project, // "queendom" | "muse" | "holic"
  cardId,
  // messages: { queendom?: { normal, special }, muse?: {...}, holic?: {...} }
  messages,
  onClose,
  // onUpdate(weightsForThisCard, cardId, { project, messagesForThisProject }, allWeightsForAllCards?)
  onUpdate,
}) {
  const id = String(cardId);
  const numId = Number(cardId);

  const safeProject = DEFAULT_MESSAGES_BY_PROJECT[project]
    ? project
    : "queendom";

  const { sigCards, storageKey } =
    PROJECT_CONFIG[safeProject] ?? PROJECT_CONFIG.queendom;

  const card = sigCards.find((c) => Number(c.id) === numId);
  const isSpecial = !!card?.isSpecial;

  const [weights, setWeights] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);
  const [, setIsApplied] = useState(false);
  const modalRef = useRef(null);

  /**
   * 현재 프로젝트의 기본 메시지
   */
  const defaultMessagesForProject = useMemo(() => {
    return (
      DEFAULT_MESSAGES_BY_PROJECT[safeProject] ||
      DEFAULT_MESSAGES_BY_PROJECT.queendom
    );
  }, [safeProject]);

  /**
   * 실제 사용할 메시지
   * 우선순위:
   * 1. Firestore/상위 상태 messages[safeProject]
   * 2. 프로젝트별 기본 메시지
   */
  const baseAllMessages = useMemo(() => {
    const projectMessages = messages?.[safeProject];

    if (
      projectMessages &&
      Array.isArray(projectMessages.normal) &&
      Array.isArray(projectMessages.special)
    ) {
      return projectMessages;
    }

    return defaultMessagesForProject;
  }, [messages, safeProject, defaultMessagesForProject]);

  /**
   * 현재 카드 타입에 맞는 메시지 배열
   */
  const currentBaseMessages = useMemo(() => {
    return isSpecial ? baseAllMessages.special : baseAllMessages.normal;
  }, [isSpecial, baseAllMessages]);

  /**
   * 카드 데이터 로드
   */
  useEffect(() => {
    if (!card) return;

    const base = currentBaseMessages;

    const savedAll = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    let initial = savedAll[id];

    // 길이가 안 맞으면 현재 메시지 기본 weight로 초기화
    if (!initial || initial.length !== base.length) {
      initial = base.map((message) => message.weight ?? 1);
      savedAll[id] = initial;
      localStorage.setItem(storageKey, JSON.stringify(savedAll));
    }

    setWeights(initial);
    setLocalMessages(base.map((message) => ({ ...message })));
    setIsApplied(false);
  }, [id, card, currentBaseMessages, storageKey]);

  /**
   * 스크롤 진행 효과
   */
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

    return () => {
      modal.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /**
   * 가중치 업데이트
   */
  const updateWeight = (index, value, event) => {
    const numValue = parseInt(value, 10);
    const safeValue = Number.isFinite(numValue) ? Math.max(0, numValue) : 0;

    setIsApplied(false);

    setWeights((prev) => {
      const updated = [...prev];
      updated[index] = safeValue;

      if (event?.target) {
        event.target.style.setProperty("--range-progress", `${safeValue}%`);
      }

      return updated;
    });
  };

  /**
   * 메시지 텍스트 수정
   */
  const updateMessageText = (index, text) => {
    setIsApplied(false);

    setLocalMessages((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        text,
      };
      return next;
    });
  };

  /**
   * 항목 추가
   */
  const addMessageRow = () => {
    setIsApplied(false);

    setLocalMessages((prev) => [
      ...prev,
      {
        text: "",
        color: "#ffffff",
        bgColor: "#1f2937",
        weight: 1,
      },
    ]);

    setWeights((prev) => [...prev, 1]);
  };

  /**
   * 항목 삭제
   */
  const removeMessageRow = (index) => {
    setIsApplied(false);
    setLocalMessages((prev) => prev.filter((_, i) => i !== index));
    setWeights((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * 현재 카드 타입만 교체한 프로젝트 메시지 세트 생성
   */
  const buildUpdatedProjectMessages = (mergedMessages) => {
    return {
      normal: isSpecial ? baseAllMessages.normal : mergedMessages,
      special: isSpecial ? mergedMessages : baseAllMessages.special,
    };
  };

  /**
   * 이 카드에만 적용
   */
  const applyWeights = () => {
    if (!card) return;

    const mergedMessages = localMessages.map((message, index) => ({
      ...message,
      weight: weights[index] ?? 0,
    }));

    const updatedProjectMessages =
      buildUpdatedProjectMessages(mergedMessages);

    const all = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    all[id] = mergedMessages.map((message) => message.weight ?? 0);

    localStorage.setItem(storageKey, JSON.stringify(all));

    onUpdate?.(all[id], id, {
      project: safeProject,
      messagesForThisProject: updatedProjectMessages,
    });

    setIsApplied(true);
  };

  /**
   * 현재 타입 메시지/확률을 같은 타입 전체 카드에 복사
   */
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

    const mergedMessages = localMessages.map((message, index) => ({
      ...message,
      weight: weights[index] ?? 0,
    }));

    const updatedProjectMessages =
      buildUpdatedProjectMessages(mergedMessages);

    const allWeights =
      JSON.parse(localStorage.getItem(storageKey) || "{}") || {};

    sigCards.forEach((sigCard) => {
      if (!!sigCard.isSpecial === isSpecial) {
        const key = String(sigCard.id);
        allWeights[key] = mergedMessages.map((message) => message.weight ?? 0);
      }
    });

    localStorage.setItem(storageKey, JSON.stringify(allWeights));

    onUpdate?.(allWeights[id], id, {
      project: safeProject,
      messagesForThisProject: updatedProjectMessages,
      allWeightsForThisProject: allWeights,
    });

    setIsApplied(true);
  };

  /**
   * 현재 카드 타입 메시지만 프로젝트 기본값으로 복원
   */
  const resetSingleCard = () => {
    if (!card) return;

    if (
      !window.confirm(
        `이 카드가 사용하는 ${
          isSpecial ? "스페셜" : "일반"
        } 메시지 세트를 기본값으로 복원할까요? (현재 게임: ${safeProject})`
      )
    ) {
      return;
    }

    const base = isSpecial
      ? defaultMessagesForProject.special
      : defaultMessagesForProject.normal;

    const init = base.map((message) => message.weight ?? 1);

    const updatedProjectMessages = {
      normal: isSpecial ? baseAllMessages.normal : base,
      special: isSpecial ? base : baseAllMessages.special,
    };

    const all = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    all[id] = init;

    localStorage.setItem(storageKey, JSON.stringify(all));

    setLocalMessages(base.map((message) => ({ ...message })));
    setWeights(init);
    setIsApplied(false);

    onUpdate?.(init, id, {
      project: safeProject,
      messagesForThisProject: updatedProjectMessages,
    });

    alert("✅ 이 게임의 메시지와 확률이 기본값으로 복원되었습니다.");
  };

  /**
   * 현재 게임 전체 메시지/확률 기본값으로 복원
   */
  const resetAllCards = () => {
    if (
      !window.confirm(
        `현재 게임(${safeProject})의 모든 메시지와 확률을 기본값으로 복원하시겠습니까?`
      )
    ) {
      return;
    }

    const updatedProjectMessages = {
      normal: defaultMessagesForProject.normal,
      special: defaultMessagesForProject.special,
    };

    const normalWeights = defaultMessagesForProject.normal.map(
      (message) => message.weight ?? 1
    );
    const specialWeights = defaultMessagesForProject.special.map(
      (message) => message.weight ?? 1
    );

    const all = {};

    sigCards.forEach((sigCard) => {
      const key = String(sigCard.id);
      all[key] = sigCard.isSpecial ? specialWeights : normalWeights;
    });

    localStorage.setItem(storageKey, JSON.stringify(all));

    const selfInit = isSpecial
      ? defaultMessagesForProject.special
      : defaultMessagesForProject.normal;

    const selfWeights = selfInit.map((message) => message.weight ?? 1);

    setLocalMessages(selfInit.map((message) => ({ ...message })));
    setWeights(selfWeights);
    setIsApplied(false);

    onUpdate?.(selfWeights, id, {
      project: safeProject,
      messagesForThisProject: updatedProjectMessages,
      allWeightsForThisProject: all,
    });

    alert("✅ 현재 게임의 모든 메시지와 확률이 기본값으로 복원되었습니다!");
  };

  if (!card || Number.isNaN(numId)) {
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
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-container">
          <h2>🎰 {id}번 카드 메시지 / 확률 조절</h2>

          <p className="card-type">
            [{safeProject}] {isSpecial ? "🌟 특별 카드" : "📇 일반 카드"}
          </p>

          <div className="prob-list">
            {localMessages.map((message, index) => {
              const total = weights.reduce((sum, value) => sum + value, 0) || 1;
              const percent = (((weights[index] || 0) / total) * 100).toFixed(
                1
              );

              return (
                <div className="prob-control" key={index}>
                  <div className="prob-header">
                    <input
                      type="text"
                      className="msg-text-input"
                      value={message.text || ""}
                      onChange={(event) =>
                        updateMessageText(index, event.target.value)
                      }
                      placeholder="메시지 내용"
                    />

                    <span className="prob-percent">({percent}%)</span>

                    <button
                      type="button"
                      className="remove-row-btn"
                      onClick={() => removeMessageRow(index)}
                    >
                      ✖
                    </button>
                  </div>

                  <div className="prob-inputs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weights[index] || 0}
                      onChange={(event) =>
                        updateWeight(index, event.target.value, event)
                      }
                      className="range-input"
                      style={{
                        "--range-progress": `${weights[index] || 0}%`,
                      }}
                    />

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weights[index] || 0}
                      onChange={(event) =>
                        updateWeight(index, event.target.value)
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