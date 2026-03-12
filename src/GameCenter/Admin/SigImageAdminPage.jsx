// React 및 필요한 훅(useState, useEffect, useCallback) 임포트
import React, { useState, useEffect, useCallback } from "react";
// 시그 이미지 관련 API 함수들 임포트 (업로드/조회/수정/삭제)
import {
  uploadSigItem,
  fetchSigItems,
  updateSigItem,
  deleteSigItem,
} from "../../api/sigHunterImageLibraryApi";

// 게임 타입 옵션 정의 (셀렉트 박스용)
const GAME_TYPES = [
  { value: "meal-bingo", label: "식대전 빙고" },
  { value: "sighunter-bingo", label: "시그헌터 빙고" },
  { value: "sighunter", label: "시그헌터 (카드)" },
];

// 모드 옵션 (뮤즈 / 퀸덤)
const MODES = [
  { value: "muse", label: "뮤즈" },
  { value: "queendom", label: "퀸덤" },
];

// 카드 희귀도 옵션
const RARITIES = [
  { value: "normal", label: "일반 카드" },
  { value: "special", label: "스페셜 카드" },
];

// 식대전 빙고판 번호 옵션
const MEAL_BINGO_BOARDS = [
  { value: "1", label: "1판" },
  { value: "2", label: "2판" },
  { value: "3", label: "3판" },
];

