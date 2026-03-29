// src/games/meal-bingo/index.jsx
import React from "react";
import { useParams } from "react-router-dom";
import BingoBoard from "../../games/meal-bingo/components/BingoBoard";

export default function MealBingoPage() {
  const { boardNo = "1" } = useParams();

  console.log("[MEAL-BINGO] params", { boardNo });

  return (
    <BingoBoard
      boardId={`bingo${boardNo}`}
      currentBoardNo={boardNo}
    />
  );
}