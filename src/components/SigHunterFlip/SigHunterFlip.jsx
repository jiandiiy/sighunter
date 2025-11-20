import React, { useRef, useState } from "react";
import {
  queendomSigCards,
  museSigCards,
  normalMessages,
  specialMessages,
} from "../../data/sigData";
import { useSigStorage } from "../../hooks/useSigStorage";
import { fireConfetti, weightedPick } from "../common/confettiUtils";
import CardGrid from "./CardGrid";
import EditMessageModal from "./EditMessageModal";
import AdminPopup from "./AdminPopup";
import "./flip.css";

export default function SigHunterFlip() {
  // 🔹 프로젝트 선택 (퀸덤 / 뮤즈)
  const [project, setProject] = useState("queendom"); // "queendom" | "muse"

  // 🔹 프로젝트별 카드 세트 매핑
  const projectCardSets = {
    queendom: queendomSigCards,
    muse: museSigCards,
  };

  // 🔹 현재 선택된 프로젝트의 카드 세트
  const sigCards = projectCardSets[project];

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
    loaded,
  } = useSigStorage();

  const [modal, setModal] = useState(null);

  // 🔹 Firestore에서 상태를 다 불러오기 전이면 로딩 화면만
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
    console.log("[handleFlip] 호출됨, card.id:", card.id, "target:", e.target);

    const target = e.target;

    // 0️⃣ file input에서 올라온 클릭이면 무시
    if (target.tagName === "INPUT" && target.type === "file") {
      console.log("[handleFlip] file input 클릭 감지, flip 무시");
      return;
    }

    // 1️⃣ 버튼 클릭이면 flip 완전히 무시
    if (
      target.closest(".upload-btn") ||
      target.closest(".admin-btn") ||
      target.closest(".edit-msg-btn")
    ) {
      console.log("[handleFlip] 버튼 클릭 감지, flip 무시");
      return;
    }

    const key = String(card.id);
    const currentlyFlipped = !!flipped[card.id];
    const next = !currentlyFlipped;

    const currentMsg = revealed[card.id];

    // 처음 뒤집는 시점 && 이미 편집된 메시지가 아니면
    if (!currentlyFlipped && next && !currentMsg?.edited) {
      const imgs = card.frontImages || [];
      const newImg = imgs[Math.floor(Math.random() * imgs.length)];

      const base = card.isSpecial ? specialMessages : normalMessages;

      const all =
        JSON.parse(localStorage.getItem("cardWeights") || "{}") || {};
      const stored = all[key];
      const weights =
        Array.isArray(stored) && stored.length === base.length
          ? stored
          : base.map((m) => m.weight);

      const msg = weightedPick(base, weights);

      fireConfetti(msg.tier);

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
    console.log("📂 [handleUploadClick] id:", id, "input:", input);

    if (!input) {
      console.warn("⚠️ file input ref 없음:", id);
      return;
    }

    input.click();
  };

  /** 🖼 이미지 파일 변경 */
  const handleImageChange = (e, id) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setRandomImages((p) => ({ ...p, [id]: url }));
      setFlipped((p) => ({ ...p, [id]: false })); // 🔹 여기서만 flip 상태 변경
      setLocked((p) => ({ ...p, [id]: false }));
    };
    reader.readAsDataURL(file);
  };

  /** 🔄 전체 초기화 (현재 프로젝트 기준) */
  const resetAll = () => {
    localStorage.clear();

    setLocked({});
    setRevealed({});
    setFlipped({});

    // 🔹 현재 선택된 프로젝트의 카드 세트 기준으로 이미지 초기화
    const initImgs = {};
    sigCards.forEach((c) => {
      const imgs = c.frontImages;
      if (imgs?.length) {
        initImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
      }
    });
    setRandomImages(initImgs);

    // 가중치 초기화
    const initWeights = {};
    sigCards.forEach((card) => {
      const key = String(card.id);
      initWeights[key] = (
        card.isSpecial ? specialMessages : normalMessages
      ).map((m) => m.weight);
    });
    setCardWeights(initWeights);
    localStorage.setItem("cardWeights", JSON.stringify(initWeights));
  };

  const normalCards = sigCards.filter((c) => !c.isSpecial);
  const specialCard = sigCards.find((c) => c.isSpecial);

  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>

      {/* 🔹 퀸덤 / 뮤즈 선택 드롭다운 */} 
     <div
  style={{
    width: "200px",
    margin: "0 auto 12px auto",     // ✅ 가로 중앙 정렬
    textAlign: "center",  // (선택) 안의 내용도 가운데 정렬
  }}
>
        <select
          value={project}
          onChange={(e) => {
            const next = e.target.value;

            // 🔹 next 프로젝트 카드 세트 선택
            const nextSigCards = projectCardSets[next] ?? queendomSigCards;

            // 1) 랜덤 이미지 재생성
            const initImgs = {};
            nextSigCards.forEach((c) => {
              const imgs = c.frontImages;
              if (imgs?.length) {
                initImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
              }
            });
            setRandomImages(initImgs);

            // 2) 가중치도 그 프로젝트 카드 기준으로 맞추기
            const initWeights = {};
            nextSigCards.forEach((card) => {
              const key = String(card.id);
              initWeights[key] = (
                card.isSpecial ? specialMessages : normalMessages
              ).map((m) => m.weight);
            });
            setCardWeights(initWeights);
            localStorage.setItem("cardWeights", JSON.stringify(initWeights));

            // 3) 뒤집힘/잠금/메시지 상태도 프로젝트 바뀔 때 초기화
            setFlipped({});
            setLocked({});
            setRevealed({});

            // 마지막에 프로젝트 변경
            setProject(next);
          }}
        >
          <option value="queendom">퀸덤</option>
          <option value="muse">뮤즈</option>
        </select>
      </div>

      <button className="reset-btn" onClick={resetAll}>
        🔄 전체 초기화
      </button>

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
      {modal?.type === "edit" && (
        <EditMessageModal
          project={project}
          cardId={modal.id}
          initialMsg={revealed[modal.id]} // 현재 카드의 메시지
          onClose={() => setModal(null)}
          onUpdate={(newMsg) => {
            console.log("✅ [SigHunterFlip] onUpdate 수신:", modal.id, newMsg);
            setRevealed((prev) => ({ ...prev, [modal.id]: newMsg }));
            setLocked((prev) => ({ ...prev, [modal.id]: false }));
          }}
        />
      )}

      {/* ⚙️ 확률 조절 모달 */}
      {modal?.type === "admin" && modal?.id != null && (
        <AdminPopup
          project={project}
          cardId={modal.id}
          onClose={() => setModal(null)}
          onUpdate={(weights, id) => {
            const key = String(id);
            console.log(
              "🎯 [SigHunterFlip] onUpdate, key:",
              key,
              "weights:",
              weights
            );

            setCardWeights((prev) => {
              const updated = { ...prev, [key]: weights };
              console.log("🔄 [SigHunterFlip] updated cardWeights:", updated);
              localStorage.setItem("cardWeights", JSON.stringify(updated));
              return updated;
            });
          }}
        />
      )}
    </div>
  );
}