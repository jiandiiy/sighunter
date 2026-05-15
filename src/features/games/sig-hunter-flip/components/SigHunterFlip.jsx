// src/components/SigHunterFlip/SigHunterFlip.jsx
import React, { useRef, useState, useEffect, useMemo } from "react";
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
import { useSigStorage } from "../../../../shared/hooks";
import {
  fireConfetti,
  weightedPick,
} from "../../../../components/common/confettiUtils";
import { fetchRandomSigItems } from "../../../../resources/api";
import CardGrid from "./CardGrid";
import EditMessageModal from "./EditMessageModal";
import AdminPopup from "./AdminPopup";
import "../styles/flip.css";

const projectCardSets = {
  queendom: queendomSigCards,
  muse: museSigCards,
  holic: holicSigCards,
};

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

export default function SigHunterFlip() {
  const [project, setProject] = useState("queendom");

  const sigCards = projectCardSets[project] ?? queendomSigCards;

  const normalCards = useMemo(
    () => sigCards.filter((card) => !card.isSpecial),
    [sigCards]
  );

  const specialCard = useMemo(
    () => sigCards.find((card) => card.isSpecial),
    [sigCards]
  );

  const [sigItemsByCard, setSigItemsByCard] = useState({});
  const [loadingSigItems, setLoadingSigItems] = useState(false);
  const [frontImageIndexByCard, setFrontImageIndexByCard] = useState({});
  const fileInputRefs = useRef({});

  const {
    flipped,
    locked,
    revealed,
    randomImages,
    messagesByProject,
    cardWeights,
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setCardWeights,
    setMessagesByProject,
    loaded,
  } = useSigStorage();

  const currentMessages = useMemo(() => {
    const remoteMessages = messagesByProject?.[project];

    if (
      remoteMessages &&
      Array.isArray(remoteMessages.normal) &&
      Array.isArray(remoteMessages.special)
    ) {
      return remoteMessages;
    }

    return (
      DEFAULT_MESSAGES_BY_PROJECT[project] ||
      DEFAULT_MESSAGES_BY_PROJECT.queendom
    );
  }, [messagesByProject, project]);

  const [modal, setModal] = useState(null);
  const [targetCardId, setTargetCardId] = useState("");
  const [lastActiveCardId, setLastActiveCardId] = useState(1);
  const cardNumberInputRef = useRef(null);

  const reshuffleFrontImages = (cards) => {
    setFrontImageIndexByCard((prev) => {
      const next = { ...prev };

      cards.forEach((card) => {
        const len = Array.isArray(card.frontImages)
          ? card.frontImages.length
          : 0;

        if (len > 0) {
          next[card.id] = Math.floor(Math.random() * len);
        } else {
          delete next[card.id];
        }
      });

      return next;
    });
  };

  const loadSigItems = async (projectKey, normalCardsArg, specialCardArg) => {
    try {
      setLoadingSigItems(true);

      const mode = projectKey;
      const mapping = {};

      const normalPromises = normalCardsArg.map(async (card) => {
        const items = await fetchRandomSigItems({
          mode,
          type: "sighunter",
          rarity: "normal",
          slotIndex: String(card.id),
          count: 1,
        });

        mapping[card.id] = items[0] || null;
      });

      const allPromises = [...normalPromises];

      if (specialCardArg) {
        const specialPromise = (async () => {
          const items = await fetchRandomSigItems({
            mode,
            type: "sighunter",
            rarity: "special",
            slotIndex: String(specialCardArg.id),
            count: 1,
          });

          mapping[specialCardArg.id] = items[0] || null;
        })();

        allPromises.push(specialPromise);
      }

      await Promise.all(allPromises);

      setSigItemsByCard(mapping);
    } catch (error) {
      console.error("시그헌터 카드 메타데이터 로딩 실패:", error);
    } finally {
      setLoadingSigItems(false);
    }
  };

  const reloadBoardSigItems = async () => {
    await loadSigItems(project, normalCards, specialCard);
    reshuffleFrontImages(sigCards);
  };

  useEffect(() => {
    if (!loaded) return;

    reshuffleFrontImages(sigCards);
    loadSigItems(project, normalCards, specialCard);
  }, [project, loaded, sigCards, normalCards, specialCard]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" || event.code === "Escape") {
        if (modal) {
          event.preventDefault();
          setModal(null);
        }
        return;
      }

      if (event.altKey && event.shiftKey && event.code === "KeyA") {
        event.preventDefault();

        setModal((prev) => {
          if (prev && prev.type === "admin") {
            return null;
          }

          return {
            type: "admin",
            id: lastActiveCardId || 1,
          };
        });

        return;
      }

      if (event.altKey && event.shiftKey && event.code === "KeyF") {
        event.preventDefault();

        if (cardNumberInputRef.current) {
          cardNumberInputRef.current.focus();
          cardNumberInputRef.current.select?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lastActiveCardId, modal]);

  const handleFlip = (card, event) => {
    const target = event.target;

    if (target.tagName === "INPUT" && target.type === "file") {
      return;
    }

    if (
      target.closest?.(".upload-btn") ||
      target.closest?.(".admin-btn") ||
      target.closest?.(".edit-msg-btn")
    ) {
      return;
    }

    const key = String(card.id);

    const currentlyFlipped = !!flipped[key]; // 렌더 시점 값으로 읽기
  const nextFlipped = !currentlyFlipped;

  setFlipped((prev) => ({ ...prev, [key]: nextFlipped }));

  // 앞면 → 뒷면으로 넘어갈 때만 메시지 처리
  if (nextFlipped && !(revealed[card.id]?.edited)) {
    const base = card.isSpecial
      ? currentMessages.special
      : currentMessages.normal;

    const stored = cardWeights?.[key];
    const weights =
      Array.isArray(stored) && stored.length === base.length
        ? stored
        : base.map((m) => m.weight ?? 1);

    const msg = weightedPick(base, weights);
    fireConfetti(msg.text);

    setRevealed((prev) => ({ ...prev, [card.id]: msg }));
  }

  setLastActiveCardId(card.id);
};

  const handleAdminClick = (event, cardId) => {
    event.stopPropagation();
    event.preventDefault();

    setModal({
      type: "admin",
      id: cardId,
    });

    setLastActiveCardId(cardId);
  };

  const handleEditClick = (event, cardId) => {
    event.stopPropagation();
    event.preventDefault();

    setModal({
      type: "edit",
      id: cardId,
    });

    setLastActiveCardId(cardId);
  };

  const handleUploadClick = (event, id) => {
    event.stopPropagation();

    const input = fileInputRefs.current[id];
    if (!input) return;

    input.click();
    setLastActiveCardId(id);
  };

  const handleImageChange = async (event, id) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (readerEvent) => {
      const url = readerEvent?.target?.result;

      setRandomImages((prev) => ({
        ...prev,
        [id]: url,
      }));

      setFlipped((prev) => ({
        ...prev,
        [id]: false,
      }));

      setLocked((prev) => ({
        ...prev,
        [id]: false,
      }));

      await reloadBoardSigItems();
    };

    reader.readAsDataURL(file);
  };

  const resetCards = (cards) => {
    setRandomImages((prevImgs) => {
      const nextImgs = { ...prevImgs };

      cards.forEach((card) => {
        delete nextImgs[card.id];
      });

      return nextImgs;
    });

    setRevealed((prev) => {
      const next = { ...prev };

      cards.forEach((card) => {
        delete next[card.id];
      });

      return next;
    });

    setFlipped((prev) => {
      const next = { ...prev };

      cards.forEach((card) => {
        delete next[card.id];
      });

      return next;
    });

    setLocked((prev) => {
      const next = { ...prev };

      cards.forEach((card) => {
        delete next[card.id];
      });

      return next;
    });

    setCardWeights((prev) => {
      const next = { ...prev };

      cards.forEach((card) => {
        const key = String(card.id);
        const base = card.isSpecial
          ? currentMessages.special
          : currentMessages.normal;

        next[key] = base.map((message) => message.weight ?? 1);
      });

      localStorage.setItem("cardWeights", JSON.stringify(next));

      return next;
    });
  };

  const resetAll = async () => {
    [
      "sigFlipped",
      "sigLocked",
      "sigRevealed",
      "sigImages",
      "cardWeights",
    ].forEach((key) => localStorage.removeItem(key));

    setRandomImages({});

    resetCards(sigCards);
    reshuffleFrontImages(sigCards);

    await loadSigItems(project, normalCards, specialCard);
  };

  const resetNormal = async () => {
    setRandomImages((prev) => {
      const next = { ...prev };

      normalCards.forEach((card) => {
        delete next[card.id];
      });

      return next;
    });

    resetCards(normalCards);
    reshuffleFrontImages(normalCards);

    await loadSigItems(project, normalCards, specialCard);
  };

  const resetSpecial = async () => {
    if (!specialCard) return;

    setRandomImages((prev) => {
      const next = { ...prev };
      delete next[specialCard.id];
      return next;
    });

    resetCards([specialCard]);
    reshuffleFrontImages([specialCard]);

    await loadSigItems(project, normalCards, specialCard);
  };

  const flipCardById = (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;

    const card =
      normalCards.find((item) => item.id === numId) ||
      (specialCard && specialCard.id === numId ? specialCard : null);

    if (!card) return;

    const fakeEvent = {
      target: {
        tagName: "DIV",
      },
    };

    handleFlip(card, fakeEvent);
  };

  const handleChangeProject = (nextProject) => {
    if (project === nextProject) return;

    resetCards(sigCards);
    setProject(nextProject);
    setTargetCardId("");
    setModal(null);
  };

  if (!loaded) {
    return (
      <div className="natural-container">
        <h2>💖 시그헌터 💖</h2>
        <p>상태 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          margin: "0 auto 12px auto",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          {["queendom", "muse", "holic"].map((key) => {
            const labelMap = {
              queendom: "퀸덤",
              muse: "뮤즈",
              holic: "홀릭",
            };

            const isActive = project === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleChangeProject(key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: isActive ? "2px solid #ffe4f0" : "1px solid #888",
                  background: isActive
                    ? "linear-gradient(135deg, #ff7eb3, #ffb6c1)"
                    : "linear-gradient(135deg, #444, #222)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "14px",
                  minWidth: "70px",
                  fontFamily: "Cafe24ClassicType",
                  fontWeight: 600,
                  boxShadow: isActive
                    ? "0 0 8px rgba(255, 126, 179, 0.7)"
                    : "0 0 4px rgba(0, 0, 0, 0.4)",
                  transition: "all 0.15s ease-in-out",
                }}
              >
                {labelMap[key]}
              </button>
            );
          })}
        </div>

        <span
          style={{
            fontSize: 16,
            color: "#4b5563",
            lineHeight: 1.4,
            textAlign: "left",
          }}
        >
          *Alt+Shift+A → 확률조절
          <br />
          *Alt+Shift+F → 칸 번호
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "8px",
          alignItems: "center",
        }}
      >
        <button className="reset-btn" onClick={resetAll}>
          🔄 전체 초기화
        </button>

        <button className="reset-btn" onClick={resetNormal}>
          🔄 일반 카드만 초기화
        </button>

        {specialCard && (
          <button className="reset-btn" onClick={resetSpecial}>
            🔄 스페셜 카드만 초기화
          </button>
        )}

        <div
          className="card-number-wrapper"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <span
            className="card-number-label"
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "14px",
              background: "white",
              padding: "0 4px",
              borderRadius: "4px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            칸 번호
          </span>

          <input
            type="number"
            min="1"
            max={sigCards.length}
            value={targetCardId}
            onChange={(event) => setTargetCardId(event.target.value)}
            placeholder="칸 번호"
            className="card-number-input"
            ref={cardNumberInputRef}
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%) translateY(-6px)",
              width: "90px",
              padding: "6px 1px",
              borderRadius: "6px",
              border: "1px solid #aaa",
              fontSize: "20px",
              textAlign: "center",
              background: "#fff",
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                flipCardById(targetCardId);
              }
            }}
          />

          <button
            type="button"
            className="reset-btn"
            onClick={() => flipCardById(targetCardId)}
            style={{ whiteSpace: "nowrap" }}
          >
            🎴 뒤집기
          </button>
        </div>
      </div>

      {loadingSigItems && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#ddd" }}>
          시그 카드 정보를 불러오는 중입니다...
        </p>
      )}

      <div className="cards-wrapper">
        <CardGrid
          cards={normalCards}
          flipped={flipped}
          locked={locked}
          revealed={revealed}
          randomImages={randomImages}
          sigItemsByCard={sigItemsByCard}
          frontImageIndexByCard={frontImageIndexByCard}
          onFlip={handleFlip}
          onAdmin={handleAdminClick}
          onEdit={handleEditClick}
          onUploadClick={handleUploadClick}
          onImageChange={handleImageChange}
          fileInputRefs={fileInputRefs}
        />

        {specialCard && (
          <div className="special-card-container">
            <CardGrid
              cards={[specialCard]}
              flipped={flipped}
              locked={locked}
              revealed={revealed}
              randomImages={randomImages}
              sigItemsByCard={sigItemsByCard}
              frontImageIndexByCard={frontImageIndexByCard}
              onFlip={handleFlip}
              onAdmin={handleAdminClick}
              onEdit={handleEditClick}
              onUploadClick={handleUploadClick}
              onImageChange={handleImageChange}
              fileInputRefs={fileInputRefs}
            />
          </div>
        )}
      </div>

      {modal && modal.type === "edit" && (
        <EditMessageModal
          project={project}
          cardId={modal.id}
          initialMsg={revealed[modal.id]}
          onClose={() => setModal(null)}
          onUpdate={(newMsg) => {
            setRevealed((prev) => ({
              ...prev,
              [modal.id]: newMsg,
            }));

            setLocked((prev) => ({
              ...prev,
              [modal.id]: false,
            }));
          }}
        />
      )}

      {modal && modal.type === "admin" && modal.id != null && (
        <AdminPopup
          project={project}
          cardId={modal.id}
          messages={messagesByProject}
          onClose={() => setModal(null)}
          onUpdate={(weights, id, payload, allWeightsFromPopup) => {
            const key = String(id);

            const {
              project: projectKey,
              messagesForThisProject,
              allWeightsForThisProject,
            } = payload || {};

            setCardWeights((prev) => {
              const next =
                allWeightsForThisProject ??
                allWeightsFromPopup ??
                {
                  ...prev,
                  [key]: weights,
                };

              localStorage.setItem("cardWeights", JSON.stringify(next));

              return next;
            });

            if (projectKey && messagesForThisProject) {
              setMessagesByProject((prev) => ({
                ...prev,
                [projectKey]: messagesForThisProject,
              }));
            }
          }}
        />
      )}
    </div>
  );
}