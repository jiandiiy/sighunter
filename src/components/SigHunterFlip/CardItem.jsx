import React, { memo } from "react";

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

  const msg = revealed?.[id] || null;
  const isFlipped = flipped?.[id] || false;
  const isLocked = locked?.[id] || false;
  const imageSrc = randomImages?.[id] || "/images/placeholder.png";
  const glow = msg?.tier && ["전설", "레전드"].includes(msg.tier);

  const handleFlip = (e) => {
    if (isLocked) {
      e.stopPropagation();
      return;
    }
    onFlip(card, e);
  };

  return (
    <div
      className={`natural-card ${card.isSpecial ? "special-card" : ""} 
        ${isFlipped ? "flipped" : ""} 
        ${glow ? "glow" : ""} 
        ${isLocked ? "locked" : ""}`}
      onClick={handleFlip}
    >
      <div className="card-inner">
        {/* 카드 앞면 */}
        <div className="card-front">
          <img src={imageSrc} alt={`카드 ${id}`} />

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
            {msg ? (
              <>
                <span className={`tier ${msg.tier?.toLowerCase() ?? "unknown"}`}>
                  {msg.tier || ""}
                </span>
                <h3>{msg.text || ""}</h3>
              </>
            ) : (
              <h3>?</h3>
            )}

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
                if (fileInputRefs?.current) {
                  fileInputRefs.current[id] = el;
                }
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

/** 🧩 핵심: 불필요한 리렌더링 방지용 커스텀 비교 */
export default memo(CardItem, (prev, next) => {
  const id = prev.card.id;
  return (
    prev.flipped[id] === next.flipped[id] &&
    prev.locked[id] === next.locked[id] &&
    prev.randomImages[id] === next.randomImages[id] &&
    JSON.stringify(prev.revealed[id]) === JSON.stringify(next.revealed[id])
  );
});