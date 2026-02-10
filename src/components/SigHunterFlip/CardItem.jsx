// src/components/SigHunterFlip/CardItem.jsx
import React, { useState } from "react";

function CardItem({
  card = {},
  sigItem = null,
  flipped = {},
  locked = {},
  revealed = {},
  randomImages = {},
  frontImageIndex = 0,          // ✅ 추가
  onFlip = () => {},
  onAdmin = () => {},
  onEdit = () => {},
  onUploadClick = () => {},
  onImageChange = () => {},
  fileInputRefs = { current: {} },
}) {
  const id = card.id;

  const [imageError, setImageError] = useState(false);

  const msg = revealed?.[id] || null;
  const isFlipped = flipped?.[id] || false;
  const isLocked = locked?.[id] || false;

  const rarity =
    sigItem?.rarity || (card.isSpecial ? "special" : "normal");
  const isSpecial = rarity === "special";

  const title =
    sigItem?.title || card.title || (isSpecial ? "스페셜 카드" : `카드 ${id}`);

  // ✅ frontImages 후보군에서 index 기반으로 선택
  const baseFront =
    Array.isArray(card.frontImages) && card.frontImages.length > 0
      ? card.frontImages[frontImageIndex % card.frontImages.length]
      : null;

  // 🔹 이미지 우선순위: 업로드 > 서버 시그 > frontImages > placeholder
  const baseImage =
    sigItem?.imageUrl ||
    baseFront ||
    "https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image";

  const newSrc = randomImages?.[id] || baseImage;

  /** 🃏 카드 클릭 */
  const handleFlip = (e) => {
    if (e.target.tagName === "INPUT" && e.target.type === "file") {
      e.stopPropagation();
      return;
    }

    if (isLocked) {
      e.stopPropagation();
      return;
    }

    onFlip(card, e);
  };

  /** 🖼️ 이미지 로딩 에러 핸들러 */
  const handleImageError = (e) => {
    console.error("❌ 이미지 렌더 실패:", e.target.src);
    if (!imageError) {
      setImageError(true);
      e.target.src =
        "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=Error";
    }
  };

  /** ✅ 이미지 로딩 성공 핸들러 */
  const handleImageLoad = () => {
    if (imageError) setImageError(false);
  };

  return (
    <div
      className={`natural-card ${isSpecial ? "special-card" : ""} 
        ${isFlipped ? "flipped" : ""} 
        ${isLocked ? "locked" : ""}`}
      onClick={handleFlip}
    >
      <div className="card-inner">
        {/* 카드 앞면 - 이미지만 노출 */}
        <div className="card-front">
          <img
            src={newSrc}
            alt={title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            decoding="async"
          />

          {imageError && (
            <div className="image-error-badge">⚠️ 이미지 오류</div>
          )}

          <button
            type="button"
            className="edit-msg-btn"
            title={`카드 ${id} 메시지 수정`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e, id);
            }}
          >
            ✏️
          </button>

          <button
            type="button"
            className="admin-btn"
            title={`카드 ${id} 확률 조절`}
            onClick={(e) => {
              e.stopPropagation();
              onAdmin(e, id);
            }}
          >
            ⚙️
          </button>
        </div>

        {/* 카드 뒷면 */}
        <div
          className="card-back"
          style={
            msg
              ? { background: msg.bgColor || "#222", color: msg.color || "#fff" }
              : {}
          }
        >
          <div className="back-content">
            {msg ? <h3>{msg.text || ""}</h3> : <h3>?</h3>}

            <button
              type="button"
              className="upload-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUploadClick(e, id);
              }}
            >
              🖼️
            </button>

            <input
              ref={(el) => {
                if (fileInputRefs?.current) fileInputRefs.current[id] = el;
              }}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onImageChange(e, id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardItem;