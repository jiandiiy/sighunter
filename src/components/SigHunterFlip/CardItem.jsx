// src/components/SigHunterFlip/CardItem.jsx
import React, { useState } from "react";

function CardItem({
  card = {},
  sigItem = null,            // 🔹 서버에서 온 시그 메타데이터 (title, score, rarity, imageUrl ...)
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

  // 🔹 메타데이터 (이름 / 점수 / 일반·스페셜) – 데이터는 쓰지만, 앞면엔 표시 안 함
  const rarity =
    sigItem?.rarity || (card.isSpecial ? "special" : "normal");
  const isSpecial = rarity === "special";

  const title =
    sigItem?.title || card.title || (isSpecial ? "스페셜 카드" : `카드 ${id}`);
  // const score =
  //   typeof sigItem?.score === "number" ? sigItem.score : null; // 🔸 사용 안 해서 제거

  // 🔹 이미지: 업로드 > remote > 기본(frontImages[0]) > placeholder
  const baseImage =
    sigItem?.imageUrl ||
    card.frontImages?.[0] ||
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

          {/* ⚙️/✏️ 버튼은 유지 (메시지/확률 편집용) */}
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