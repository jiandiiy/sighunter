import React, { useState } from "react";

function CardItem({
  card = {},
  flipped = {},
  locked = {},
  revealed = {},
  randomImages = {},
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

  const newSrc =
    randomImages?.[id] ||
    card.frontImages?.[0] ||
    "https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image";

  /** 🃏 카드 클릭 */
  const handleFlip = (e) => {
    // file input이면 카드까지 올라가지 않게 여기서 바로 막기
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
      className={`natural-card ${card.isSpecial ? "special-card" : ""} 
        ${isFlipped ? "flipped" : ""} 
        ${isLocked ? "locked" : ""}`}
      onClick={handleFlip}
    >
      <div className="card-inner">
        {/* 카드 앞면 */}
        <div className="card-front">
          <img
            src={newSrc}                 // ✅ 바로 newSrc 사용
            alt={`카드 ${id}`}
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