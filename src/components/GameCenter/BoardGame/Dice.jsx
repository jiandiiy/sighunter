import React from "react";

export function DiceBox({
  value,
  isRolling,
  rotation3d,
  snapRotation,
  onRoll,
  disabled,
}) {
  const size = 64;
  const half = size / 2;

  const getRotationForValue = (v) => {
    switch (v) {
      case 1: return { x: 0, y: 0 };
      case 2: return { x: -90, y: 0 };
      case 3: return { x: 0, y: 90 };
      case 4: return { x: 0, y: -90 };
      case 5: return { x: 90, y: 0 };
      case 6: return { x: 180, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  const finalSnap =
    snapRotation && typeof snapRotation.x === "number"
      ? snapRotation
      : getRotationForValue(value || 1);

  const pipPositions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const pipSize = Math.round(size * 0.14);
  const pipRadius = Math.round(pipSize / 2);

  const padPct = 18;
  const coordsPct = [
    { x: padPct, y: padPct },
    { x: 50, y: padPct },
    { x: 100 - padPct, y: padPct },
    { x: padPct, y: 50 },
    { x: 50, y: 50 },
    { x: 100 - padPct, y: 50 },
    { x: padPct, y: 100 - padPct },
    { x: 50, y: 100 - padPct },
    { x: 100 - padPct, y: 100 - padPct },
  ];

  const Face = ({ pips, transform }) => {
    const active = pipPositions[pips] || [];
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform,

          // ✅ 3D에서 뒷면 보이면서 “휘날림”처럼 보이는 것 방지
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",

          borderRadius: 16,
          background: "radial-gradient(circle at top, #ffffff, #e5e7eb)",
          border: "2px solid rgba(15,23,42,0.55)",
          boxShadow:
            "0 6px 10px rgba(0,0,0,0.2), inset 0 0 6px rgba(255,255,255,0.6)",
          overflow: "hidden",
        }}
      >
        {active.map((idx) => {
          const c = coordsPct[idx];
          return (
            <span
              key={idx}
              style={{
                position: "absolute",
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: pipSize,
                height: pipSize,
                marginLeft: -pipRadius,
                marginTop: -pipRadius,
                borderRadius: 999,
                background:
                  "radial-gradient(circle at 35% 35%, #111827, #030712)",
                boxShadow: "inset 0 2px 3px rgba(255,255,255,0.15)",
              }}
            />
          );
        })}
      </div>
    );
  };

  // ✅ 휘날림(평면화) 방지 포인트:
  // - perspective는 “DiceBox 바깥”이 아니라 “여기 최상위”에 고정
  // - cube 자체도 translateZ(0) 넣어 GPU 레이어로
  // - transition은 rotate에만 걸리게 (transform 전체에 걸면 일부 브라우저에서 preserve-3d 깨짐)
  const roll =
    rotation3d &&
    typeof rotation3d.x === "number" &&
    typeof rotation3d.y === "number" &&
    typeof rotation3d.z === "number"
      ? rotation3d
      : { x: 720, y: 720, z: 360 };

  const cubeTransform = isRolling
  ? "translateZ(0) rotateX(900deg) rotateY(1260deg)" // 앞/옆/위가 여러 번 도는 느낌
  : `translateZ(0) rotateX(${finalSnap.x}deg) rotateY(${finalSnap.y}deg)`;

  return (
    <div
      style={{
        width: size,
        height: size,

        // ✅ 핵심: perspective는 여기(최상위)에
        perspective: 900,
        WebkitPerspective: 900,

        // ✅ 이 레벨에서 3D 컨텍스트 유지
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",

        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
      }}
      onClick={() => {
        if (disabled || isRolling) return;
        onRoll && onRoll();
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",

          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",

          transform: cubeTransform,

          // ✅ transform 전체 transition을 피하고(사파리에서 preserve 깨짐 방지)
          transitionProperty: "transform",
          transitionDuration: isRolling ? "0ms" : "450ms",
          transitionTimingFunction: "ease-out",

          // ✅ 보조: 약간의 기울기/원근감 강화
          willChange: "transform",
        }}
      >
        {/* 면 배치 */}
        <Face pips={1} transform={`translateZ(${half}px)`} />
        <Face pips={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
        <Face pips={2} transform={`rotateX(90deg) translateZ(${half}px)`} />
        <Face pips={5} transform={`rotateX(-90deg) translateZ(${half}px)`} />
        <Face pips={3} transform={`rotateY(90deg) translateZ(${half}px)`} />
        <Face pips={4} transform={`rotateY(-90deg) translateZ(${half}px)`} />
      </div>
    </div>
  );
}