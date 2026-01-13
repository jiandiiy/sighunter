// src/components/GameCenter/Bingo/BingoPage.jsx
import React from "react";
import BingoBoard from "./BingoBoard";

export default function BingoPage() {
  return (
    <div>
      <section>
        <h1>빙고 1</h1>
        <BingoBoard boardId="bingo1" />
      </section>

      <section style={{ marginTop: "40px" }}>
        <h1>빙고 2</h1>
        <BingoBoard boardId="bingo2" />
      </section>

      <section style={{ marginTop: "40px" }}>
        <h1>빙고 3</h1>
        <BingoBoard boardId="bingo3" />
      </section>
    </div>
  );
}