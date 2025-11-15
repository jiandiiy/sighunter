import { socket } from "../../socket";
import React, { useEffect, useState } from "react";
import SigHunterFlip from "../SigHunterFlip/SigHunterFlip";
import { sigCards } from "../../data/sigData";

export default function OverlayPage() {
  const [flipped, setFlipped] = useState({});
  const [cardLocks, setCardLocks] = useState({});
  const [cardMessages, setCardMessages] = useState({});
  const [cardWeights, setCardWeights] = useState({});

  // ✅ 초기 상태(init)
  useEffect(() => {
  // 서버로부터 init을 받을 핸들러 등록
  const initHandler = (data) => {
    console.log("🟣 received init:", data);
    setFlipped(data.flippedCards || {});
    setCardLocks(data.cardLocks || {});
    setCardMessages(data.cardMessages || {});
    setCardWeights(data.cardWeights || {});
  };
  socket.on("init", initHandler);

  // ✅ 연결되면 서버에 init 요청 보내기
  socket.emit("request:init");

  return () => socket.off("init", initHandler);
}, []);

  // ✅ 카드 뒤집기 이벤트
 useEffect(() => {
  const flipHandler = ({ id, flipped }) => {
    console.log("🎬 received flip from server:", id, flipped);
    setFlipped((prev) => ({ ...prev, [id]: flipped }));
  };

  socket.on("card:flipped", flipHandler);

  return () => socket.off("card:flipped", flipHandler);
}, []);

  // ✅ 카드 잠금 이벤트
  useEffect(() => {
    const lockHandler = ({ id, locked }) => {
      setCardLocks((prev) => ({ ...prev, [id]: locked }));
    };
    socket.on("cardLocks:updated", lockHandler);
    return () => socket.off("cardLocks:updated", lockHandler);
  }, []);

  return (
    <div className="overlay-container">
      <SigHunterFlip
        sigCards={sigCards}
        flipped={flipped}
        locked={cardLocks}
        messages={cardMessages}
        weights={cardWeights}
      />
    </div>
  );
}