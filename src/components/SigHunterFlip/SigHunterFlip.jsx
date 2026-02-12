import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  queendomSigCards,
  museSigCards,
} from "../../data/sigData";
import { useSigStorage } from "./FlipHooks";
import { fireConfetti, weightedPick } from "../common/confettiUtils";
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

      // ✅ 일반 카드: 각 슬롯별로 병렬 요청
      const normalPromises = normalCardsArg.map(async (card) => {
        console.log(`[FLIP] 칸 ${card.id} 조회 시작:`, {
          mode,
          type: "sighunter",
          rarity: "normal",
          slotIndex: String(card.id),
        });

        const items = await fetchRandomSigItems({
          mode,
          type: "sighunter",
          rarity: "normal",
          slotIndex: String(card.id),
          count: 1,
        });

        console.log(`[FLIP] 칸 ${card.id} 결과:`, items);
        mapping[card.id] = items[0] || null;
      });

      // ✅ 스페셜 카드: 있으면 추가
      const allPromises = [...normalPromises];

      if (specialCardArg) {
        const specialPromise = (async () => {
          console.log(`[FLIP] 스페셜 칸 ${specialCardArg.id} 조회 시작`);

          const items = await fetchRandomSigItems({
            mode,
            type: "sighunter",
            rarity: "special",
            slotIndex: String(specialCardArg.id),
            count: 1,
          });

          console.log(`[FLIP] 스페셜 칸 ${specialCardArg.id} 결과:`, items);
          mapping[specialCardArg.id] = items[0] || null;
        })();

        allPromises.push(specialPromise);
      }

      // ✅ 모든 Promise 완료 대기
      await Promise.all(allPromises);

      console.log("[FLIP] loadSigItems 최종 mapping", mapping);
      setSigItemsByCard(mapping);
    } catch (e) {
      console.error("시그헌터 카드 메타데이터 로딩 실패:", e);
    } finally {
      setLoadingSigItems(false);
    }
  };

  // 🔥 보드 재로드 헬퍼 (업로드 직후 / 버튼 리셋 시 재사용)
  const reloadBoardSigItems = async () => {
    await loadSigItems(project, normalCards, specialCard);
    reshuffleFrontImages(sigCards);
  };

  useEffect(() => {
    if (!loaded) return;

    console.log("[DEBUG] normalCards IDs:", normalCards.map((c) => c.id));
    console.log("[DEBUG] specialCard ID:", specialCard?.id);

    reshuffleFrontImages(sigCards);
    loadSigItems(project, normalCards, specialCard);
  }, [project, loaded, sigCards, normalCards, specialCard]);

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
      target.closest(".upload-btn") ||
      target.closest(".admin-btn") ||
      target.closest(".edit-msg-btn")
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
  };

  const handleAdminClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "admin", id: cardId });
  };

  const handleEditClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "edit", id: cardId });
  };

  const handleUploadClick = (e, id) => {
    e.stopPropagation();
    const input = fileInputRefs.current[id];
    if (!input) return;
    input.click();
  };

  // 🔥 로컬 이미지 업로드 후 → 보드 다시 섞기
  const handleImageChange = async (e, id) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev && ev.target && ev.target.result;
      setRandomImages((p) => ({ ...p, [id]: url }));
      setFlipped((p) => ({ ...p, [id]: false }));
      setLocked((p) => ({ ...p, [id]: false }));

      // 🔥 이미지 변경 완료 후 → Firestore에서 다시 뽑기
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
     // 🔥 모든 업로드 이미지 제거
  setRandomImages({});

    resetCards(sigCards);
    reshuffleFrontImages(sigCards);

    // 🔥 Firestore 재조회
    await loadSigItems(project, normalCards, specialCard);
  };

 const resetNormal = async () => {
  console.log("🔍 [resetNormal] 시작");
  console.log("🔍 normalCards IDs:", normalCards.map(c => c.id));
  console.log("🔍 현재 randomImages:", randomImages);

  // 🔥 일반 카드 업로드 이미지 제거
  setRandomImages((prev) => {
    const next = { ...prev };
    console.log("🔍 setRandomImages 이전:", prev);
    
    normalCards.forEach((c) => {
      console.log(`🔍 삭제 시도: randomImages[${c.id}]`);
      delete next[c.id];
    });
    
    console.log("🔍 setRandomImages 이후:", next);
    return next;
  });

  resetCards(normalCards);
  reshuffleFrontImages(normalCards);

  console.log("🔍 loadSigItems 호출 직전");
  await loadSigItems(project, normalCards, specialCard);
  console.log("🔍 loadSigItems 완료");
};

  const resetSpecial = async () => {
    if (!specialCard) return;

    // 🔥 스페셜 카드 업로드 이미지 제거
  setRandomImages((prev) => {
    const next = { ...prev };
    delete next[specialCard.id];
    return next;
  });

    resetCards([specialCard]);
    reshuffleFrontImages([specialCard]);

    // 🔥 Firestore 재조회
    await loadSigItems(project, normalCards, specialCard);
  };

  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          margin: "0 auto 12px auto",
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

      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "8px",
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
          onUpdate={(weights, id, updatedMessages) => {
            const key = String(id);

            setCardWeights((prev) => {
              const updated = { ...prev, [key]: weights };
              localStorage.setItem("cardWeights", JSON.stringify(updated));
              return updated;
            });

            if (updatedMessages) {
              setMessages(updatedMessages);
            }
          }}
          // 🔥 AdminPopup에서 Firestore 업로드 완료 후 호출될 콜백
          onUploadComplete={reloadBoardSigItems}
        />
      )}
    </div>
  );
}