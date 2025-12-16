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
            conquest: { enabled: true }, // ✅ 랜덤 점령 + 이름표시
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
              src: "/images/special.png", // ✅ 가운데 스페셜 카드 이미지
              lock: false,               // 클릭/체크 가능
              autoChecked: false,        // 원하면 true(프리칸 시작)
            },
          }}
        />
      </section>
    </div>
  );
}