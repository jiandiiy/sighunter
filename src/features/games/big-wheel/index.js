import CasinoWheelHuge from "./components/CasinoWheelHuge";
// ↑ 경로는 프로젝트 구조에 따라 조정
// App.js가 src 바로 아래에 있으니,
// games 폴더도 src 바로 아래라고 가정하면:
//   src/games/big-wheel/index.jsx
//   src/components/GameCenter/BigWheel/CasinoWheelHuge.jsx

export default function BigWheel() {
  return <CasinoWheelHuge />;
}