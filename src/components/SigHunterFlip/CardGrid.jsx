import React from "react";
import CardItem from "./CardItem";

export default function CardGrid({
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
          // 여기서 card.id 전달 👍
          onAdmin={(e) => onAdmin(e, card.id)}
          onEdit={(e) => onEdit(e, card.id)}
          onFlip={onFlip}
          onUploadClick={onUploadClick}
          onImageChange={onImageChange}
          fileInputRefs={fileInputRefs}
        />
      ))}
    </div>
  );
}