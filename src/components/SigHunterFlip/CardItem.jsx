import React, { useState, useEffect } from "react";

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

  // ✅ 이미지 변경 시 fade 효과
  const [isChanging, setIsChanging] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(
    randomImages?.[id] || card.frontImages?.[0] || "https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image"
  );
  const [imageError, setImageError] = useState(false);

  const msg = revealed?.[id] || null;
  const isFlipped = flipped?.[id] || false;
  const isLocked = locked?.[id] || false;
  const newSrc = randomImages?.[id] || card.frontImages?.[0] || "https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image";

  const glow = msg?.tier && ["전설", "레전드"].includes(msg.tier);

  // ✅ 이미지 변경 감지 + 사전 로딩
  useEffect(() => {
    if (displaySrc === newSrc) return;

    setIsChanging(true);
    setImageError(false);

    const img = new Image();
    img.src = newSrc;

    const handleLoad = () => {
      setDisplaySrc(newSrc);
      setIsChanging(false);
    };

    const handleError = () => {
      console.error("❌ 이미지 로딩 실패:", newSrc);
      setImageError(true);
      setDisplaySrc("https://via.placeholder.com/200/FF6B6B/FFFFFF?text=Load+Failed");
      setIsChanging(false);
    };

    // decode 지원 브라우저
    if (img.decode) {
      img.decode()
        .then(handleLoad)
        .catch(handleError);
    } else {
      // 구형 브라우저 fallback
      img.onload = handleLoad;
      img.onerror = handleError;
    }

    return () => {
      img.onload = null;
      img.onerror = null;
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

  /** 🖼️ 이미지 로딩 에러 핸들러 */
  const handleImageError = (e) => {
    console.error("❌ 이미지 렌더 실패:", e.target.src);
    if (!imageError) {
      setImageError(true);
      e.target.src = "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=Error";
    }
  };

  /** ✅ 이미지 로딩 성공 핸들러 */
  const handleImageLoad = () => {
    if (imageError) {
      console.log("✅ 이미지 복구 성공:", id);
      setImageError(false);
    }
  };


    console.log("🧾 [CardItem] id:", id, "msg:", msg);

  return (
    <div
      className={`natural-card ${card.isSpecial ? "special-card" : ""} 
        ${isFlipped ? "flipped" : ""} 
        ${glow ? "glow" : ""} 
        ${isLocked ? "locked" : ""}`}
      onClick={handleFlip}
    >
      <div className="card-inner">
        {/*      카드 앞면 */}
        <div className="card-front">
          <img
            src={displaySrc}
            alt={`카드 ${id}`}
            className={isChanging ? "changing" : ""}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            decoding="async"
          />

          {imageError && (
            <div className="image-error-badge">
              ⚠️ 이미지 오류
            </div>
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


export default CardItem;
