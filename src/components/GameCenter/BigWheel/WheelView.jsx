// src/components/GameCenter/BigWheel/WheelView.jsx
import React from "react";
import { TIER_GRADIENTS, TIER_TEXT_STYLES } from "./wheelLogic";

export default function WheelView({
  wheelSize,
  segments,
  rotation,
  isSpinning,
}) {
  const segmentCount = segments.length || 1;
  const segmentAngle = 360 / segmentCount;

  return (
    <div
      style={{
        position: "relative",
        width: wheelSize + 80,
        height: wheelSize + 140,
      }}
    >
      {/* 포인터 */}
      <div
        style={{
          position: "absolute",
          top: "5.2%",
          left: "52%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "20px solid transparent",
          borderRight: "20px solid transparent",
          borderTop: "50px solid #fbbf24",
          filter:
            "drop-shadow(0 0 18px rgba(251,191,36,0.95)) drop-shadow(0 0 40px rgba(252,211,77,0.9))",
          zIndex: 30,
        }}
      />

      {/* 휠 본체 */}
      <div
        style={{
          width: wheelSize,
          height: wheelSize,
          borderRadius: "50%",
          position: "relative",
          top: 70,
          left: 40,
        }}
      >
        {/* 회전하는 부분 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 5s cubic-bezier(0.12, 0.8, 0.2, 1)"
              : "none",
          }}
        >
          {/* 바깥 갈색 링 */}
          <div
            style={{
              position: "absolute",
              inset: "-1%",
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, #92400e, #78350f, #92400e, #78350f)",
              boxShadow:
                "0 0 80px rgba(0,0,0,1), inset 0 0 30px rgba(0,0,0,0.7)",
            }}
          />

          {/* 금색 점 */}
          {segments.map((_, i) => {
            const angle = i * segmentAngle - 90;
            return (
              <div
                key={`dot-${i}`}
                style={{
                  position: "absolute",
                  top: "49%",
                  left: "49%",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 30%, #fef3c7, #d97706)",
                  boxShadow: "0 0 14px rgba(251,191,36,0.95)",
                  transform: `rotate(${angle}deg) translateY(-490px) translateX(-12px)`,
                }}
              />
            );
          })}

          {/* 숫자 원 링 */}
          <div
            style={{
              position: "absolute",
              inset: "3.4%",
              borderRadius: "50%",
              background: "#020617",
              width: "93%",
              height: "93%",
              left: "3.5%",
              top: "3.8%",
            }}
          >
            {segments.map((seg, i) => {
              const angle = i * segmentAngle - 90; // 위쪽 기준
              const num = seg.number;
              const isSpecial = num === "28" || num === "18" || num === "9";
              const size = 40;
              const numberRadius = wheelSize * 0.43;

              return (
                <div
                  key={`outer-${i}`}
                  style={{
                    position: "absolute",
                    top: "52%",
                    left: "50%",
                    width: size,
                    height: size,
                    marginLeft: -size / 2,
                    marginTop: -size / 2,
                    borderRadius: "50%",
                    background: isSpecial
                      ? "radial-gradient(circle at 30% 30%, #ef4444, #7f1d1d)"
                      : "radial-gradient(circle at 30% 30%, #e5e7eb, #6b7280)",
                    border: "3px solid #020617",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#020617",
                    textShadow: "0 0 3px rgba(255,255,255,0.7)",
                    transformOrigin: "50% 0%",
                    transform: `rotate(${angle}deg) translateX(${numberRadius}px)`,
                    boxShadow: "0 0 14px rgba(0,0,0,0.9)",
                    zIndex: 12,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: `rotate(${-angle}deg)`,
                    }}
                  >
                    {num}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 안쪽 티어 링 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          >
            {segments.map((seg, i) => {
              const angle = i * segmentAngle - 90;
              const midAngle = angle + segmentAngle / 2;
              const color = TIER_GRADIENTS[seg.tier];

              const baseLength = wheelSize * 0.30;
              const baseThickness = wheelSize * 0.07;
              const baseRadius = wheelSize * 0.18;

              return (
                <div
                  key={`inner-${i}`}
                  style={{
                    position: "absolute",
                    top: "48%",
                    left: "50.7%",
                    width: baseLength,
                    height: baseThickness,
                    transformOrigin: "-2% 30%",
                    transform: `rotate(${midAngle}deg) translateX(${baseRadius}px)`,
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: "70%",
                      height: "70%",
                      background: color,
                      clipPath: "polygon(0% 15%, 100% 0%, 100% 100%, 0% 80%)",
                      borderLeft: "1px solid rgba(15,23,42,0.9)",
                      borderRight: "1px solid rgba(15,23,42,0.9)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "30%",
                      left: "35%",
                      transform: "translate(-50%, -60%)",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        letterSpacing: 0.3,
                        color: TIER_TEXT_STYLES[seg.tier].color,
                        textShadow: `
                          0 0 3px rgba(0,0,0,0.9),
                          -1px -1px 0 ${TIER_TEXT_STYLES[seg.tier].stroke},
                          1px -1px 0 ${TIER_TEXT_STYLES[seg.tier].stroke},
                          -1px 1px 0 ${TIER_TEXT_STYLES[seg.tier].stroke},
                          1px 1px 0 ${TIER_TEXT_STYLES[seg.tier].stroke}
                        `,
                      }}
                    >
                      {seg.tier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}