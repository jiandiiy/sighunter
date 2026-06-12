import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import useDiceGame from '../hooks/useDiceGame';

/**
 * 주사위 면별 회전값 매핑
 */
const faceToRotationX = {
  1: 0,
  2: -90,
  3: 0,
  4: 0,
  5: 90,
  6: 180,
};

const faceToRotationY = {
  1: 0,
  2: 0,
  3: -90,
  4: 90,
  5: 0,
  6: 0,
};

const faceToRotationZ = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
};

/**
 * DiceContainer: CSS 3D Transform으로 주사위 렌더링
 */
export default function DiceContainer() {
  const mode = useDiceGame((state) => state.mode);
  const phase = useDiceGame((state) => state.phase);
  const result = useDiceGame((state) => state.result);
  const finishRolling = useDiceGame((state) => state.finishRolling);

  // 각 주사위별 독립적인 rotation 상태
  const [rotation1, setRotation1] = useState({ x: 0, y: 0, z: 0 });
  const [rotation2, setRotation2] = useState({ x: 0, y: 0, z: 0 });

  // 위치 변화 상태 (튕겨나가는 효과)
  const [position1, setPosition1] = useState({ x: 0, y: 0 });
  const [position2, setPosition2] = useState({ x: 0, y: 0 });

  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const randomRotation1Ref = useRef({ x: 0, y: 0, z: 0 });
  const randomRotation2Ref = useRef({ x: 0, y: 0, z: 0 });

  const isRolling = phase === 'rolling';
  const shouldShowResult = phase === 'stopped' && result && result.dice1;

  // rolling 시작 시 각 주사위마다 다른 랜덤 회전값 생성
  useEffect(() => {
    if (isRolling) {
      randomRotation1Ref.current = {
        x: Math.random() * 720,
        y: Math.random() * 720,
        z: Math.random() * 720,
      };
      randomRotation2Ref.current = {
        x: Math.random() * 720,
        y: Math.random() * 720,
        z: Math.random() * 720,
      };
      timeRef.current = 0;
    }
  }, [isRolling]);

  // 주사위 1 목표값
  const targetRotation1X = isRolling
    ? randomRotation1Ref.current.x
    : faceToRotationX[result?.dice1 || 1];
  const targetRotation1Y = isRolling
    ? randomRotation1Ref.current.y
    : faceToRotationY[result?.dice1 || 1];
  const targetRotation1Z = isRolling
    ? randomRotation1Ref.current.z
    : faceToRotationZ[result?.dice1 || 1];

  // 주사위 2 목표값
  const targetRotation2X = isRolling
    ? randomRotation2Ref.current.x
    : faceToRotationX[result?.dice2 || 1];
  const targetRotation2Y = isRolling
    ? randomRotation2Ref.current.y
    : faceToRotationY[result?.dice2 || 1];
  const targetRotation2Z = isRolling
    ? randomRotation2Ref.current.z
    : faceToRotationZ[result?.dice2 || 1];

  // rolling 상태 시작/종료 관리
  useEffect(() => {
    if (phase !== 'rolling') return;

    const duration = 3500 + Math.random() * 1000;
    const timer = setTimeout(() => {
      finishRolling();
    }, duration);

    return () => clearTimeout(timer);
  }, [phase, finishRolling]);

  // Animation loop: 각 주사위 독립적 회전 + 위치 변화
  useEffect(() => {
    const animate = () => {
      // 주사위 1: 독립적인 회전
      // 주사위 1
setRotation1((prev) => {
  if (isRolling) {
    // 경과 시간 비율 (0 → 1)
    const elapsed = Math.min(timeRef.current / (3500 / 16.7), 1);
    // 초반 빠름 → 후반 느림: easeOutCubic 감속
    const decay = Math.pow(1 - elapsed, 2);           // 1.0 → 0.0 으로 감소
    const speed1 = 3.5 * decay + 0.15;               // 최소 0.15 유지 (완전 정지 방지)
    return {
      x: prev.x + speed1 * 6.2,
      y: prev.y + speed1 * 8.1,
      z: prev.z + speed1 * 5.3,
    };
  } else if (phase === 'stopped') {
    const lerpSpeed = 0.08;
    return {
      x: prev.x + (targetRotation1X - prev.x) * lerpSpeed,
      y: prev.y + (targetRotation1Y - prev.y) * lerpSpeed,
      z: prev.z + (targetRotation1Z - prev.z) * lerpSpeed,
    };
  }
  return prev;
});

      // 주사위 2: 다른 회전 속도
      setRotation2((prev) => {
  if (isRolling) {
    const elapsed = Math.min(timeRef.current / (3500 / 16.7), 1);
    const decay = Math.pow(1 - elapsed, 2);
    const speed2 = 3.5 * decay + 0.15;
    return {
      x: prev.x + speed2 * 5.9,
      y: prev.y + speed2 * 7.8,
      z: prev.z + speed2 * 5.7,
    };
  } else if (phase === 'stopped') {
    const lerpSpeed = 0.08;
    return {
      x: prev.x + (targetRotation2X - prev.x) * lerpSpeed,
      y: prev.y + (targetRotation2Y - prev.y) * lerpSpeed,
      z: prev.z + (targetRotation2Z - prev.z) * lerpSpeed,
    };
  }
  return prev;
});

      // 위치 변화: rolling 중에만
      setPosition1((prev) => {
        if (isRolling) {
          const durationMs = 3500 + Math.random() * 1000;
          const timeElapsed = timeRef.current * 0.016;
          const decayFactor = Math.max(1 - timeElapsed / (durationMs * 0.001), 0);
          const wobbleX = Math.sin(timeRef.current * 0.08) * 15 * decayFactor;
          const wobbleY = Math.cos(timeRef.current * 0.06) * 10 * decayFactor;
          return { x: wobbleX, y: wobbleY };
        }
        return { x: 0, y: 0 };
      });

      setPosition2((prev) => {
        if (isRolling) {
          const durationMs = 3500 + Math.random() * 1000;
          const timeElapsed = timeRef.current * 0.016;
          const decayFactor = Math.max(1 - timeElapsed / (durationMs * 0.001), 0);
          const wobbleX = Math.sin(timeRef.current * 0.08 + Math.PI) * 15 * decayFactor;
          const wobbleY = Math.cos(timeRef.current * 0.06 + Math.PI) * 10 * decayFactor;
          return { x: wobbleX, y: wobbleY };
        }
        return { x: 0, y: 0 };
      });

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, isRolling, targetRotation1X, targetRotation1Y, targetRotation1Z, targetRotation2X, targetRotation2Y, targetRotation2Z]);

  // 주사위 면 컴포넌트
  const DiceFace = ({ number, transform }) => {
    const pipPositions = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const pipSize = 16;
    const pipRadius = 8;
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

    const active = pipPositions[number] || [];

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* 베이스 면 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            background: 'linear-gradient(145deg, #ffffff, #e5e7eb)',
            border: '1px solid rgba(0,0,0,0.15)',
            boxShadow:
              'inset 0 2px 10px rgba(255,255,255,0.7), inset 0 -10px 18px rgba(0,0,0,0.12)',
          }}
        />

        {/* 하이라이트 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            background:
              'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0) 55%)',
            pointerEvents: 'none',
          }}
        />

        {/* 비네팅 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            background:
              'radial-gradient(circle at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.15) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* 점(pip) */}
        {active.map((idx) => {
          const c = coordsPct[idx];
          return (
            <span
              key={idx}
              style={{
                position: 'absolute',
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: pipSize,
                height: pipSize,
                marginLeft: -pipRadius,
                marginTop: -pipRadius,
                borderRadius: 999,
                background: 'radial-gradient(circle at 35% 35%, #111827, #030712)',
                boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.15)',
              }}
            />
          );
        })}
      </div>
    );
  };

  const cubeSize = 150;
  const half = cubeSize / 2;

  const diceStyle = {
    width: cubeSize,
    height: cubeSize,
    position: 'relative',
    perspective: 900,
    WebkitPerspective: 900,
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
  };

  const cubeTransform1 = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
    transform: `translateZ(0) rotateX(${rotation1.x}deg) rotateY(${rotation1.y}deg) rotateZ(${rotation1.z}deg)`,
    transitionProperty: 'none',
    willChange: 'transform',
  };

  const cubeTransform2 = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
    transform: `translateZ(0) rotateX(${rotation2.x}deg) rotateY(${rotation2.y}deg) rotateZ(${rotation2.z}deg)`,
    transitionProperty: 'none',
    willChange: 'transform',
  };

  return (
    <div
      className="flex flex-col justify-start items-center w-full h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-700/30 relative overflow-hidden"
      style={{
        perspective: mode === 2 ? '1500px' : '1200px',
        WebkitPerspective: mode === 2 ? '1500px' : '1200px',
      }}
    >
      {/* 결과값 - 컨테이너 내부 상단 */}
      {shouldShowResult && (
        <motion.div
          className="pt-8 text-center z-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-gray-500 text-sm mb-1">결과</p>
          {mode === 1 ? (
            <motion.p
              className="text-7xl font-black text-yellow-300"
              style={{
                textShadow: '0 0 20px rgba(253, 224, 71, 0.8), 0 0 40px rgba(253, 224, 71, 0.4)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {result.dice1}
            </motion.p>
          ) : (
            <div className="flex items-end justify-center gap-3">
              <motion.p
                className="text-6xl font-black text-yellow-300"
                style={{
                  textShadow: '0 0 20px rgba(253, 224, 71, 0.8), 0 0 40px rgba(253, 224, 71, 0.4)',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {result.dice1}
              </motion.p>
              <p className="text-2xl text-gray-500 mb-1">+</p>
              <motion.p
                className="text-6xl font-black text-yellow-300"
                style={{
                  textShadow: '0 0 20px rgba(253, 224, 71, 0.8), 0 0 40px rgba(253, 224, 71, 0.4)',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {result.dice2}
              </motion.p>
              <p className="text-2xl text-gray-500 mb-1">=</p>
              <motion.p
                className="text-7xl font-black text-green-400"
                style={{
                  textShadow: '0 0 20px rgba(74, 222, 128, 0.8), 0 0 40px rgba(74, 222, 128, 0.4)',
                }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {result.sum}
              </motion.p>
            </div>
          )}
        </motion.div>
      )}

      {/* 주사위 영역 - flex-1로 나머지 공간 차지 */}
      <div className="flex-1 flex items-center justify-center w-full">
        {/* 바닥 그림자 */}
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-16 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.5), rgba(0,0,0,0))',
            filter: 'blur(12px)',
            zIndex: 0,
          }}
        />

        {/* Glow animation */}
        {isRolling && (
          <div
            className="absolute inset-0 rounded-2xl opacity-60 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.4), rgba(59, 130, 246, 0.1))',
              animation: 'pulse 0.5s ease-in-out infinite',
            }}
          />
        )}

        {/* 1개 모드 */}
        {mode === 1 && (
          <div
            style={{
              ...diceStyle,
              transform: `translate(${position1.x}px, ${position1.y}px)`,
            }}
            className="relative z-10"
          >
            <div style={cubeTransform1}>
              <DiceFace number={1} transform={`translateZ(${half}px)`} />
              <DiceFace number={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
              <DiceFace number={2} transform={`rotateX(90deg) translateZ(${half}px)`} />
              <DiceFace number={5} transform={`rotateX(-90deg) translateZ(${half}px)`} />
              <DiceFace number={3} transform={`rotateY(90deg) translateZ(${half}px)`} />
              <DiceFace number={4} transform={`rotateY(-90deg) translateZ(${half}px)`} />
            </div>
          </div>
        )}

        {/* 2개 모드 - 3D 배치 강화 */}
        {mode === 2 && (
          <div
            className="flex gap-16 relative z-10"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: 'rotateX(-15deg) rotateZ(5deg)',
            }}
          >
            {/* 왼쪽 주사위 */}
            <div
              style={{
                ...diceStyle,
                transform: `translate(${position1.x}px, ${position1.y}px) translateZ(20px) rotateY(10deg)`,
              }}
            >
              <div style={cubeTransform1}>
                <DiceFace number={1} transform={`translateZ(${half}px)`} />
                <DiceFace number={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
                <DiceFace number={2} transform={`rotateX(90deg) translateZ(${half}px)`} />
                <DiceFace number={5} transform={`rotateX(-90deg) translateZ(${half}px)`} />
                <DiceFace number={3} transform={`rotateY(90deg) translateZ(${half}px)`} />
                <DiceFace number={4} transform={`rotateY(-90deg) translateZ(${half}px)`} />
              </div>
            </div>

            {/* 오른쪽 주사위 */}
            <div
              style={{
                ...diceStyle,
                transform: `translate(${position2.x}px, ${position2.y}px) translateZ(-20px) rotateY(-10deg)`,
              }}
            >
              <div style={cubeTransform2}>
                <DiceFace number={1} transform={`translateZ(${half}px)`} />
                <DiceFace number={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
                <DiceFace number={2} transform={`rotateX(90deg) translateZ(${half}px)`} />
                <DiceFace number={5} transform={`rotateX(-90deg) translateZ(${half}px)`} />
                <DiceFace number={3} transform={`rotateY(90deg) translateZ(${half}px)`} />
                <DiceFace number={4} transform={`rotateY(-90deg) translateZ(${half}px)`} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}