// src/components/SigHunterFlip/SigHunterFlip.jsx
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  queendomSigCards,
  museSigCards,
  holicSigCards,
  normalMessages as defaultNormalMessages,
  specialMessages as defaultSpecialMessages,
} from "../../../../shared/data";
import { useSigStorage } from "../../../../shared/hooks";
import {
  fireConfetti,
  weightedPick, // ← 메시지 선택(가중치 기반)
} from "../../../../components/common/confettiUtils";
import { fetchRandomSigItems } from "../../../../resources/api";
import CardGrid from "./CardGrid";
import EditMessageModal from "./EditMessageModal";
import AdminPopup from "./AdminPopup";
import "../styles/flip.css";

// ✅ 프로젝트 키에 따라 카드 세트를 매핑
const projectCardSets = {
  queendom: queendomSigCards,
  muse: museSigCards,
  holic: holicSigCards,
};

export default function SigHunterFlip() {
  // ✅ 현재 선택된 프로젝트(퀸덤/뮤즈/홀릭)
  const [project, setProject] = useState("queendom");
  const sigCards = projectCardSets[project]; // 선택된 프로젝트의 전체 카드 리스트

  // ✅ 일반 카드(특수 카드 제외)
  const normalCards = useMemo(
    () => sigCards.filter((c) => !c.isSpecial),
    [sigCards]
  );

  // ✅ 스페셜 카드(특수 1장 가정)
   const specialCard = useMemo(
    () => sigCards.find((c) => c.isSpecial),
    [sigCards]
  );

   

  // ✅ 슬롯(card.id)별로 랜덤으로 로딩된 시그 아이템(이미지/메타를 fetch)
  const [sigItemsByCard, setSigItemsByCard] = useState({});
  const [loadingSigItems, setLoadingSigItems] = useState(false);

  // ✅ 카드별 앞면 이미지 인덱스(여러 장이면 랜덤으로 하나 선택)
  const [frontImageIndexByCard, setFrontImageIndexByCard] = useState({});

  // ✅ 파일 업로드 input ref를 card id별로 관리하기 위한 컨테이너
  const fileInputRefs = useRef({});

  // ✅ 공용 상태(뒤집힘/잠금/노출/로딩 이미지/메시지/확률 가중치 등)를 전역처럼 관리
  const {
    flipped,
    locked,
    revealed,
    randomImages,
    messagesByProject,
    cardWeights,
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setCardWeights,
    setMessagesByProject,
    loaded,
  } = useSigStorage();

   // ✅ 현재 프로젝트의 메시지 세트 (없으면 공통 기본값 사용)
  const currentMessages =
    messagesByProject?.[project] ?? {
      normal: defaultNormalMessages,
      special: defaultSpecialMessages,
    };

  // ✅ 모달(어드민/에디트) 상태: { type: "admin" | "edit", id: cardId }
  const [modal, setModal] = useState(null);

  // 🔢 번호로 칸 지정해서 뒤집기용 입력 값
  const [targetCardId, setTargetCardId] = useState("");

  // 🔧 단축키를 눌렀을 때 “마지막으로 액션한 카드 ID”를 기억하기 위한 상태
  const [lastActiveCardId, setLastActiveCardId] = useState(1);

  // ⌨️ “칸 번호 input”에 포커스 주기 위한 ref
  const cardNumberInputRef = useRef(null);

  // --------------------------------------------
  // ✅ front image 랜덤 재선택 유틸
  // --------------------------------------------
  const reshuffleFrontImages = (cards) => {
    // 상태를 prev 기반으로 업데이트
    setFrontImageIndexByCard((prev) => {
      const next = { ...prev };

      cards.forEach((card) => {
        // frontImages가 배열이고 길이가 있으면 그 중 랜덤 인덱스 선택
        const len = Array.isArray(card.frontImages)
          ? card.frontImages.length
          : 0;

        if (len > 0) {
          const idx = Math.floor(Math.random() * len);
          next[card.id] = idx;
        } else {
          // frontImages가 없으면 해당 cardId의 인덱스 제거
          delete next[card.id];
        }
      });

      return next;
    });
  };

  // --------------------------------------------
  // ✅ 슬롯별 랜덤 시그 아이템 로딩 (일반/스페셜 분기)
  // --------------------------------------------
  const loadSigItems = async (projectKey, normalCardsArg, specialCardArg) => {
    try {
      setLoadingSigItems(true);

      const mode = projectKey; // API 파라미터에 mode로 사용

      // card.id => item(또는 null) 매핑
      const mapping = {};

      // 일반 카드: 각 카드 슬롯에 대해 병렬 요청
      const normalPromises = normalCardsArg.map(async (card) => {
        const items = await fetchRandomSigItems({
          mode,
          type: "sighunter",
          rarity: "normal",
          slotIndex: String(card.id),
          count: 1,
        });

        // 응답 배열에서 0번 아이템 하나만 저장
        mapping[card.id] = items[0] || null;
      });

      const allPromises = [...normalPromises];

      // 스페셜 카드: 하나만 추가 요청
      if (specialCardArg) {
        const specialPromise = (async () => {
          const items = await fetchRandomSigItems({
            mode,
            type: "sighunter",
            rarity: "special",
            slotIndex: String(specialCardArg.id),
            count: 1,
          });

          mapping[specialCardArg.id] = items[0] || null;
        })();

        allPromises.push(specialPromise);
      }

      // 모든 요청 완료까지 기다린 후 결과 반영
      await Promise.all(allPromises);

      setSigItemsByCard(mapping);
    } catch (e) {
      console.error("시그헌터 카드 메타데이터 로딩 실패:", e);
    } finally {
      setLoadingSigItems(false);
    }
  };

  // --------------------------------------------
  // ✅ 보드 재로드 헬퍼:
  // - 카드별 메타/이미지 로딩
  // - front 이미지 인덱스도 다시 섞기
  // --------------------------------------------
  const reloadBoardSigItems = async () => {
    await loadSigItems(project, normalCards, specialCard);
    reshuffleFrontImages(sigCards);
  };

  // --------------------------------------------
  // ✅ 초기 로딩/프로젝트 변경 시 이미지·메타 로딩
  // --------------------------------------------
  useEffect(() => {
    if (!loaded) return; // 스토리지 로딩 완료 전엔 실행하지 않음

    reshuffleFrontImages(sigCards); // front 이미지 랜덤 선택

    loadSigItems(project, normalCards, specialCard); // 시그 아이템 로딩
  }, [project, loaded, sigCards, normalCards, specialCard]);

  // --------------------------------------------
  // ✅ 전역 단축키
  // - Esc: 모달 닫기
  // - Alt+Shift+A: 마지막 카드 기준 AdminPopup 토글
  // - Alt+Shift+F: 칸 번호 입력창 포커스(+선택)
  // --------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Esc로 모달 닫기
      if (e.key === "Escape" || e.code === "Escape") {
        if (modal) {
          e.preventDefault();
          setModal(null);
        }
        return;
      }

      // AdminPopup 토글
      if (e.altKey && e.shiftKey && e.code === "KeyA") {
        e.preventDefault();

        setModal((prev) => {
          // 이미 admin 모달이면 닫기
          if (prev && prev.type === "admin") {
            return null;
          }
          // 아니면 마지막 카드 기준으로 열기
          return { type: "admin", id: lastActiveCardId || 1 };
        });
        return;
      }

      // 칸 번호 입력창 포커스
      if (e.altKey && e.shiftKey && e.code === "KeyF") {
        e.preventDefault();
        if (cardNumberInputRef.current) {
          cardNumberInputRef.current.focus();
          cardNumberInputRef.current.select?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lastActiveCardId, modal]);

  // --------------------------------------------
  // ✅ 로딩 중이면 간단한 UI 반환
  // --------------------------------------------
  if (!loaded) {
    return (
      <div className="natural-container">
        <h2>💖 시그헌터 💖</h2>
        <p>상태 불러오는 중...</p>
      </div>
    );
  }

  // --------------------------------------------
  // ✅ 카드 뒤집기 이벤트 핸들러
  // --------------------------------------------
  const handleFlip = (card, e) => {
    const target = e.target;

    // 파일 업로드 input 클릭이면 뒤집기 방지
    if (target.tagName === "INPUT" && target.type === "file") {
      return;
    }

    // 버튼(업로드/관리/메시지 수정)을 눌렀다면 뒤집기 방지
    if (
      target.closest?.(".upload-btn") ||
      target.closest?.(".admin-btn") ||
      target.closest?.(".edit-msg-btn")
    ) {
      return;
    }

    const key = String(card.id);
    const currentlyFlipped = !!flipped[card.id]; // 현재 뒤집힘 여부
    const next = !currentlyFlipped; // 다음 상태(뒤집기 토글)

    // 해당 카드가 이미 reveal 되었고, 그 reveal이 “edited” 상태인지 확인
    const currentMsg = revealed[card.id];

    // 아직 뒤집히지 않았고(next=true) + edited가 아니면
    // confetti 메시지를 랜덤 pick해서 reveal 상태 세팅
    if (!currentlyFlipped && next && !(currentMsg && currentMsg.edited)) {
       const base = card.isSpecial
        ? currentMessages.special
        : currentMessages.normal;

      // 카드별 가중치가 저장돼 있으면 그것을 사용
      const all = cardWeights || {};
      const stored = all[key];

      const weights =
        Array.isArray(stored) && stored.length === base.length
          ? stored
          : base.map((m) => m.weight ?? 1);

      // 가중치 기반 메시지 선택
      const msg = weightedPick(base, weights);

      // 이펙트 출력
      fireConfetti(msg.text);

      // reveal 상태 갱신
      setRevealed((p) => ({ ...p, [card.id]: msg }));
    }

    // 뒤집힘 상태 갱신 + 마지막 액션 카드 업데이트
    setFlipped((prev) => ({ ...prev, [card.id]: next }));
    setLastActiveCardId(card.id);
  };

  // --------------------------------------------
  // ✅ AdminPopup 열기
  // --------------------------------------------
  const handleAdminClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "admin", id: cardId });
    setLastActiveCardId(cardId);
  };

  // --------------------------------------------
  // ✅ EditMessageModal 열기
  // --------------------------------------------
  const handleEditClick = (e, cardId) => {
    e.stopPropagation();
    e.preventDefault();
    setModal({ type: "edit", id: cardId });
    setLastActiveCardId(cardId);
  };

  // --------------------------------------------
  // ✅ 업로드 파일 선택 버튼 클릭 시 input 클릭 트리거
  // --------------------------------------------
  const handleUploadClick = (e, id) => {
    e.stopPropagation();
    const input = fileInputRefs.current[id];
    if (!input) return;

    input.click();
    setLastActiveCardId(id);
  };

  // --------------------------------------------
  // ✅ 이미지 파일 업로드 완료 후
  // - randomImages에 업로드 URL 저장
  // - 해당 카드 flipped/locked 상태 초기화
  // - 보드 메타/프론트 랜덤 재로딩
  // --------------------------------------------
  const handleImageChange = async (e, id) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev && ev.target && ev.target.result;

      setRandomImages((p) => ({ ...p, [id]: url }));
      setFlipped((p) => ({ ...p, [id]: false }));
      setLocked((p) => ({ ...p, [id]: false }));

      await reloadBoardSigItems();
    };

    reader.readAsDataURL(file);
  };

  // --------------------------------------------
  // ✅ 특정 카드 리스트를 전부 리셋(상태 제거)
  // - randomImages, revealed, flipped, locked 제거
  // - cardWeights는 해당 카드의 base weight으로 되돌림
  // --------------------------------------------
  const resetCards = (cards) => {
    setRandomImages((prevImgs) => {
      const nextImgs = { ...prevImgs };
      cards.forEach((c) => {
        delete nextImgs[c.id];
      });
      return nextImgs;
    });

    setRevealed((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    setFlipped((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    setLocked((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    // 가중치도 원복: 메시지 base length 기준 weight 세팅
    setCardWeights((prev) => {
      const next = { ...prev };
      cards.forEach((card) => {
        const key = String(card.id);
          const base = card.isSpecial
         ? currentMessages.special
         : currentMessages.normal;
        next[key] = base.map((m) => m.weight ?? 1);
      });

      localStorage.setItem("cardWeights", JSON.stringify(next));
      return next;
    });
  };

  // --------------------------------------------
  // ✅ 전체 초기화:
  // - localStorage에서 관련 키 제거
  // - 상태 기본값 세팅
  // - 보드 시그 아이템 재로딩
  // --------------------------------------------
  const resetAll = async () => {
    [
      "sigFlipped",
      "sigLocked",
      "sigRevealed",
      "sigImages",
      "cardWeights",
    ].forEach((key) => localStorage.removeItem(key));

    setRandomImages({});

    resetCards(sigCards); // 전체 카드 리셋
    reshuffleFrontImages(sigCards); // front 이미지 섞기

    await loadSigItems(project, normalCards, specialCard); // 시그 아이템 재로딩
  };

  // --------------------------------------------
  // ✅ 일반 카드만 초기화
  // --------------------------------------------
  const resetNormal = async () => {
    // 일반 카드 randomImages만 제거
    setRandomImages((prev) => {
      const next = { ...prev };
      normalCards.forEach((c) => {
        delete next[c.id];
      });
      return next;
    });

    resetCards(normalCards); // 일반 카드 상태 리셋
    reshuffleFrontImages(normalCards); // 일반 카드 front 랜덤 섞기

    await loadSigItems(project, normalCards, specialCard); // 시그 아이템 재로딩
  };

  // --------------------------------------------
  // ✅ 스페셜 카드만 초기화
  // --------------------------------------------
  const resetSpecial = async () => {
    if (!specialCard) return;

    // 스페셜 카드 randomImages 제거
    setRandomImages((prev) => {
      const next = { ...prev };
      delete next[specialCard.id];
      return next;
    });

    resetCards([specialCard]); // 스페셜 카드 상태 리셋
    reshuffleFrontImages([specialCard]); // 스페셜 front 랜덤 섞기

    await loadSigItems(project, normalCards, specialCard); // 시그 아이템 재로딩
  };

  // --------------------------------------------
  // ✅ 입력한 번호(id)로 카드 찾아서 뒤집기
  // - normal 카드 또는 special 카드에서 검색
  // - handleFlip에 event 비슷한 객체를 만들어 전달
  // --------------------------------------------
  const flipCardById = (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;

    const card =
      normalCards.find((c) => c.id === numId) ||
      (specialCard && specialCard.id === numId ? specialCard : null);

    if (!card) return;

    // handleFlip은 e.target.closest 등을 사용하므로, 최소한 tagName만 맞춘 fakeEvent 제공
    const fakeEvent = {
      target: { tagName: "DIV" },
    };

    handleFlip(card, fakeEvent);
  };

  // --------------------------------------------
  // ✅ UI 렌더링 시작
  // --------------------------------------------
  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>

      {/* 프로젝트 탭 + 단축키 안내 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          margin: "0 auto 12px auto",
          flexWrap: "wrap",
        }}
      >
        {/* ✅ 프로젝트 탭 버튼들 */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["queendom", "muse", "holic"].map((key) => {
            const labelMap = { queendom: "퀸덤", muse: "뮤즈", holic: "홀릭" };
            const isActive = project === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  // 프로젝트 변경 시 카드 가중치/상태 유지 전략상,
                  // 최소한 카드들의 reveal/flip 등은 resetCards로 정리
                  setProject(key);
                  resetCards(sigCards);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: isActive ? "2px solid #ffe4f0" : "1px solid #888",
                  background: isActive
                    ? "linear-gradient(135deg, #ff7eb3, #ffb6c1)"
                    : "linear-gradient(135deg, #444, #222)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "14px",
                  minWidth: "70px",
                  fontFamily: "Cafe24ClassicType",
                  fontWeight: 600,
                  boxShadow: isActive
                    ? "0 0 8px rgba(255, 126, 179, 0.7)"
                    : "0 0 4px rgba(0, 0, 0, 0.4)",
                  transition: "all 0.15s ease-in-out",
                }}
              >
                {labelMap[key]}
              </button>
            );
          })}
        </div>

        {/* 🔹 단축키 안내 */}
        <span
          style={{
            fontSize: 16,
            color: "#4b5563",
            lineHeight: 1.4,
            textAlign: "left",
          }}
        >
          *Alt+Shift+A → 확률조절
          <br />
          *Alt+Shift+F → 칸 번호
        </span>
      </div>

      {/* 🔄 초기화 + 뒤집기 줄 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "8px",
          alignItems: "center",
        }}
      >
        <button className="reset-btn" onClick={resetAll}>
          🔄 전체 초기화
        </button>

        <button className="reset-btn" onClick={resetNormal}>
          🔄 일반 카드만 초기화
        </button>

        {specialCard && (
          <button className="reset-btn" onClick={resetSpecial}>
            🔄 스페셜 카드만 초기화
          </button>
        )}

        {/* 🔢 칸 번호 입력 + 뒤집기 버튼 */}
        <div
          className="card-number-wrapper"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {/* hover 시 위로 올라가는 라벨 */}
          <span
            className="card-number-label"
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "14px",
              background: "white",
              padding: "0 4px",
              borderRadius: "4px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            칸 번호
          </span>

          {/* 입력창: 라인의 위쪽에 절대 위치로 배치 */}
          <input
            type="number"
            min="1"
            max={sigCards.length}
            value={targetCardId}
            onChange={(e) => setTargetCardId(e.target.value)}
            placeholder="칸 번호"
            className="card-number-input"
            ref={cardNumberInputRef}
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%) translateY(-6px)",
              width: "90px",
              padding: "6px 1px",
              borderRadius: "6px",
              border: "1px solid #aaa",
              fontSize: "20px",
              textAlign: "center",
              background: "#fff",
            }}
            onKeyDown={(e) => {
              // Enter 치면 입력값 기준으로 카드 뒤집기
              if (e.key === "Enter") {
                flipCardById(targetCardId);
              }
            }}
          />

          {/* 입력 라인 기준점이 되는 뒤집기 버튼 */}
          <button
            type="button"
            className="reset-btn"
            onClick={() => flipCardById(targetCardId)}
            style={{ whiteSpace: "nowrap" }}
          >
            🎴 뒤집기
          </button>
        </div>
      </div>

      {/* ✅ 시그 아이템 로딩 중 표시 */}
      {loadingSigItems && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#ddd" }}>
          시그 카드 정보를 불러오는 중입니다...
        </p>
      )}

      {/* ✅ 카드 그리드 렌더링 */}
      <div className="cards-wrapper">
        <CardGrid
          cards={normalCards}
          flipped={flipped}
          locked={locked}
          revealed={revealed}
          randomImages={randomImages}
          sigItemsByCard={sigItemsByCard}
          frontImageIndexByCard={frontImageIndexByCard}
          onFlip={handleFlip}
          onAdmin={handleAdminClick}
          onEdit={handleEditClick}
          onUploadClick={handleUploadClick}
          onImageChange={handleImageChange}
          fileInputRefs={fileInputRefs}
        />

        {/* ✅ 스페셜 카드가 있으면 별도 컨테이너로 렌더 */}
        {specialCard && (
          <div className="special-card-container">
            <CardGrid
              cards={[specialCard]}
              flipped={flipped}
              locked={locked}
              revealed={revealed}
              randomImages={randomImages}
              sigItemsByCard={sigItemsByCard}
              frontImageIndexByCard={frontImageIndexByCard}
              onFlip={handleFlip}
              onAdmin={handleAdminClick}
              onEdit={handleEditClick}
              onUploadClick={handleUploadClick}
              onImageChange={handleImageChange}
              fileInputRefs={fileInputRefs}
            />
          </div>
        )}
      </div>

      {/* ✅ 메시지 편집 모달 */}
      {modal && modal.type === "edit" && (
        <EditMessageModal
          project={project}
          cardId={modal.id}
          initialMsg={revealed[modal.id]}
          onClose={() => setModal(null)}
          onUpdate={(newMsg) => {
            // 편집 결과 저장 후 해당 카드 잠금 해제(새 reveal을 위해)
            setRevealed((prev) => ({ ...prev, [modal.id]: newMsg }));
            setLocked((prev) => ({ ...prev, [modal.id]: false }));
          }}
        />
      )}

      {/* ✅ 관리자(확률 조절) 모달 */}
      {modal && modal.type === "admin" && modal.id != null && (
        <AdminPopup
          project={project}
          cardId={modal.id}
          messages={messagesByProject}
          onClose={() => setModal(null)}
          onUpdate={(
            weights,
            id,
            payload,
            allWeightsFromPopup
          ) => {
            const key = String(id);
             const {
              project: projectKey,
              messagesForThisProject,
              allWeightsForThisProject,
            } = payload || {};
             // 1) 카드 가중치 업데이트
            setCardWeights((prev) => {
              const next =
                allWeightsForThisProject ??
                allWeightsFromPopup ??
                { ...prev, [key]: weights };

              localStorage.setItem("cardWeights", JSON.stringify(next));
              return next;
            });

             // 2) messagesByProject 업데이트 (이 프로젝트 블록만 교체)
            if (projectKey && messagesForThisProject) {
              setMessagesByProject((prev) => ({
                ...prev,
                [projectKey]: messagesForThisProject,
              }));
            }
          }}
        />
      )}
    </div>
  );
}