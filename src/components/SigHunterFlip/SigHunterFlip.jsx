// src/components/SigHunterFlip/SigHunterFlip.jsx
import React, { useRef, useState } from "react";
import {
  queendomSigCards,
  museSigCards,
} from "../../data/sigData";
import { useSigStorage } from "../../hooks/useSigStorage";
import { fireConfetti, weightedPick } from "../common/confettiUtils";
import CardGrid from "./CardGrid";
import EditMessageModal from "./EditMessageModal";
import AdminPopup from "./AdminPopup";
import "./flip.css";

export default function SigHunterFlip() {
  // 🔹 프로젝트 선택 (퀸덤 / 뮤즈)
  const [project, setProject] = useState("queendom");

  // 🔹 프로젝트별 카드 세트 매핑
  const projectCardSets = {
    queendom: queendomSigCards,
    muse: museSigCards,
  };

  // 🔹 현재 선택된 프로젝트의 카드 세트
  const sigCards = projectCardSets[project];

  // 🔹 file input refs
  const fileInputRefs = useRef({});

  const {
    flipped,
    locked,
    revealed,
    randomImages,
    messages,          // 🔹 Firestore에서 온 메시지 세트
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setCardWeights,
    setMessages,       // 🔹 메시지 세트 갱신
    loaded,
  } = useSigStorage();

  const [modal, setModal] = useState(null);

  if (!loaded) {
    return (
      <div className="natural-container">
        <h2>💖 시그헌터 💖</h2>
        <p>상태 불러오는 중...</p>
      </div>
    );
  }

  /** 🃏 카드 클릭 이벤트 */
  const handleFlip = (card, e) => {
    const target = e.target;

    // 0️⃣ file input에서 올라온 클릭이면 무시
    if (target.tagName === "INPUT" && target.type === "file") {
      return;
    }

    // 1️⃣ 버튼 클릭이면 flip 완전히 무시
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

    // 처음 뒤집는 시점 && 이미 편집된 메시지가 아니면
    if (!currentlyFlipped && next && !(currentMsg && currentMsg.edited)) {
      const imgs = card.frontImages || [];
      const newImg = imgs[Math.floor(Math.random() * imgs.length)];

      // 🔹 Firestore에서 온 메시지 세트 사용
      const base = card.isSpecial ? messages.special : messages.normal;

      const all =
        JSON.parse(localStorage.getItem("cardWeights") || "{}") || {};
      const stored = all[key];
      const weights =
        Array.isArray(stored) && stored.length === base.length
          ? stored
          : base.map((m) => m.weight ?? 1);

      const msg = weightedPick(base, weights);

      fireConfetti(msg.text);

      setRandomImages((p) => ({ ...p, [card.id]: newImg }));
      setRevealed((p) => ({ ...p, [card.id]: msg }));
    }

    setFlipped((prev) => ({ ...prev, [card.id]: next }));
  };

  /** ⚙️ 어드민 확률 조절 모달 */
  const handleAdminClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "admin", id: cardId });
  };

  /** ✏️ 메시지 수정 모달 */
  const handleEditClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "edit", id: cardId });
  };

  /** 🖼 이미지 업로드 버튼 */
  const handleUploadClick = (e, id) => {
    e.stopPropagation();

    const input = fileInputRefs.current[id];
    if (!input) return;
    input.click();
  };

  /** 🖼 이미지 파일 변경 */
  const handleImageChange = (e, id) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev && ev.target && ev.target.result;
      setRandomImages((p) => ({ ...p, [id]: url }));
      setFlipped((p) => ({ ...p, [id]: false }));
      setLocked((p) => ({ ...p, [id]: false }));
    };
    reader.readAsDataURL(file);
  };

  /** 🔹 일반 / 스페셜 등 특정 카드 배열만 초기화하는 유틸 */
  const resetCards = (cards) => {
    // 이미지 초기화
    setRandomImages((prevImgs) => {
      const nextImgs = { ...prevImgs };
      cards.forEach((c) => {
        const imgs = c.frontImages;
        if (imgs && imgs.length) {
          nextImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
        } else {
          delete nextImgs[c.id];
        }
      });
      return nextImgs;
    });

    // 메시지 초기화
    setRevealed((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    // 뒤집힘 상태 초기화
    setFlipped((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    // 잠금 상태 초기화
    setLocked((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    // 가중치 초기화 + localStorage 싱크
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

  /** 🔄 전체 초기화 (현재 프로젝트 기준, 일반+스페셜 전부) */
  const resetAll = () => {
    localStorage.clear();

    setLocked({});
    setRevealed({});
    setFlipped({});

    // 현재 선택된 프로젝트의 카드 세트 기준으로 이미지 초기화
    const initImgs = {};
    sigCards.forEach((c) => {
      const imgs = c.frontImages;
      if (imgs && imgs.length) {
        initImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
      }
    });
    setRandomImages(initImgs);

    // 가중치 초기화
    const initWeights = {};
    sigCards.forEach((card) => {
      const key = String(card.id);
      const base = card.isSpecial ? messages.special : messages.normal;
      initWeights[key] = base.map((m) => m.weight ?? 1);
    });
    setCardWeights(initWeights);
    localStorage.setItem("cardWeights", JSON.stringify(initWeights));
  };

  // 🔹 일반 / 스페셜 카드 구분
  const normalCards = sigCards.filter((c) => !c.isSpecial);
  const specialCard = sigCards.find((c) => c.isSpecial);

  /** 🔄 일반 카드만 초기화 */
  const resetNormal = () => {
    resetCards(normalCards);
  };

  /** 🔄 스페셜 카드만 초기화 */
  const resetSpecial = () => {
    if (!specialCard) return;
    resetCards([specialCard]);
  };

  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>

      {/* 🔹 퀸덤 / 뮤즈 선택 버튼 그룹 */}
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
                const nextProject = key;
                const nextSigCards = projectCardSets[nextProject] || queendomSigCards;

                // 프로젝트 바뀔 때 이미지/상태 초기화
                const initImgs = {};
                nextSigCards.forEach((c) => {
                  const imgs = c.frontImages;
                  if (imgs && imgs.length) {
                    initImgs[c.id] =
                      imgs[Math.floor(Math.random() * imgs.length)];
                  }
                });
                setRandomImages(initImgs);

                const initWeights = {};
                nextSigCards.forEach((card) => {
                  const keyStr = String(card.id);
                  const base = card.isSpecial ? messages.special : messages.normal;
                  initWeights[keyStr] = base.map((m) => m.weight ?? 1);
                });
                setCardWeights(initWeights);
                localStorage.setItem(
                  "cardWeights",
                  JSON.stringify(initWeights)
                );

                setFlipped({});
                setLocked({});
                setRevealed({});

                setProject(nextProject);
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

      {/* 🔄 초기화 버튼들 */}
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

      <div className="cards-wrapper">
        {/* 일반 카드 10장 */}
        <CardGrid
          cards={normalCards}
          flipped={flipped}
          locked={locked}
          revealed={revealed}
          randomImages={randomImages}
          onFlip={handleFlip}
          onAdmin={handleAdminClick}
          onEdit={handleEditClick}
          onUploadClick={handleUploadClick}
          onImageChange={handleImageChange}
          fileInputRefs={fileInputRefs}
        />

        {/* 특별 카드 한 장 */}
        {specialCard && (
          <div className="special-card-container">
            <CardGrid
              cards={[specialCard]}
              flipped={flipped}
              locked={locked}
              revealed={revealed}
              randomImages={randomImages}
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

      {/* ✏️ 메시지 수정 모달 */}
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

      {/* ⚙️ 확률 / 메시지 조절 모달 */}
      {modal && modal.type === "admin" && modal.id != null && (
        <AdminPopup
          project={project}
          cardId={modal.id}
          messages={messages}
          onClose={() => setModal(null)}
          onUpdate={(weights, id, updatedMessages) => {
            const key = String(id);

            // 1) 가중치 갱신
            setCardWeights((prev) => {
              const updated = { ...prev, [key]: weights };
              localStorage.setItem("cardWeights", JSON.stringify(updated));
              return updated;
            });

            // 2) 메시지 세트 갱신 (전체 normal/special)
            if (updatedMessages) {
              setMessages(updatedMessages);
            }
          }}
        />
      )}
    </div>
  );
}