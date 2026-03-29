
import React, { useState } from "react";
import { toStorageUrl } from "../../../shared/core/storageUrl"; // ✅ 추가

function CardItem({
  card = {},
  sigItem = null,
  flipped = {},
  locked = {},
  revealed = {},
  randomImages = {},
  frontImageIndex = 0,
  onFlip = () => {},
  onAdmin = () => {},
  onEdit = () => {},
  onUploadClick = () => {},
  onImageChange = () => {},
  fileInputRefs = { current: {} },
}) {
  const id = card.id;

  const [imageError, setImageError] = useState(false);

  const msg      = revealed?.[id] || null;
  const isFlipped = flipped?.[id] || false;
  const isLocked  = locked?.[id] || false;

  const rarity    = sigItem?.rarity || (card.isSpecial ? "special" : "normal");
  const isSpecial = rarity === "special";

  const title =
    sigItem?.title || card.title || (isSpecial ? "스페셜 카드" : `카드 ${id}`);

  const baseFront =
    Array.isArray(card.frontImages) && card.frontImages.length > 0
      ? card.frontImages[frontImageIndex % card.frontImages.length]
      : null;

  const baseImage =
    sigItem?.imageUrl ||
    baseFront ||
    "https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image";

  // ✅ 어떤 경로가 와도 Storage URL로 변환
  const newSrc = toStorageUrl(randomImages?.[id] || baseImage);

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

  const handleImageError = (e) => {
    console.error("❌ 이미지 렌더 실패:", e.target.src);
    if (!imageError) {
      setImageError(true);
      e.target.src = "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=Error";
    }
  };

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
