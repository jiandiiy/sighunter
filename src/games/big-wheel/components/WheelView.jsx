// src/components/GameCenter/BigWheel/WheelView.jsx
import React from "react";
import { SEGMENT_BG, SEGMENT_STROKE, SEGMENT_STROKE_WIDTH, TIER_TEXT_GRADIENTS } from "../lib/wheelLogic";

// ✅ 티어별 보석 이미지(경로는 프로젝트에 맞게 수정)
const TIER_GEM_IMAGES = {
  DIAMOND: "/images/gems/diamond.png",
  EMERALD: "/images/gems/emerald.png",
  SAPPHIRE: "/images/gems/sapphire.png",
  RUBY: "/images/gems/ruby.png",
  GOLD: "/images/gems/gold.png",
  PEARL: "/images/gems/pearl.png",
};

export default function WheelView({
  wheelSize,
  segments,
  rotation,
  isSpinning,
  snapTransition,
  children,
}) {
  const segmentCount = segments.length || 1;
  const segmentAngle = 360 / segmentCount;

  const pointerW = Math.max(18, wheelSize * 0.04);
  const pointerH = Math.max(36, wheelSize * 0.06);

  return (
    <div style={{ position: "relative", width: wheelSize, height: wheelSize }}>
      {/* 포인터 */}
      <div
        style={{
          position: "absolute",
          top: -pointerH * 0.15,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${pointerW * 0.5}px solid transparent`,
          borderRight: `${pointerW * 0.5}px solid transparent`,
          borderTop: `${pointerH}px solid #fbbf24`,
          filter:
            "drop-shadow(0 0 18px rgba(251,191,36,0.95)) drop-shadow(0 0 40px rgba(252,211,77,0.9))",
          zIndex: 30,
          pointerEvents: "none",
        }}
      />

      {/* 휠 */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%" }}>
        {/* 회전하는 부분 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 5s cubic-bezier(0.12, 0.8, 0.2, 1)' 
            : snapTransition ? 'transform 0.3s cubic-bezier(0.36,1.7,0.45,0.83)' 
            : 'none'
          }}
        >
          {/* 바깥 갈색 링 */}
          <div
            style={{
              position: "absolute",
              inset: "1%",
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, #92400e, #78350f, #92400e, #78350f)",
              boxShadow:
                "0 0 80px rgba(0,0,0,1), inset 0 0 30px rgba(0,0,0,0.7)",
            }}
          />

          {/* 금색 점 */}
          {segments.map((seg, i) => {
            const angle = i * segmentAngle - 90;

            const dotSize = Math.max(14, wheelSize * 0.02);
            const dotRadius = wheelSize * 0.48;
            const centerNudge = dotSize / 2;

            return (
              <div
                key={`dot-${seg.id}`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: dotSize,
                  height: dotSize,
                  marginLeft: -centerNudge,
                  marginTop: -centerNudge,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 30%, #fef3c7, #d97706)",
                  boxShadow: "0 0 14px rgba(251,191,36,0.95)",
                  transform: `rotate(${angle}deg) translateX(${dotRadius}px)`,
                  transformOrigin: "center",
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
              width: "91%",
              height: "91%",
              left: "4.5%",
              top: "4.5%",
            }}
          >
            {segments.map((seg, i) => {
              const angle = i * segmentAngle - 90;
              const num = seg.number;
              const isSpecial = num === "28" || num === "18" || num === "9";
              const size = 40;
              const numberRadius = wheelSize * 0.43;

              return (
                <div
                  key={`outer-${seg.id}`}
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
                      transform: `rotate(${-(angle + rotation)}deg)`,
                      transformOrigin: "center",
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
  {/* ✅ 칸-칸 사이 구분선(방사형 라인) */}
  {segments.map((seg, i) => {
    const boundaryAngle = i * segmentAngle - 90.7; // 세그먼트 경계
    const lineLen = wheelSize * 0.33;            // 선 길이
    const lineOffset = wheelSize * 0.12;         // 중심에서 시작(중앙 원 피하기)

    return (
      <div
        key={`sep-${seg.id}`}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: lineLen,
          height: SEGMENT_STROKE_WIDTH,
          background: SEGMENT_STROKE,
          transformOrigin: "0 50%",
          transform: `rotate(${boundaryAngle}deg) translateX(${lineOffset}px)`,
          zIndex: 11, // inner(10)보다 위
          pointerEvents: "none",
        }}
      />
    );
  })}

  {segments.map((seg, i) => {
    const angle = i * segmentAngle - 90;
    const midAngle = angle + segmentAngle / 2;

    const baseLength = wheelSize * 0.24;
    const baseThickness = wheelSize * 0.06;
    const baseRadius = wheelSize * 0.23;

    const gemSrc = TIER_GEM_IMAGES[seg.tier];

    const segmentBg = SEGMENT_BG;
    //const segmentStroke = SEGMENT_STROKE;
    //const segmentStrokeWidth = SEGMENT_STROKE_WIDTH;

    const gradStops = TIER_TEXT_GRADIENTS[seg.tier] || ["#334155", "#0f172a"];
    const tierTextStyle = {
      fontSize: 30,
      fontWeight: 900,
      whiteSpace: "nowrap",
      letterSpacing: 0.3,
      backgroundImage: `linear-gradient(180deg, ${gradStops.join(", ")})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      WebkitTextStroke: "1.5px rgba(15,23,42,0.55)",
    };

    return (
      <div
        key={`inner-${seg.id}`}
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
        {/* ✅ 흰색 패널(기존) */}
        <div
          style={{
             width: "70%",
    height: "70%",
    background: segmentBg,
    clipPath: "polygon(0% 15%, 100% 0%, 100% 100%, 0% 80%)",
    boxSizing: "border-box",
  }}
        />

        {/* 티어 텍스트 + 보석 이미지 */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "36%",
            transform: "translate(-50%, -60%)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={tierTextStyle}>{seg.tier}</span>


                    {gemSrc && (
                      <img
                        src={gemSrc}
                        alt=""
                        width={22}
                        height={22}
                        style={{
                          display: "block",
                          objectFit: "contain",
                          transform: "scale(1.25)",
                          transformOrigin: "center",
                          filter: "drop-shadow(0 0 3px rgba(0,0,0,0.85))",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 중앙 오버레이 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            zIndex: 60,
            pointerEvents: "none",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}