// 시그 이미지 어드민 페이지 컴포넌트
export default function SigImageAdminPage() {
  // 업로드 폼: 카드 이름
  const [title, setTitle] = useState("");
  // 업로드 폼: 카드 점수
  const [score, setScore] = useState("");
  // 업로드 폼: 모드 (뮤즈/퀸덤) - 기본 퀸덤
  const [mode, setMode] = useState("queendom"); // 게임 페이지랑 맞추기
  // 업로드 폼: 게임 타입 - 기본 시그헌터 (카드)
  const [type, setType] = useState("sighunter"); // 시그헌터 (카드)로 기본
  // 업로드 폼: 카드 희귀도 - 기본 일반
  const [rarity, setRarity] = useState("normal");
  // 업로드 폼: 활성 여부 (랜덤 뽑기 포함 여부)
  const [isActive, setIsActive] = useState(true);
  // 업로드 폼: 빙고 칸 번호 (필수 입력)
  const [slotIndex, setSlotIndex] = useState(""); // 칸 번호(필수)
  // 업로드 폼: 빙고판 번호 (식대전 전용)
  const [boardIndex, setBoardIndex] = useState("1"); // 빙고판 번호(식대전 전용)

  // 업로드 폼: 선택한 파일 객체 (이미지)
  const [file, setFile] = useState(null);

  // 업로드 중 로딩 상태
  const [submitting, setSubmitting] = useState(false);
  // 상단에 표시할 성공 메시지 텍스트
  const [message, setMessage] = useState("");
  // 상단에 표시할 에러 메시지 텍스트
  const [error, setError] = useState("");
  // 업로드 전 미리보기용 blob URL
  const [previewUrl, setPreviewUrl] = useState("");

  // 테이블에 표시할 카드 목록
  const [items, setItems] = useState([]);
  // 목록 로딩 중 여부
  const [loadingList, setLoadingList] = useState(false);
  // 특정 행 저장 중일 때 그 행의 id
  const [savingRowId, setSavingRowId] = useState(null);
  // 특정 행 삭제 중일 때 그 행의 id
  const [deletingRowId, setDeletingRowId] = useState(null);

  // 방금 업로드된 항목을 하이라이트 하기 위한 id
  const [highlightId, setHighlightId] = useState(null); // ★ 추가: 방금 업로드한 항목 하이라이트용

  // 현재 type 이 식대전 빙고인지 여부 (조건부 UI 및 쿼리용)
  const isMealBingo = type === "meal-bingo";

  // message / error 가 변경되면 3초 뒤 자동으로 사라지도록 하는 효과
  useEffect(() => {
    // 메시지도 없고 에러도 없으면 아무 것도 안함
    if (!message && !error) return;
    // 3초 뒤에 message와 error를 초기화하는 타이머 설정
    const t = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    // 컴포넌트 언마운트 또는 message/error 변경 시 타이머 클리어
    return () => clearTimeout(t);
  }, [message, error]);

  // 현재 필터(게임 타입, 모드, 희귀도, 빙고판)에 따라 리스트를 불러오는 함수
  const loadList = useCallback(
    async (opts) => {
      // 기본 쿼리 파라미터
      const params = {
        mode,
        type,
        rarity,
        activeOnly: false, // 어드민에서는 비활성 포함해서 전체 조회
        ...(opts || {}),   // 추가 옵션이 있으면 덮어씀
      };

      // 식대전 빙고 타입이면 빙고판 번호 조건 추가
      if (type === "meal-bingo") {
        params.boardIndex = boardIndex || "1";
      }

      // 백엔드/파이어스토어에서 조건에 맞는 카드 목록 조회
      const list = await fetchSigItems(params);
      // 디버깅을 위한 콘솔 로그
      console.log("[ADMIN] fetchSigItems result", params, list);
      // 상태에 목록 반영
      setItems(list);
    },
    [mode, type, rarity, boardIndex]
  );

  // 컴포넌트 마운트 시(그리고 필터가 바뀔 때마다) 목록 로딩
  useEffect(() => {
    async function load() {
      try {
        setLoadingList(true);   // 목록 로딩 상태 on
        await loadList();       // 실제 목록 호출
      } catch (e) {
        console.error(e);
        setError("목록을 불러오는데 실패했습니다.");
      } finally {
        setLoadingList(false);  // 로딩 상태 off
      }
    }
    load();
  }, [loadList]);

  // 파일 인풋 변경 핸들러 (이미지 선택 시 호출)
  const handleFileChange = (e) => {
    // 첫 번째 선택된 파일 가져오기
    const f = e.target.files && e.target.files[0];
    // 상태에 파일 저장
    setFile(f || null);

    if (f) {
      // 브라우저의 임시 blob URL 생성하여 미리보기용으로 사용
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      // 파일이 없으면 미리보기 URL 초기화
      setPreviewUrl("");
    }
  };

  // 업로드 폼 submit 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 기본 폼 제출 이벤트 막기

    // 파일이 없으면 에러
    if (!file) {
      setError("이미지 파일을 선택하세요.");
      return;
    }

    // 칸 번호 필수
    if (!slotIndex) {
      setError("칸 번호를 입력해주세요.");
      return;
    }
    // 칸 번호 숫자 검증
    if (isNaN(Number(slotIndex))) {
      setError("칸 번호는 숫자로 입력해주세요.");
      return;
    }

    // 식대전 빙고일 때 빙고판 번호 필수
    if (isMealBingo && !boardIndex) {
      setError("빙고판 번호를 선택해주세요.");
      return;
    }

    try {
      setSubmitting(true); // 업로드 중 상태 on
      setError("");        // 이전 에러 초기화

      // 업로드 API 호출, 생성된 카드 정보 반환
      const created = await uploadSigItem({
        file,
        title,
        score,
        mode,
        type,
        rarity,
        isActive,
        slotIndex,
        boardIndex: isMealBingo ? boardIndex : null,
      });

      // 업로드 결과 디버깅 로그 (id, imageUrl 확인용)
      console.log("[ADMIN] created sig item", created); // ★ 추가: 업로드 결과 확인용
      // 방금 업로드한 항목의 id를 저장해 테이블에서 하이라이트
      setHighlightId(created.id); // ★ 추가: 방금 업로드된 항목 id 저장

      // 성공 메시지 표시
      setMessage("업로드 완료! 🎉");

      // 폼 값들 리셋 (필터 값은 유지)
      setTitle("");
      setScore("");
      setMode(mode);
      setType(type);
      setRarity(rarity);
      setIsActive(true);
      setSlotIndex("");
      // 식대전인데 boardIndex 가 비어 있으면 1판으로 세팅
      if (isMealBingo && !boardIndex) setBoardIndex("1");
      // 파일 및 미리보기 리셋
      setFile(null);
      setPreviewUrl("");

      // 업로드 후 현재 필터 조건으로 다시 목록 조회
      await loadList();
    } catch (err) {
      console.error(err);
      // err.message 가 있으면 사용, 없으면 기본 에러 문구
      setError(err.message || "업로드에 실패했습니다.");
    } finally {
      // 업로드 완료 후 로딩 상태 off
      setSubmitting(false);
    }
  };

  // 테이블의 인풋에서 값이 변경되었을 때, items 상태를 로컬에서 먼저 업데이트
  const handleChangeItemField = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // 활성/비활성 토글 버튼 클릭 시 로컬 상태에서 isActive 토글
  const handleToggleItemActive = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, isActive: !it.isActive } : it
      )
    );
  };

  // 각 행의 "저장" 버튼 클릭 시 서버에 해당 카드 정보 업데이트
  const handleSaveRow = async (item) => {
    try {
      setSavingRowId(item.id); // 현재 저장 중인 행 표시용
      setError("");
      setMessage("");

      // 수정할 필드들만 전달하여 업데이트
      await updateSigItem(item.id, {
        title: item.title ?? "",
        score: item.score ?? "",
        slotIndex: item.slotIndex ?? "",
        boardIndex: item.boardIndex ?? "",
        isActive: item.isActive,
      });

      setMessage("수정이 저장되었습니다.");
      // 저장 후 다시 목록 새로고침
      await loadList();
    } catch (err) {
      console.error(err);
      setError(err.message || "수정에 실패했습니다.");
    } finally {
      // 저장 완료 후 savingRowId 초기화
      setSavingRowId(null);
    }
  };

  // 각 행의 "삭제" 버튼 클릭 시 해당 카드 삭제
  const handleDeleteRow = async (item) => {
    // 브라우저 환경에서만 confirm 사용
    if (
      typeof window !== "undefined" &&
      !window.confirm("이 카드를 삭제할까요?")
    ) {
      // 사용자가 취소하면 아무 것도 안 함
      return;
    }
    try {
      setDeletingRowId(item.id); // 현재 삭제 중인 행 표시용
      setError("");
      setMessage("");

      // 카드 삭제 API 호출 (스토리지 + DB 둘 다 처리)
      await deleteSigItem(item.id);
      setMessage("삭제가 완료되었습니다.");
      // 삭제 후 목록 새로고침
      await loadList();
    } catch (err) {
      console.error(err);
      setError(err.message || "삭제에 실패했습니다.");
    } finally {
      // 삭제 완료 후 deletingRowId 초기화
      setDeletingRowId(null);
    }
  };

  // 상단 "게임" 셀렉트 변경 시 호출 (meal-bingo 선택 시 보드 자동 세팅)
  const handleChangeType = (e) => {
    const newType = e.target.value;
    setType(newType);
    // 새 타입이 식대전인데 boardIndex 가 비어 있으면 기본값 1 세팅
    if (newType === "meal-bingo" && !boardIndex) {
      setBoardIndex("1");
    }
  };

  // 실제 렌더링 부분
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "24px 12px 40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.98))",
          borderRadius: 20,
          border: "1px solid rgba(148, 163, 184, 0.5)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.9)",
          padding: 24,
          color: "#e5e7eb",
        }}
      >
        {/* 헤더 영역: 타이틀 및 설명 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              🛠 시그 이미지 관리
            </h1>
            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              게임 / 모드 / 일반·스페셜 / 빙고판 별로 카드 이미지를 관리합니다.
            </p>
          </div>
        </div>

        {/* 업로드 폼 영역 시작 */}
        <form onSubmit={handleSubmit}>
          {/* 게임 / 모드 / 카드 종류 / 빙고판 선택 영역 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMealBingo
                ? "repeat(4, minmax(0,1fr))"
                : "repeat(3, minmax(0,1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* 게임 타입 선택 셀렉트 (식대전/시그헌터 등) */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                게임
              </label>
              <select
                value={type}
                onChange={handleChangeType}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {GAME_TYPES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 모드 선택 셀렉트 (뮤즈/퀸덤) */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                모드
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 카드 희귀도(일반/스페셜) 선택 셀렉트 */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                카드 종류
              </label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {RARITIES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 식대전 빙고일 때만 빙고판 선택 셀렉트 노출 */}
            {isMealBingo && (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontSize: 13,
                    color: "#cbd5f5",
                  }}
                >
                  빙고판
                </label>
                <select
                  value={boardIndex}
                  onChange={(e) => setBoardIndex(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #374151",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  {MEAL_BINGO_BOARDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 제목 / 점수 / 칸 번호 입력 영역 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,0.8fr)",
              gap: 12,
              marginBottom: 14,
            }}
          >
            {/* 카드 이름 입력 (선택) */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                카드 이름 (선택)
              </label>
              <input
                type="text"
                value={title}
                placeholder="예) 시그 이름"
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            {/* 점수 입력 (선택) */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                점수 (선택)
              </label>
              <input
                type="number"
                value={score}
                placeholder="예) 100"
                onChange={(e) => setScore(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            {/* 칸 번호 입력 (필수) */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                칸 번호 (필수)
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={slotIndex}
                placeholder="예) 1 ~ 25"
                onChange={(e) => setSlotIndex(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* 파일 선택 + 미리보기 영역 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,2fr) minmax(0,1.2fr)",
              gap: 14,
              marginBottom: 18,
              alignItems: "stretch",
            }}
          >
            {/* 파일 선택 및 활성화 체크박스 */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                이미지 파일
              </label>

              {/* 커스텀 파일 선택 버튼 */}
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background:
                    "linear-gradient(135deg, #111827, #020617, #111827)",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#e5e7eb",
                }}
              >
                {/* + 아이콘 */}
                <span
                  style={{
                    display: "inline-flex",
                    width: 20,
                    height: 20,
                    borderRadius: "999px",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0ea5e9",
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  +
                </span>
                <span>이미지 선택</span>
                {/* 실제 파일 인풋은 숨기고 label 클릭으로 트리거 */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

              {/* 선택된 파일명 또는 안내 문구 표시 */}
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#9ca3af",
                  minHeight: 18,
                }}
              >
                {file
                  ? file.name
                  : "PNG / JPG / GIF 등 이미지 파일을 선택하세요."}
              </div>

              {/* 활성화 여부 체크박스 */}
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  fontSize: 13,
                  color: "#d1fae5",
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>활성화 (랜덤 뽑기에 포함)</span>
              </label>
            </div>

            {/* 이미지 미리보기 박스 */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                미리보기
              </label>
              <div
                style={{
                  borderRadius: 12,
                  border: "1px dashed #4b5563",
                  background: "#020617",
                  height: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {previewUrl ? (
                  // 선택한 파일을 브라우저 blob URL 로 미리보기
                  <img
                    src={previewUrl}
                    alt="preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  // 아직 선택한 이미지가 없을 때 안내 문구
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    선택한 이미지가 여기 미리보기로 보입니다.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 업로드 버튼 + 메시지 영역 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {/* 성공/에러 메시지 표시 */}
            {(message || error) && (
              <div
                style={{
                  fontSize: 13,
                  color: error ? "#f97373" : "#4ade80",
                  minWidth: 140,
                  textAlign: "right",
                }}
              >
                {error || message}
              </div>
            )}

            {/* 업로드 버튼 */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 20px",
                borderRadius: 999,
                border: "none",
                background: submitting
                  ? "linear-gradient(135deg, #6b7280, #4b5563)"
                  : "linear-gradient(135deg, #10b981, #22c55e)",
                color: "#022c22",
                fontWeight: 800,
                fontSize: 14,
                cursor: submitting ? "default" : "pointer",
                boxShadow: "0 10px 20px rgba(16,185,129,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </form>

        {/* 하단 등록된 카드 목록 테이블 영역 */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid rgba(55,65,81,0.8)",
          }}
        >
          {/* 목록 헤더: 현재 필터 상태 요약 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "#e5e7eb",
              }}
            >
              등록된 카드 목록
            </h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {MODES.find((m) => m.value === mode)?.label} /{" "}
              {GAME_TYPES.find((g) => g.value === type)?.label} /{" "}
              {RARITIES.find((r) => r.value === rarity)?.label}
              {isMealBingo && boardIndex
                ? ` / ${
                    MEAL_BINGO_BOARDS.find(
                      (b) => b.value === boardIndex
                    )?.label || `${boardIndex}판`
                  }`
                : ""}
            </span>
          </div>

          {/* 스크롤 가능한 테이블 컨테이너 */}
          <div
            style={{
              maxHeight: 260,
              overflow: "auto",
              borderRadius: 10,
              border: "1px solid rgba(55,65,81,0.9)",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(15,23,42,1)",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>
                    이미지
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>
                    이름
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    점수
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    판
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    칸
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    활성
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    관리
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>
                    ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 목록 로딩 중 표시 */}
                {loadingList ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#9ca3af",
                      }}
                    >
                      불러오는 중...
                    </td>
                  </tr>
                ) : items.length === 0 ? ( // 데이터 없을 때 메시지
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      현재 조건에 등록된 카드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  // 실제 카드 목록 렌더링
                  items.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderTop: "1px solid rgba(31,41,55,0.9)",
                        // 방금 업로드된 항목이면 옅은 초록색 배경으로 하이라이트
                        background:
                          item.id === highlightId
                            ? "rgba(34,197,94,0.08)" // ★ 추가: 방금 업로드된 항목 하이라이트
                            : "transparent",
                      }}
                    >
                      {/* 이미지 썸네일 셀 */}
                      <td style={{ padding: "4px 6px" }}>
                        <img
                          src={item.imageUrl}
                          alt={item.title || item.id}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid rgba(55,65,81,0.9)",
                          }}
                        />
                      </td>

                      {/* 카드 이름 수정 인풋 */}
                      <td style={{ padding: "4px 6px", maxWidth: 200 }}>
                        <input
                          type="text"
                          value={item.title || ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "title",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#e5e7eb",
                            fontSize: 12,
                            outline: "none",
                          }}
                        />
                      </td>

                      {/* 점수 수정 인풋 */}
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          value={item.score ?? ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "score",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#fbbf24",
                            fontSize: 12,
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      {/* 빙고판 번호 수정 인풋 */}
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          min="1"
                          max="3"
                          value={item.boardIndex ?? ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "boardIndex",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#e5e7eb",
                            fontSize: 12,
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      {/* 칸 번호 수정 인풋 */}
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          value={item.slotIndex ?? ""}
                          onChange={(e) =>
                            handleChangeItemField(
                              item.id,
                              "slotIndex",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #374151",
                            background: "#020617",
                            color: "#e5e7eb",
                            fontSize: 12,
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      {/* 활성/비활성 토글 버튼 */}
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleItemActive(item.id)}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid #374151",
                            background: item.isActive
                              ? "#064e3b"
                              : "#111827",
                            color: item.isActive ? "#4ade80" : "#6b7280",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          {item.isActive ? "ON" : "OFF"}
                        </button>
                      </td>

                      {/* 각 행의 저장/삭제 버튼 */}
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          {/* 저장 버튼 */}
                          <button
                            type="button"
                            onClick={() => handleSaveRow(item)}
                            disabled={savingRowId === item.id}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "none",
                              background:
                                "linear-gradient(135deg,#22c55e,#16a34a)",
                              color: "#022c22",
                              fontSize: 11,
                              cursor:
                                savingRowId === item.id
                                  ? "default"
                                  : "pointer",
                            }}
                          >
                            {savingRowId === item.id ? "저장중" : "저장"}
                          </button>
                          {/* 삭제 버튼 */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(item)}
                            disabled={deletingRowId === item.id}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "none",
                              background:
                                "linear-gradient(135deg,#f97373,#ef4444)",
                              color: "#fee2e2",
                              fontSize: 11,
                              cursor:
                                deletingRowId === item.id
                                  ? "default"
                                  : "pointer",
                            }}
                          >
                            {deletingRowId === item.id ? "삭제중" : "삭제"}
                          </button>
                        </div>
                      </td>

                      {/* 카드 id 표시 (복사용/디버깅용) */}
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: 11,
                          maxWidth: 160,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* 테이블 하단 안내 문구 */}
          <p
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            * 랜덤으로 뽑을 때, 이 목록의 카드들 중에서 (게임 / 모드 / 카드
            종류 / 빙고판에 맞게) 사용됩니다. 칸 번호와 일반/스페셜로 나눠서
            관리할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}