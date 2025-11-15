import React, { useState, useEffect } from "react";
import { socket } from "../../socket";
import AdminPopup from "../SigHunterFlip/AdminPopup";
import EditMessageModal from "../SigHunterFlip/EditMessageModal";
import { sigCards } from "../../data/sigData";
import "../SigHunterFlip/adminPopup.css";

export default function AdminPage() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [cardWeights, setCardWeights] = useState({});
  const [cardMessages, setCardMessages] = useState({});
  const [cardLocks, setCardLocks] = useState({});
  const [flipped, setFlipped] = useState({});

  useEffect(() => {
    // 초기 상태 수신
    socket.on("init", (data) => {
      setCardWeights(data.cardWeights || {});
      setCardMessages(data.cardMessages || {});
      setCardLocks(data.cardLocks || {});
      setFlipped(data.flippedCards || {});
    });

    // 업데이트 수신
    socket.on("cardWeights:updated", ({ id, weights }) =>
      setCardWeights((p) => ({ ...p, [id]: weights }))
    );
    socket.on("cardMessages:updated", ({ id, message }) =>
      setCardMessages((p) => ({ ...p, [id]: message }))
    );
    socket.on("cardLocks:updated", ({ id, locked }) =>
      setCardLocks((p) => ({ ...p, [id]: locked }))
    );
    socket.on("card:flipped", ({ id, flipped }) =>
      setFlipped((p) => ({ ...p, [id]: flipped }))
    );

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  // emit events
  const updateWeights = (weights) =>
    socket.emit("cardWeights:update", { id: selectedCard, weights });
  const updateMessage = (message) =>
    socket.emit("cardMessages:update", { id: editingCard, message });
  const toggleLock = (id) =>
    socket.emit("cardLocks:update", { id, locked: !cardLocks[id] });
 const handleFlip = (id) => {
  console.log("🎯 emit flip", id);
  socket.emit("card:flip", id);
};

  return (
    <div className="admin-page">
      <h1>🧰 SigHunter Admin Console</h1>
      <div className="admin-cards">
        {sigCards.map((card) => (
          <div
            key={card.id}
            className={`admin-card ${flipped[card.id] ? "flipped" : ""}`}
          >
            <h3>{card.title}</h3>
            <button onClick={() => setSelectedCard(card.id)}>⚙ 확률</button>
            <button onClick={() => setEditingCard(card.id)}>✏ 메시지</button>
            <button onClick={() => toggleLock(card.id)}>
              {cardLocks[card.id] ? "🔒 해제" : "🔓 잠금"}
            </button>
            <button
  onClick={() => {
    console.log("🧩 flip button clicked:", card.id);
    handleFlip(card.id);
  }}
>
  🔁 뒤집기
</button>
          </div>
        ))}
      </div>

      {selectedCard && (
        <AdminPopup
          cardId={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={updateWeights}
        />
      )}
      {editingCard && (
        <EditMessageModal
          cardId={editingCard}
          onClose={() => setEditingCard(null)}
          onUpdate={updateMessage}
        />
      )}
    </div>
  );
}