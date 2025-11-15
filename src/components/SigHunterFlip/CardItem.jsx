import React, { useRef } from "react";

export default function CardItem({
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
  // 안전하게 데이터 구조 접근
  const msg = revealed?.[card.id] || null;
  const isFlipped = flipped?.[card.id] || false;
  const isLocked = locked?.[card.id] || false;
  const imageSrc = randomImages?.[card.id] || "/images/placeholder.png";

  const glow = msg?.tier && ["전설", "레전드"].includes(msg.tier);

  // 카드 클릭 (잠금 상태 시 무효)
  const handleFlip = (e) => {
    if (isLocked) {
      e.stopPropagation();
      return;
    }
    onFlip(card, e);
  };

  return (
    <div
      className={`natural-card ${card.isSpecial ? "special-card" : ""} ${
        isFlipped ? "flipped" : ""
      } ${glow ? "glow" : ""} ${isLocked ? "locked" : ""}`}
      onClick={handleFlip}
    >
      <div className="card-inner">
        {/* -------------------- 카드 앞면 -------------------- */}
        <div className="card-front">
          <img src={imageSrc} alt={`카드 ${card.id ?? "?"}`} />

          {/* ✏️ 메시지 수정 */}
          <button
            type="button"
            className="edit-msg-btn"
            title={`카드 ${card.id} 메시지 수정`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e, card.id);
            }}
          >
            ✏️
          </button>

          {/* ⚙️ 확률 조절 (Admin) */}
          <button
            type="button"
            className="admin-btn"
            title={`카드 ${card.id} 확률 조절`}
            onClick={(e) => {
              e.stopPropagation();
              onAdmin(e, card.id);
            }}
          >
            ⚙️
          </button>
        </div>

        {/* -------------------- 카드 뒷면 -------------------- */}
        <div
          className="card-back"
          style={
            msg
              ? { background: msg.bgColor || "#222", color: msg.color || "#fff" }
              : {}
          }
        >
          <div className="back-content">
            {msg ? (
              <>
                <span
                  className={`tier ${
                    msg.tier ? msg.tier.toLowerCase() : "unknown"
                  }`}
                >
                  {msg.tier || ""}
                </span>
                <h3>{msg.text || ""}</h3>
              </>
            ) : (
              <h3>?</h3>
            )}

            {/* 🖼️ 이미지 업로드 */}
            <button
              type="button"
              className="upload-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUploadClick(e, card.id);
              }}
            >
              🖼️
            </button>

            <input
              ref={(el) => {
                if (fileInputRefs && fileInputRefs.current) {
                  fileInputRefs.current[card.id] = el;
                }
              }}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onImageChange(e, card.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}