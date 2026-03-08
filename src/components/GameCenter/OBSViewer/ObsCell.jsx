// src/components/GameCenter/OBSViewer/ObsCell.jsx
// 이미지 교체 시 이전 이미지를 잠깐 유지하다가 새 이미지로 페이드 전환
import React, { useState, useEffect, useRef } from "react";

export default function ObsCell({ cellId, imageUrl, title }) {
  const [displayUrl, setDisplayUrl] = useState(imageUrl);  // 현재 화면에 보이는 URL
  const [nextUrl, setNextUrl] = useState(null);            // 로딩 중인 새 URL
  const [isLoading, setIsLoading] = useState(false);       // 새 이미지 로딩 중 여부
  const [nextVisible, setNextVisible] = useState(false);   // 새 이미지 페이드인 트리거

  const prevUrlRef = useRef(imageUrl);

  useEffect(() => {
    // imageUrl이 바뀌지 않았으면 아무 것도 안 함
    if (imageUrl === prevUrlRef.current) return;
    prevUrlRef.current = imageUrl;

    if (!imageUrl) {
      setDisplayUrl(null);
      setNextUrl(null);
      return;
    }

    // 새 이미지 로딩 시작
    setNextUrl(imageUrl);
    setIsLoading(true);
    setNextVisible(false);

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // 새 이미지 로딩 완료 → 페이드인
      setIsLoading(false);
      setNextVisible(true);

      // 페이드 완료 후 이전 이미지 교체 (transition 0.35s 끝난 후)
      setTimeout(() => {
        setDisplayUrl(imageUrl);
        setNextUrl(null);
        setNextVisible(false);
      }, 380);
    };

    img.onerror = () => {
      // 로딩 실패 시 그냥 URL 교체
      setIsLoading(false);
      setDisplayUrl(imageUrl);
      setNextUrl(null);
    };
  }, [imageUrl]);

  return (
    <div className="obs-cell">
      {/* 빈 칸 */}
      {!displayUrl && !nextUrl && (
        <span className="obs-cell-empty">{cellId}</span>
      )}

      {/* 이미지 페이드 래퍼 */}
      {(displayUrl || nextUrl) && (
        <div className="obs-cell-img-wrapper">
          {/* 이전 이미지 (다음 이미지가 페이드인 되는 동안 유지) */}
          {displayUrl && (
            <img
              className="prev-img"
              src={displayUrl}
              alt={title || cellId}
              style={{
                // 새 이미지가 완전히 떴으면 이전 이미지 숨기기
                opacity: nextVisible ? 0 : 1,
                transition: "opacity 0.35s ease",
              }}
            />
          )}

          {/* 새 이미지 (로딩 완료 후 페이드인) */}
          {nextUrl && (
            <img
              className={`next-img${nextVisible ? " visible" : ""}`}
              src={nextUrl}
              alt={title || cellId}
            />
          )}
        </div>
      )}

      {/* 새 이미지 로딩 중 스피너 */}
      {isLoading && (
        <div className="obs-cell-spinner">
          <div className="obs-spinner" />
        </div>
      )}
    </div>
  );
}