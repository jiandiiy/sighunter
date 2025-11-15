import React, { memo } from "react";
import CardItem from "./CardItem";

function CardGrid({
  cards,
  flipped,
  locked,
  revealed,
  randomImages,
  onFlip,
  onAdmin,
  onEdit,
  onUploadClick,
  onImageChange,
  fileInputRefs,
}) {
  return (
    <div className="card-grid">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          flipped={flipped}
          locked={locked}
          revealed={revealed}
          randomImages={randomImages}
          onFlip={onFlip}
          onAdmin={(e) => onAdmin(e, card.id)}
          onEdit={(e) => onEdit(e, card.id)}
          onUploadClick={onUploadClick}
          onImageChange={onImageChange}
          fileInputRefs={fileInputRefs}
        />
      ))}
    </div>
  );
}

export default memo(CardGrid);