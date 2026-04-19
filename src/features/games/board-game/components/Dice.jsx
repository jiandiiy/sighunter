// src/components/GameCenter/BoardGame/Dice.jsx
import React from "react";

export function DiceBox({
  value,
  isRolling,
  rotation3d,
  snapRotation,
  onRoll,
  disabled,
}) {
  const size = 120;
  const half = size / 2;

  const getRotationForValue = (v) => {
    switch (v) {
      case 1:
        return { x: 0, y: 0 };
      case 2:
        return { x: -90, y: 0 };
      case 3:
        return { x: 0, y: 90 };
      case 4:
        return { x: 0, y: -90 };
      case 5:
        return { x: 90, y: 0 };
      case 6:
        return { x: 180, y: 0 };
      default:
        return { x: 0, y: 0 };
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
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          borderRadius: 7,
          overflow: "hidden",
        }}
      >
        {/* 베이스 면 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 7,
            background: "linear-gradient(145deg, #ffffff, #d1d5db)",
            border: "1px solid rgba(0,0,0,0.25)",
            boxShadow:
              "inset 0 2px 10px rgba(255,255,255,0.7), inset 0 -10px 18px rgba(0,0,0,0.18)",
          }}
        />
        {/* 하이라이트 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 7,
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%)",
            pointerEvents: "none",
          }}
        />
        {/* 비네팅(가장자리 암부) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 7,
            background:
              "radial-gradient(circle at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.22) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* 점(pip) */}
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

  // 회전 정의
  const roll =
    rotation3d &&
    typeof rotation3d.x === "number" &&
    typeof rotation3d.y === "number" &&
    typeof rotation3d.z === "number"
      ? rotation3d
      : { x: 900, y: 1260, z: 0 };

  const cubeTransform = isRolling
    ? `translateZ(0) rotateX(${roll.x}deg) rotateY(${roll.y}deg) rotateZ(${roll.z}deg)`
    : `translateZ(0) rotateX(${finalSnap.x}deg) rotateY(${finalSnap.y}deg)`;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",

        perspective: 900,
        WebkitPerspective: 900,
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
      {/* 바닥 그림자 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "74%",
          width: "90%",
          height: "30%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.45), rgba(0,0,0,0))",
          filter: "blur(6px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* 큐브 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transform: cubeTransform,
          transitionProperty: "transform",
          transitionDuration: isRolling ? "0ms" : "450ms",
          transitionTimingFunction: "ease-out",
          willChange: "transform",
          zIndex: 1,
        }}
      >
        <Face pips={1} transform={`translateZ(${half}px)`} />
        <Face pips={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
        <Face pips={2} transform={`rotateX(90deg) translateZ(${half}px)`} />
        <Face pips={5} transform={`rotateX(-90deg) translateZ(${half}px)`} />
        <Face pips={3} transform={`rotateY(90deg) translateZ(${half}px)`} />
        <Face pips={4} transform={`rotateY(-90deg) translateZ(${half}px)`} />

        {/* 큐브 엣지/글로우 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            boxShadow:
              "0 18px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.18) inset",
            pointerEvents: "none",
            transform: "translateZ(1px)",
          }}
        />
      </div>
    </div>
  );
}