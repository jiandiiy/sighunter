// 예시: src/components/GameCenter/Bingo/BingoPage.jsx
import React from "react";
import BingoBoard from "./BingoBoard";

export default function BingoPage() {
  return (
    <div>
      <section>
        <h1>빙고 1</h1>
       <BingoBoard
  boardId="bingo1"
  boardRules={{
    conquest: {
      enabled: true,
      players: ["철수", "영희"], // 표시될 이름
      steal: true,              // ✅ 뺏기 허용
    },
    specialCell: { enabled: false },
  }}
/>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h1>빙고 2</h1>
      <BingoBoard
  boardId="bingo2"
  boardRules={{
    conquest: { enabled: false },
    specialCell: {
      enabled: true,
      index: 4,
      src: "/images/special.png",
      lock: false,      // ✅ 클릭 가능
      autoChecked: false // 원하면 true로 “시작부터 프리칸 체크”
    },
  }}
/>
      </section>
    </div>
  );
}