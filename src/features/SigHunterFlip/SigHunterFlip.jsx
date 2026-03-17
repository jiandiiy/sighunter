// src/components/SigHunterFlip/SigHunterFlip.jsx
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  queendomSigCards,
  museSigCards,
} from "../../data/sigData";
import { useSigStorage } from "../../hooks/useSigStorage";
import { fireConfetti, weightedPick } from "../../../src/components/common/confettiUtils";
import { fetchRandomSigItems } from "../../api/sigHunterImageLibraryApi";
import CardGrid from "./CardGrid";
import EditMessageModal from "./EditMessageModal";
import AdminPopup from "./AdminPopup";
import "./flip.css";

const projectCardSets = {
  queendom: queendomSigCards,
  muse: museSigCards,
};

export default function SigHunterFlip() {
  const [project, setProject] = useState("queendom");
  const sigCards = projectCardSets[project];

  const normalCards = useMemo(
    () => sigCards.filter((c) => !c.isSpecial),
    [sigCards]
  );
  const specialCard = useMemo(
    () => sigCards.find((c) => c.isSpecial),
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
    messages,
    cardWeights,
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setCardWeights,
    setMessages,
    loaded,
  } = useSigStorage();

  const [modal, setModal] = useState(null);

  // 🔢 번호로 칸 지정해서 뒤집기용 입력 상태
  const [targetCardId, setTargetCardId] = useState("");

  // 🔧 단축키용: 마지막으로 액션한 카드 ID 기억
  const [lastActiveCardId, setLastActiveCardId] = useState(1);

  // ⌨️ 칸 번호 input에 포커스 주기 위한 ref
  const cardNumberInputRef = useRef(null);

  const reshuffleFrontImages = (cards) => {
    setFrontImageIndexByCard((prev) => {
      const next = { ...prev };
      cards.forEach((card) => {
        const len = Array.isArray(card.frontImages)
          ? card.frontImages.length
          : 0;
        if (len > 0) {
          const idx = Math.floor(Math.random() * len);
          next[card.id] = idx;
        } else {
          delete next[card.id];
        }
      });
      return next;
    });
  };

  // 슬롯별 랜덤 시그 이미지 로딩
  const loadSigItems = async (projectKey, normalCardsArg, specialCardArg) => {
    try {
      setLoadingSigItems(true);

      const mode = projectKey;
      const mapping = {};

      // 일반 카드: 각 슬롯별로 병렬 요청
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

      // 스페셜 카드
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
    } catch (e) {
      console.error("시그헌터 카드 메타데이터 로딩 실패:", e);
    } finally {
      setLoadingSigItems(false);
    }
  };

  // 보드 재로드 헬퍼 (업로드 직후 / 버튼 리셋 시 재사용)
  const reloadBoardSigItems = async () => {
    await loadSigItems(project, normalCards, specialCard);
    reshuffleFrontImages(sigCards);
  };

  // 🔁 초기 로딩 / 프로젝트 변경 시 카드 이미지·메타 로딩
  useEffect(() => {
    if (!loaded) return;

    reshuffleFrontImages(sigCards);
    loadSigItems(project, normalCards, specialCard);
  }, [project, loaded, sigCards, normalCards, specialCard]);

  // 🔑 전역 단축키
  // - Alt+Shift+A : 마지막 카드 기준 AdminPopup 열기/닫기
  // - Alt+Shift+F : 칸 번호 입력창에 포커스(+선택)
  // - Esc         : 열려 있는 모달(어드민/에디트) 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Esc로 모달 닫기
      if (e.key === "Escape" || e.code === "Escape") {
        if (modal) {
          e.preventDefault();
          setModal(null);
        }
        return;
      }

      // AdminPopup 토글
      if (e.altKey && e.shiftKey && e.code === "KeyA") {
        e.preventDefault();

        setModal((prev) => {
          if (prev && prev.type === "admin") {
            return null;
          }
          return { type: "admin", id: lastActiveCardId || 1 };
        });
        return;
      }

      // 칸 번호 입력창 포커스
      if (e.altKey && e.shiftKey && e.code === "KeyF") {
        e.preventDefault();
        if (cardNumberInputRef.current) {
          cardNumberInputRef.current.focus();
          cardNumberInputRef.current.select?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lastActiveCardId, modal]);

  if (!loaded) {
    return (
      <div className="natural-container">
        <h2>💖 시그헌터 💖</h2>
        <p>상태 불러오는 중...</p>
      </div>
    );
  }

  const handleFlip = (card, e) => {
    const target = e.target;

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
    const currentlyFlipped = !!flipped[card.id];
    const next = !currentlyFlipped;

    const currentMsg = revealed[card.id];

    if (!currentlyFlipped && next && !(currentMsg && currentMsg.edited)) {
      const base = card.isSpecial ? messages.special : messages.normal;

      const all = cardWeights || {};
      const stored = all[key];
      const weights =
        Array.isArray(stored) && stored.length === base.length
          ? stored
          : base.map((m) => m.weight ?? 1);

      const msg = weightedPick(base, weights);

      fireConfetti(msg.text);

      setRevealed((p) => ({ ...p, [card.id]: msg }));
    }

    setFlipped((prev) => ({ ...prev, [card.id]: next }));
    setLastActiveCardId(card.id);
  };

  const handleAdminClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "admin", id: cardId });
    setLastActiveCardId(cardId);
  };

  const handleEditClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "edit", id: cardId });
    setLastActiveCardId(cardId);
  };

  const handleUploadClick = (e, id) => {
    e.stopPropagation();
    const input = fileInputRefs.current[id];
    if (!input) return;
    input.click();
    setLastActiveCardId(id);
  };

  // 로컬 이미지 업로드 후 → 보드 다시 섞기
  const handleImageChange = async (e, id) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev && ev.target && ev.target.result;
      setRandomImages((p) => ({ ...p, [id]: url }));
      setFlipped((p) => ({ ...p, [id]: false }));
      setLocked((p) => ({ ...p, [id]: false }));

      await reloadBoardSigItems();
    };
    reader.readAsDataURL(file);
  };

  const resetCards = (cards) => {
    setRandomImages((prevImgs) => {
      const nextImgs = { ...prevImgs };
      cards.forEach((c) => {
        delete nextImgs[c.id];
      });
      return nextImgs;
    });

    setRevealed((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    setFlipped((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    setLocked((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    setCardWeights((prev) => {
      const next = { ...prev };
      cards.forEach((card) => {
        const key = String(card.id);
        const base = card.isSpecial ? messages.special : messages.normal;
        next[key] = base.map((m) => m.weight ?? 1);
      });
      localStorage.setItem("cardWeights", JSON.stringify(next));
      return next;
    });
  };

  const resetAll = async () => {
    ["sigFlipped", "sigLocked", "sigRevealed", "sigImages", "cardWeights"].forEach(
      (key) => localStorage.removeItem(key)
    );

    setRandomImages({});

    resetCards(sigCards);
    reshuffleFrontImages(sigCards);

    await loadSigItems(project, normalCards, specialCard);
  };

  const resetNormal = async () => {
    setRandomImages((prev) => {
      const next = { ...prev };
      normalCards.forEach((c) => {
        delete next[c.id];
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

  // 🔹 번호로 카드 찾아서 뒤집기
  const flipCardById = (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;

    const card =
      normalCards.find((c) => c.id === numId) ||
      (specialCard && specialCard.id === numId ? specialCard : null);

    if (!card) return;

    const fakeEvent = {
      target: { tagName: "DIV" },
    };

    handleFlip(card, fakeEvent);
  };

  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>

      {/* 프로젝트 탭 + 단축키 안내 */}
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
        {/* 탭 버튼들 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          {["queendom", "muse"].map((key) => {
            const label = key === "queendom" ? "퀸덤" : "뮤즈";
            const isActive = project === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setProject(key);
                  resetCards(sigCards);
                }}
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
                {label}
              </button>
            );
          })}
        </div>

        {/* 🔹 단축키 안내 문구 */}
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
          *Alt+Shift+F → 칸번호
        </span>
      </div>

      {/* 🔄 초기화 + 뒤집기 줄 */}
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

        {/* 🔢 입력창은 위에, 뒤집기 버튼은 옆 버튼들과 같은 라인에 */}
        <div
          className="card-number-wrapper"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {/* hover 시 위로 올라갈 라벨 */}
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

          {/* 입력창: 절대 위치로 위에 띄우기 */}
          <input
            type="number"
            min="1"
            max={sigCards.length}
            value={targetCardId}
            onChange={(e) => setTargetCardId(e.target.value)}
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                flipCardById(targetCardId);
              }
            }}
          />

          {/* 이 버튼이 라인의 기준점이 됨 → 다른 초기화 버튼과 수평 정렬 */}
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
            setRevealed((prev) => ({ ...prev, [modal.id]: newMsg }));
            setLocked((prev) => ({ ...prev, [modal.id]: false }));
          }}
        />
      )}

      {modal && modal.type === "admin" && modal.id != null && (
        <AdminPopup
          project={project}
          cardId={modal.id}
          messages={messages}
          onClose={() => setModal(null)}
          onUpdate={(
            weights,
            id,
            updatedMessages,
            allWeightsFromPopup
          ) => {
            const key = String(id);

            setCardWeights((prev) => {
              const next =
                allWeightsFromPopup ?? { ...prev, [key]: weights };
              localStorage.setItem("cardWeights", JSON.stringify(next));
              return next;
            });

            if (updatedMessages) {
              setMessages(updatedMessages);
            }
          }}
        />
      )}
    </div>
  );
}