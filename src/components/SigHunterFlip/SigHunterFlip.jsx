import { socket } from "../../socket";
import React, { useRef, useState, useEffect } from "react";
import {
  sigCards,
  normalMessages,
  specialMessages,
} from "../../data/sigData";
import { useSigStorage } from "./FlipHooks";
import { fireConfetti, weightedPick } from "../common/confettiUtils";
import CardGrid from "./CardGrid";
import EditMessageModal from "./EditMessageModal";
import AdminPopup from "./AdminPopup";
import "./flip.css";

export default function SigHunterFlip() {
  const fileInputRefs = useRef({});
  const {
    flipped,
    locked,
    revealed,
    randomImages,
    cardWeights,
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setCardWeights,
  } = useSigStorage();

  // 🧩 Socket.IO - 운영자 변경 수신
 useEffect(() => {
  socket.on("updateWeights", ({ id, weights }) => {
    console.log("📩 수신된 변경:", id, weights);
    // 서버에서 받은 확률을 해당 cardId에 반영
    setCardWeights((prev) => ({
      ...prev,
      [id]: weights,
    }));
  });

  return () => socket.off("updateWeights");
}, [setCardWeights]);

  // 💬 일반 전설 시그 팝업 (카드 연출용)
  const [popup, setPopup] = useState(null);
  // 🧩 OBS 대응 모달 (메시지 수정 / 확률 조절)
  const [modal, setModal] = useState(null); // ex) { type: "edit"|"admin", id: number }

  /** 🧩 카드 클릭 이벤트 */
  const handleFlip = (card, e) => {
    if (
      e.target.classList.contains("upload-btn") ||
      e.target.classList.contains("admin-btn") ||
      e.target.classList.contains("edit-msg-btn")
    )
      return;
    if (locked[card.id]) return;

    const next = !flipped[card.id];
    setFlipped((p) => ({ ...p, [card.id]: next }));

    if (next) {
      const imgs = card.frontImages || [];
      const newImg = imgs[Math.floor(Math.random() * imgs.length)];
      const base = card.isSpecial ? specialMessages : normalMessages;
      // ✅ socket 통해 받은 최신 가중치 적용
      const weights = cardWeights[card.id] || base.map((m) => m.weight);
      const msg = weightedPick(base, weights);

      fireConfetti(msg.tier);

      if (["전설", "레전드"].includes(msg.tier)) {
        setPopup({
          title: "🎶 전설 시그!",
          message: msg.text,
          amount: card.amount,
        });
      }

      setRandomImages((p) => ({ ...p, [card.id]: newImg }));
      setRevealed((p) => ({ ...p, [card.id]: msg }));
      setLocked((p) => ({ ...p, [card.id]: true }));
    }
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
    fileInputRefs.current[id]?.click();
  };

  /** 🖼 이미지 파일 변경 */
  const handleImageChange = (e, id) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setRandomImages((p) => ({ ...p, [id]: url }));
      setFlipped((p) => ({ ...p, [id]: false }));
      setLocked((p) => ({ ...p, [id]: false }));
    };
    reader.readAsDataURL(file);
  };

  /** 🔄 전체 초기화 */
 const resetAll = () => {
  localStorage.clear();

  // 💫 1단계: 비활성화 상태로 전환
  setLocked({});
  setRevealed({});
  setFlipped({});

  // 💫 2단계: requestAnimationFrame으로 프레임 분산
  requestAnimationFrame(() => {
    const initImgs = {};
    sigCards.forEach((c) => {
      const imgs = c.frontImages;
      if (imgs?.length)
        initImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
    });
    setRandomImages(initImgs);
  });

  requestAnimationFrame(() => {
    const initWeights = {};
    sigCards.forEach((card) => {
      initWeights[card.id] = (
        card.isSpecial ? specialMessages : normalMessages
      ).map((m) => m.weight);
    });
    setCardWeights(initWeights);
  });

    const initWeights = {};
    sigCards.forEach((card) => {
      initWeights[card.id] = (
        card.isSpecial ? specialMessages : normalMessages
      ).map((m) => m.weight);
    });
    setCardWeights(initWeights);
  };

  const normalCards = sigCards.filter((c) => !c.isSpecial);
  const specialCard = sigCards.find((c) => c.isSpecial);

  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>
      <button className="reset-btn" onClick={resetAll}>
        🔄 전체 초기화
      </button>

      <div className="cards-wrapper">
        {/* 일반 카드 */}
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

      {/* 🎵 전설 시그 팝업 */}
      {popup && (
        <div className="popup-overlay" onClick={() => setPopup(null)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>{popup.title}</h2>
            <p>🪙 {popup.amount} 하트</p>
            <p>{popup.message}</p>
            <button onClick={() => setPopup(null)}>닫기 ✨</button>
          </div>
        </div>
      )}

      {/* OBS 대응형 내부 모달 */}
      {modal?.type === "edit" && (
        <EditMessageModal
          cardId={modal.id}
          onClose={() => setModal(null)}
          onUpdate={(newMsg) =>
            setRevealed((prev) => ({ ...prev, [modal.id]: newMsg }))
          }
        />
      )}

      {modal?.type === "admin" && modal?.id != null && (
        <AdminPopup
          cardId={modal.id}
          onClose={() => setModal(null)}
          onUpdate={(w, id)=>setCardWeights(prev=>({...prev,[id]:w}))}
        />
      )}
    </div>
  );
}