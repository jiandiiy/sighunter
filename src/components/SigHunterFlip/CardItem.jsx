import React, { memo, useState, useEffect } from "react";

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

  // ✅ 이미지 변경 시 fade 효과 주기
  const [isChanging, setIsChanging] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(
    randomImages?.[id] || "/images/placeholder.png"
  );

  const msg = revealed?.[id] || null;
  const isFlipped = flipped?.[id] || false;
  const isLocked = locked?.[id] || false;
  const newSrc = randomImages?.[id] || "/images/placeholder.png";

  const glow = msg?.tier && ["전설", "레전드"].includes(msg.tier);

  /** 🖼 이미지 변경 감지 + 프리로드 + 부드러운 전환 */
  useEffect(() => {
    if (displaySrc === newSrc) return;
    setIsChanging(true);

    const img = new Image();
    img.src = newSrc;
    img.onload = () => {
      requestAnimationFrame(() => {
        setDisplaySrc(newSrc);
        setIsChanging(false);
      });
    };
  }, [newSrc, displaySrc]);

  /** 🃏 카드 클릭 */
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
          <img
            src={displaySrc}
            alt={`카드 ${id}`}
            className={isChanging ? "changing" : ""}
          />

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

/** 🧩 렌더 최적화: 해당 카드의 상태가 바뀔 때만 리렌더 */
export default memo(CardItem, (prev, next) => {
  const id = prev.card.id;
  return (
    prev.flipped[id] === next.flipped[id] &&
    prev.locked[id] === next.locked[id] &&
    prev.randomImages[id] === next.randomImages[id] &&
    JSON.stringify(prev.revealed[id]) === JSON.stringify(next.revealed[id])
  );
});