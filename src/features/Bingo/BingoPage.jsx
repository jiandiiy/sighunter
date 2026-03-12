// src/components/GameCenter/Bingo/BingoPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import BingoBoard from "./BingoBoard";

const BOARD_IDS = {
  "1": "bingo1",
  "2": "bingo2",
  "3": "bingo3",
};

export default function BingoPage() {
  const { id = "1" } = useParams(); // /bingo/1, /bingo/2, /bingo/3

    console.log("[BINGO] From Route Component", { no }); // 🔹이 줄 추가

  const currentBoardNo = ["1", "2", "3"].includes(id) ? id : "1";
  const boardId = BOARD_IDS[currentBoardNo];

  return (
    <div>
      <BingoBoard boardId={boardId} currentBoardNo={currentBoardNo} />
    </div>
  );
}