import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  listProgramGroupImages,
  uploadProgramGroupImage,
  deleteProgramImage,
  renameImageFile,
} from "../../resources/storage/sigResourceStorage";

// ⚠️ 보안: 실제 배포 시 환경변수(.env)로 관리하세요
const TELEGRAM_BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.REACT_APP_TELEGRAM_CHAT_ID;

/** 텔레그램 알림 전송 */
async function sendTelegramNotification(program, group, fileNames) {
  const programLabel = { muse: "뮤즈", queendom: "퀸덤", holic: "홀릭" }[program] ?? program;
  const fileList = fileNames.map((n) => `  • ${n}`).join("\n");
  const text = `📸 시그 이미지 업로드 완료\n\n📁 ${programLabel} / ${group}\n📊 ${fileNames.length}개 파일\n\n${fileList}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
    });
  } catch (err) {
    console.warn("[Telegram] 알림 전송 실패:", err);
  }
}

const PROGRAMS = [
  { value: "muse", label: "뮤즈" },
  { value: "queendom", label: "퀸덤" },
  { value: "holic", label: "홀릭" },
];

const GROUP_SIG_RANGES_BY_PROGRAM = {
  muse: {
    group01: "1000-1100",
    group02: "1101-1299",
    group03: "1300-1999",
    group04: "2000-4999",
    group05: "5000-9999",
    group06: "고액시그,BJ개인시그",
    group07: "5000~고액시그",
  },
  queendom: {
    group01: "1000-1100",
    group02: "1101-1299",
    group03: "1300-1999",
    group04: "2000-4999",
    group05: "5000-9999",
    group06: "고액시그,BJ개인시그",
    group07: "VIP고액시그",
    group08: "5000~고액시그",
  },
  holic: {
    group01: "1000-1100",
    group02: "1101-1299",
    group03: "1300-1999",
    group04: "2000-4999",
    group05: "5000-9999",
    group06: "고액시그,BJ개인시그",
    group07: "5000~고액시그",
  },
};

const GROUPS = Array.from({ length: 8 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return {
    value: `group${num}`,
    label: `group${num}`,
  };
});

const MANUAL_SECTIONS = [
  { id: "overview", title: "1. 시스템 개요" },
  { id: "access", title: "2. 접속 방법" },
  { id: "layout", title: "3. 화면 구성" },
  { id: "upload", title: "4. 이미지 업로드" },
  { id: "search", title: "5. 이미지 검색" },
  { id: "download", title: "6. 이미지 다운로드" },
  { id: "delete", title: "7. 이미지 삭제" },
  { id: "rename", title: "8. 파일명 변경" },
  { id: "notify", title: "9. 알림 기능" },
  { id: "rules", title: "10. 주의사항" },
];

function ManualModal({ onClose }) {
  const scrollRef = useRef(null);

  const scrollToSection = (id) => {
    const el = document.getElementById(`manual-section-${id}`);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
    }
  };

  const sectionStyle = {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid rgba(55,65,81,0.4)",
  };
  const h2Style = {
    fontSize: 16,
    fontWeight: 900,
    color: "#4ade80",
    marginBottom: 10,
  };
  const pStyle = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.75, marginBottom: 6 };
  const noteStyle = {
    fontSize: 13,
    color: "#fbbf24",
    background: "rgba(251,191,36,0.08)",
    border: "1px solid rgba(251,191,36,0.3)",
    borderRadius: 8,
    padding: "8px 12px",
    marginTop: 8,
  };
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    marginTop: 8,
  };
  const thStyle = {
    background: "rgba(34,197,94,0.1)",
    color: "#4ade80",
    fontWeight: 700,
    padding: "8px 12px",
    border: "1px solid rgba(55,65,81,0.5)",
    textAlign: "left",
  };
  const tdStyle = {
    color: "#cbd5e1",
    padding: "8px 12px",
    border: "1px solid rgba(55,65,81,0.5)",
    verticalAlign: "top",
  };
  const stepStyle = {
    fontSize: 14,
    color: "#e5e7eb",
    lineHeight: 1.9,
    paddingLeft: 16,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#020617",
          borderRadius: 16,
          border: "1px solid rgba(55,65,81,0.9)",
          width: "min(900px, 95vw)",
          height: "85vh",
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          overflow: "hidden",
        }}
      >
        {/* 왼쪽 목차 */}
        <div
          style={{
            background: "rgba(15,23,42,0.98)",
            borderRight: "1px solid rgba(55,65,81,0.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 16px 12px",
              fontSize: 14,
              fontWeight: 900,
              color: "#4ade80",
              borderBottom: "1px solid rgba(55,65,81,0.4)",
            }}
          >
            📋 목차
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
            {MANUAL_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  fontSize: 13,
                  color: "#9ca3af",
                  cursor: "pointer",
                  lineHeight: 1.5,
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e5e7eb";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {sec.title}
              </button>
            ))}
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(55,65,81,0.4)" }}>
            <div style={{ fontSize: 11, color: "#6b7280" }}>v1.0 · 2026-05-12</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>문의: 신지안</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>010-4966-3066</div>
          </div>
        </div>

        {/* 오른쪽 본문 */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{
              padding: "18px 24px 14px",
              borderBottom: "1px solid rgba(55,65,81,0.4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#e5e7eb" }}>📖 운영 매뉴얼</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>SIG 이미지 관리 시스템</div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 22,
                color: "#6b7280",
                cursor: "pointer",
                padding: 4,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "24px" }}>

            {/* 1. 시스템 개요 */}
            <div id="manual-section-overview" style={sectionStyle}>
              <div style={h2Style}>1. 시스템 개요</div>
              <p style={pStyle}>
                SIG 이미지 관리 시스템은 뮤즈, 퀸덤, 홀릭 프로그램별 이미지를 그룹 단위로 업로드·조회·다운로드·삭제할 수 있는 사내 이미지 관리 도구입니다.
              </p>
              <table style={tableStyle}>
                <tbody>
                  {[
                    ["지원 브라우저", "Chrome 최신 버전 권장, Edge"],
                    ["지원 파일 형식", "JPG, PNG, WebP, GIF"],
                    ["프로그램 구분", "뮤즈 / 퀸덤 / 홀릭"],
                    ["알림 방식", "텔레그램 봇 (업로드 완료 시 자동 발송)"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#93c5fd", width: 140, whiteSpace: "nowrap" }}>{k}</td>
                      <td style={tdStyle}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. 접속 방법 */}
            <div id="manual-section-access" style={sectionStyle}>
              <div style={h2Style}>2. 접속 방법</div>
              <ol style={stepStyle}>
                <li>Chrome 브라우저를 실행합니다.</li>
                <li>주소창에 <code style={{ color: "#4ade80", background: "rgba(34,197,94,0.08)", padding: "1px 6px", borderRadius: 4 }}>https://sighunter.vercel.app/admin</code> 을 입력합니다.</li>
                <li>사내 네트워크 또는 VPN에 연결된 상태에서 접속합니다.</li>
              </ol>
              <div style={noteStyle}>⚠️ 외부 네트워크에서 접속이 안 될 경우 VPN 연결 여부를 먼저 확인하세요.</div>
            </div>

            {/* 3. 화면 구성 */}
            <div id="manual-section-layout" style={sectionStyle}>
              <div style={h2Style}>3. 화면 구성 안내</div>
              <p style={pStyle}>관리센터 → 시그이미지 관리 메뉴로 이동합니다.</p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>구성 요소</th>
                    <th style={thStyle}>설명</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["프로그램 선택", "뮤즈 / 퀸덤 / 홀릭 프로그램을 전환합니다."],
                    ["그룹 목록 (왼쪽 패널)", "선택한 프로그램 내 세부 그룹을 선택합니다."],
                    ["검색창", "파일명으로 이미지를 필터링합니다."],
                    ["이미지 그리드", "업로드된 이미지 목록이 표시됩니다."],
                    ["체크박스", "이미지를 개별 또는 전체 선택합니다."],
                    ["NEW 배지", "당일 업로드된 이미지에 표시됩니다."],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#93c5fd", whiteSpace: "nowrap" }}>{k}</td>
                      <td style={tdStyle}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. 업로드 */}
            <div id="manual-section-upload" style={sectionStyle}>
              <div style={h2Style}>4. 이미지 업로드</div>
              <p style={{ ...pStyle, fontWeight: 700, color: "#e5e7eb" }}>방법 1. 드래그 앤 드롭</p>
              <ol style={stepStyle}>
                <li>업로드할 이미지 파일을 선택합니다.</li>
                <li>이미지 그리드 영역에 파일을 끌어다 놓습니다.</li>
              </ol>
              <p style={{ ...pStyle, fontWeight: 700, color: "#e5e7eb", marginTop: 12 }}>방법 2. 파일 선택 버튼</p>
              <ol style={stepStyle}>
                <li>업로드 영역을 클릭합니다.</li>
                <li>파일 탐색기에서 이미지를 선택합니다. (다중 선택 가능)</li>
              </ol>
              <p style={{ ...pStyle, fontWeight: 700, color: "#e5e7eb", marginTop: 12 }}>파일명 지정 규칙</p>
              <p style={pStyle}>업로드 후 이름바꾸기 버튼을 클릭해 시그 숫자만 남기고 수정합니다.</p>
              <p style={{ ...pStyle, color: "#4ade80" }}>예시: 1000 캐치캐치.jpg → 1000.webp</p>
              <div style={noteStyle}>⚠️ 확장자명은 반드시 <strong>webp</strong>로 입력 후 체크 표시를 클릭해야 합니다.</div>
            </div>

            {/* 5. 검색 */}
            <div id="manual-section-search" style={sectionStyle}>
              <div style={h2Style}>5. 이미지 검색 및 조회</div>
              <ol style={stepStyle}>
                <li>상단 검색창에 파일명 키워드를 입력합니다.</li>
                <li>입력과 동시에 해당 키워드가 포함된 이미지만 표시됩니다.</li>
                <li>검색어를 지우면 전체 이미지가 다시 표시됩니다.</li>
              </ol>
              <p style={{ ...pStyle, color: "#9ca3af", marginTop: 6 }}>검색 시 대소문자는 구분하지 않습니다.</p>
            </div>

            {/* 6. 다운로드 */}
            <div id="manual-section-download" style={sectionStyle}>
              <div style={h2Style}>6. 이미지 다운로드</div>
              <p style={{ ...pStyle, fontWeight: 700, color: "#e5e7eb" }}>단일 / 다중 다운로드</p>
              <ol style={stepStyle}>
                <li>다운로드할 이미지의 체크박스를 선택합니다. (전체선택 가능)</li>
                <li>⬇️ 다운로드 버튼을 클릭합니다.</li>
                <li>다운로드 모달에서 아래 옵션을 설정합니다.</li>
              </ol>
              <table style={{ ...tableStyle, marginTop: 10 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>기능</th>
                    <th style={thStyle}>설명</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["이미지 미리보기", "다운로드 전 이미지를 확인할 수 있습니다."],
                    ["파일명 수정", "저장될 파일명을 수정할 수 있습니다."],
                    ["저장 경로 선택", "📁 폴더 선택 버튼으로 저장 폴더를 지정합니다."],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#93c5fd", whiteSpace: "nowrap" }}>{k}</td>
                      <td style={tdStyle}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 7. 삭제 */}
            <div id="manual-section-delete" style={sectionStyle}>
              <div style={h2Style}>7. 이미지 삭제</div>
              <ol style={stepStyle}>
                <li>삭제할 이미지의 체크박스를 선택합니다.</li>
                <li>🗑️ 삭제 버튼을 클릭합니다.</li>
                <li>확인 팝업에서 확인을 클릭합니다.</li>
              </ol>
              <div style={{ ...noteStyle, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)" }}>
                ⚠️ 삭제된 이미지는 복구할 수 없습니다. 반드시 확인 후 삭제하세요.
              </div>
            </div>

            {/* 8. 파일명 변경 */}
            <div id="manual-section-rename" style={sectionStyle}>
              <div style={h2Style}>8. 이미지 파일명 변경</div>
              <ol style={stepStyle}>
                <li>변경할 이미지 카드 하단의 ✍️ 이름바꾸기 버튼을 클릭합니다.</li>
                <li>새로운 파일명을 입력합니다.</li>
                <li>Enter 키를 누르면 저장, Esc 키를 누르면 취소됩니다.</li>
              </ol>
            </div>

            {/* 9. 알림 */}
            <div id="manual-section-notify" style={sectionStyle}>
              <div style={h2Style}>9. 알림 기능 안내</div>
              <p style={pStyle}>이미지 업로드가 완료되면 담당자의 텔레그램으로 자동 알림이 발송됩니다.</p>
              <div style={{
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(55,65,81,0.5)",
                borderRadius: 8,
                padding: "12px 16px",
                marginTop: 8,
                fontFamily: "monospace",
                fontSize: 13,
                color: "#4ade80",
                lineHeight: 1.8,
              }}>
                📸 시그 이미지 업로드 완료<br />
                📁 뮤즈 / group01<br />
                📊 3개 파일<br />
                &nbsp;&nbsp;• 1000.webp<br />
                &nbsp;&nbsp;• 1001.webp<br />
                &nbsp;&nbsp;• 1002.webp
              </div>
            </div>

            {/* 10. 주의사항 */}
            <div id="manual-section-rules" style={{ marginBottom: 8 }}>
              <div style={h2Style}>10. 주의사항 및 운영 규칙</div>
              <table style={tableStyle}>
                <tbody>
                  {[
                    ["1", "업무와 무관한 이미지는 업로드하지 않습니다."],
                    ["2", "파일명은 식별 가능한 명칭으로 지정합니다. (예: 1000.webp)"],
                    ["3", "삭제 전 반드시 필요 여부를 확인합니다. 삭제된 파일은 복구 불가합니다."],
                    ["4", "시스템 이상 발생 시 임의로 조작하지 말고 담당자에게 즉시 보고합니다."],
                    ["5", "본 시스템에 접근 가능한 계정 정보를 외부에 공유하지 않습니다."],
                  ].map(([num, rule]) => (
                    <tr key={num}>
                      <td style={{ ...tdStyle, fontWeight: 900, color: "#4ade80", width: 32, textAlign: "center" }}>{num}</td>
                      <td style={tdStyle}>{rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ ...pStyle, marginTop: 16, color: "#9ca3af" }}>문의사항은 신지안 (010-4966-3066)으로 연락 바랍니다.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ToastInline({ message, error, onClear }) {
  const visible = !!(message || error);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClear?.(), 3000);
    return () => clearTimeout(t);
  }, [visible, onClear]);

  if (!visible) return null;

  const isError = !!error;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        padding: "12px 18px",
        borderRadius: 12,
        background: isError ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
        border: `1px solid ${isError ? "#ef4444" : "#22c55e"}`,
        color: isError ? "#f97373" : "#4ade80",
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        maxWidth: 420,
      }}
    >
      {isError ? `⚠️ ${error}` : `✅ ${message}`}
    </div>
  );
}

function ImagePreviewModal({ image, onClose }) {
  if (!image) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#020617",
          borderRadius: 16,
          padding: 24,
          maxWidth: "90%",
          maxHeight: "90%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          border: "1px solid rgba(55,65,81,0.9)",
        }}
      >
        <div style={{ textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              color: "#cbd5e1",
              cursor: "pointer",
              padding: 0,
              width: 32,
              height: 32,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "100%",
          }}
        >
          <img
            src={image.url}
            alt={image.fileName}
            style={{
              maxWidth: "100%",
              maxHeight: 600,
              borderRadius: 12,
              objectFit: "contain",
            }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, color: "#cbd5e1", fontWeight: 800 }}>
            {image.fileName}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
            {image.fullPath}
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkDownloadModal({ images, onClose, onDownload }) {
  const [downloadPath, setDownloadPath] = useState("");
  const [downloadPathName, setDownloadPathName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [editingFileNames, setEditingFileNames] = useState(
    Object.fromEntries(images.map((img, idx) => [idx, img.fileName]))
  );

  if (!images || images.length === 0) return null;

  const selectedImage = images[selectedImageIdx];
  const currentFileName = editingFileNames[selectedImageIdx] || selectedImage.fileName;

  const handleSelectFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setDownloadPath(dirHandle);
      setDownloadPathName(dirHandle.name || "선택됨");
    } catch (err) {
      console.log("폴더 선택 취소됨");
    }
  };

  const handleFileNameChange = (idx, newName) => {
    setEditingFileNames((prev) => ({
      ...prev,
      [idx]: newName,
    }));
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const updatedImages = images.map((img, idx) => ({
      ...img,
      fileName: editingFileNames[idx] || img.fileName,
    }));
    await onDownload(updatedImages, downloadPath);
    setIsDownloading(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#020617",
          borderRadius: 16,
          padding: 24,
          maxWidth: 1100,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          border: "1px solid rgba(55,65,81,0.9)",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#e5e7eb" }}>
              📥 파일 일괄 다운로드
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              {images.length}개 파일을 다운로드합니다
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              color: "#cbd5e1",
              cursor: "pointer",
              padding: 0,
              width: 32,
              height: 32,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={handleSelectFolder}
            disabled={isDownloading}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid rgba(59,130,246,0.6)",
              background: "transparent",
              color: isDownloading ? "#9ca3af" : "#93c5fd",
              fontWeight: 700,
              fontSize: 13,
              cursor: isDownloading ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            📁 폴더 선택
          </button>
          <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>
            {downloadPathName || "기본 다운로드 폴더"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 20,
            borderTop: "1px solid rgba(55,65,81,0.5)",
            paddingTop: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                borderRadius: 12,
                border: "1px solid rgba(55,65,81,0.9)",
                background: "#0f172a",
                overflow: "hidden",
              }}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.fileName}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              {selectedImageIdx + 1} / {images.length}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, marginBottom: 8 }}>
                📄 파일명 수정
              </div>
              <input
                type="text"
                value={currentFileName}
                onChange={(e) => handleFileNameChange(selectedImageIdx, e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(55,65,81,0.9)",
                  background: "rgba(2,6,23,0.8)",
                  color: "#e5e7eb",
                  fontSize: 13,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#22c55e";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(55,65,81,0.9)";
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, marginBottom: 8 }}>
                📋 파일 목록
              </div>
              <div
                style={{
                  maxHeight: 300,
                  overflow: "auto",
                  border: "1px solid rgba(55,65,81,0.5)",
                  borderRadius: 8,
                  background: "rgba(2,6,23,0.5)",
                }}
              >
                {images.map((img, idx) => (
                  <button
                    key={img.fullPath}
                    onClick={() => setSelectedImageIdx(idx)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "none",
                      background:
                        selectedImageIdx === idx
                          ? "rgba(34,197,94,0.15)"
                          : "transparent",
                      borderBottom: "1px solid rgba(55,65,81,0.3)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedImageIdx !== idx) {
                        e.currentTarget.style.background = "rgba(55,65,81,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImageIdx !== idx) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>
                      {idx + 1}. {editingFileNames[idx]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            borderTop: "1px solid rgba(55,65,81,0.5)",
            paddingTop: 16,
          }}
        >
          <button
            onClick={onClose}
            disabled={isDownloading}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid rgba(107,114,128,0.6)",
              background: "transparent",
              color: "#9ca3af",
              fontWeight: 700,
              fontSize: 13,
              cursor: isDownloading ? "default" : "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: isDownloading ? "#4b5563" : "#22c55e",
              color: isDownloading ? "#9ca3af" : "#022c22",
              fontWeight: 900,
              fontSize: 13,
              cursor: isDownloading ? "default" : "pointer",
            }}
          >
            {isDownloading ? "다운로드 중..." : "다운로드"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SigImageManagePage() {
  const [program, setProgram] = useState("muse");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [images, setImages] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  const [useCustomName, setUseCustomName] = useState(false);
  const [customFileName, setCustomFileName] = useState("");
  const inputRef = useRef(null);

  const [selectedImages, setSelectedImages] = useState(new Set());
  const [deletingPaths, setDeletingPaths] = useState(new Set());

  const [renamingPath, setRenamingPath] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showBulkDownloadModal, setShowBulkDownloadModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const clearToast = () => {
    setMessage("");
    setError("");
  };

  const loadGroupList = useCallback(async () => {
    setLoadingGroups(true);
    setError("");
    setSelectedGroup(null);
    setImages([]);
    setSelectedImages(new Set());

    try {
      const results = await Promise.all(
        GROUPS.map(async (g) => {
          try {
            const items = await listProgramGroupImages(program, g.value);
            return {
              ...g,
              count: items.length,
              hasFiles: items.length > 0,
            };
          } catch (e) {
            return {
              ...g,
              count: 0,
              hasFiles: false,
            };
          }
        })
      );

      setGroups(results);
    } catch (e) {
      setError(e?.message || "그룹 목록 로드 실패");
    } finally {
      setLoadingGroups(false);
    }
  }, [program]);

  useEffect(() => {
    loadGroupList();
  }, [loadGroupList]);

  const loadGroupImages = useCallback(async (group) => {
    setLoadingImages(true);
    setError("");
    setSelectedImages(new Set());
    setSearchQuery("");

    try {
      const items = await listProgramGroupImages(program, group);
      setImages(items);
      setSelectedGroup(group);
    } catch (e) {
      setError(e?.message || "이미지 로드 실패");
    } finally {
      setLoadingImages(false);
    }
  }, [program]);

  const isImageFile = (fileName) => {
    const lower = String(fileName || "").toLowerCase();
    return (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".gif") ||
      lower.endsWith(".webp")
    );
  };

  const uploadFiles = useCallback(
    async (fileList) => {
      if (!selectedGroup) {
        setError("그룹이 선택되지 않았습니다.");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const file of fileList) {
        try {
          const finalFileName = useCustomName ? customFileName : file.name;

          await uploadProgramGroupImage(program, selectedGroup, file, {
            fileName: useCustomName ? finalFileName : undefined,
          });

          successCount++;
        } catch (e) {
          console.error(`[Upload Error] ${file.name}:`, e);
          failCount++;
        }
      }

      if (successCount > 0) {
        setMessage(`${successCount}개 파일이 업로드되었습니다.`);
        // 텔레그램 알림 전송 (업로드 성공한 파일명만)
        const uploadedNames = fileList
          .slice(0, successCount)
          .map((f) => (useCustomName ? customFileName : f.name));
        sendTelegramNotification(program, selectedGroup, uploadedNames);
      }
      if (failCount > 0) {
        setError(`${failCount}개 파일 업로드 실패`);
      }

      setCustomFileName("");
      setUseCustomName(false);
    },
    [program, selectedGroup, useCustomName, customFileName]
  );

  const processFiles = useCallback(
    async (fileList) => {
      if (!selectedGroup) {
        setError("먼저 그룹을 선택하세요.");
        return;
      }

      if (!fileList || fileList.length === 0) return;

      const invalidFiles = Array.from(fileList).filter(
        (f) => !isImageFile(f.name)
      );

      if (invalidFiles.length > 0) {
        setError(
          `이미지 파일만 업로드 가능합니다: ${invalidFiles.map((f) => f.name).join(", ")}`
        );
        return;
      }

      setError("");
      setMessage("");
      await uploadFiles(Array.from(fileList));
      await loadGroupImages(selectedGroup);
    },
    [selectedGroup, uploadFiles, loadGroupImages]
  );

  const onPickFiles = useCallback(
    (e) => {
      const fileList = e.target?.files;
      processFiles(fileList);
      if (inputRef.current) inputRef.current.value = "";
    },
    [processFiles]
  );

  const onDropFiles = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const fileList = e.dataTransfer?.files;
      processFiles(fileList);
    },
    [processFiles]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDeleteSingle = useCallback(
    async (image) => {
      const ok = window.confirm(
        `파일을 삭제할까요?\n\n${image.fileName}`
      );
      if (!ok) return;

      setDeletingPaths((prev) => new Set([...prev, image.fullPath]));
      setError("");
      setMessage("");

      try {
        await deleteProgramImage(image.fullPath);
        setMessage("파일이 삭제되었습니다.");
        setSelectedImages((prev) => {
          const next = new Set(prev);
          next.delete(image.fullPath);
          return next;
        });
        await loadGroupImages(selectedGroup);
      } catch (e) {
        setError(e?.message || "삭제 실패");
      } finally {
        setDeletingPaths((prev) => {
          const next = new Set(prev);
          next.delete(image.fullPath);
          return next;
        });
      }
    },
    [selectedGroup, loadGroupImages]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedImages.size === 0) {
      setError("삭제할 파일을 선택하세요.");
      return;
    }

    const ok = window.confirm(
      `${selectedImages.size}개 파일을 삭제할까요?`
    );
    if (!ok) return;

    const toDelete = Array.from(selectedImages);
    setDeletingPaths(new Set(toDelete));
    setError("");
    setMessage("");

    let successCount = 0;
    let failCount = 0;

    for (const fullPath of toDelete) {
      try {
        await deleteProgramImage(fullPath);
        successCount++;
      } catch (e) {
        console.error(`[Delete Error] ${fullPath}:`, e);
        failCount++;
      } finally {
        setDeletingPaths((prev) => {
          const next = new Set(prev);
          next.delete(fullPath);
          return next;
        });
      }
    }

    if (successCount > 0) {
      setMessage(`${successCount}개 파일이 삭제되었습니다.`);
      setSelectedImages(new Set());
      await loadGroupImages(selectedGroup);
    }
    if (failCount > 0) {
      setError(`${failCount}개 파일 삭제 실패`);
    }
  }, [selectedImages, selectedGroup, loadGroupImages]);

  const handleBulkDownload = async (imagesToDownload, downloadPath) => {
    for (const img of imagesToDownload) {
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = img.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error(`다운로드 실패: ${img.fileName}`, e);
      }
    }
    setMessage(`${imagesToDownload.length}개 파일이 다운로드되었습니다.`);
  };

  const toggleImageSelection = useCallback((fullPath) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(fullPath)) {
        next.delete(fullPath);
      } else {
        next.add(fullPath);
      }
      return next;
    });
  }, []);

  const handleRenameStart = useCallback((image) => {
    setRenamingPath(image.fullPath);
    setRenameValue(image.fileName);
  }, []);

  const handleRenameCancel = useCallback(() => {
    setRenamingPath(null);
    setRenameValue("");
  }, []);

  const handleRenameSubmit = useCallback(
    async (image) => {
      const newName = renameValue.trim();

      if (!newName) {
        setError("새 파일명을 입력해주세요.");
        return;
      }

      if (newName === image.fileName) {
        handleRenameCancel();
        return;
      }

      setError("");
      setMessage("");
      setDeletingPaths((prev) => new Set([...prev, image.fullPath]));

      try {
        const renamed = await renameImageFile(
          program,
          selectedGroup,
          image.fullPath,
          newName
        );

        setMessage(`파일명이 변경되었습니다: ${image.fileName} → ${renamed.fileName}`);
        setRenamingPath(null);
        setRenameValue("");
        setSelectedImages((prev) => {
          const next = new Set(prev);
          next.delete(image.fullPath);
          return next;
        });
        await loadGroupImages(selectedGroup);
      } catch (e) {
        setError(e?.message || "파일명 변경 실패");
      } finally {
        setDeletingPaths((prev) => {
          const next = new Set(prev);
          next.delete(image.fullPath);
          return next;
        });
      }
    },
    [program, selectedGroup, renameValue, loadGroupImages, handleRenameCancel]
  );

  const currentFolderPath = useMemo(() => {
    if (!selectedGroup) return "";
    return `images/${program}/${selectedGroup}/`;
  }, [program, selectedGroup]);

  const hasGroupsWithFiles = useMemo(() => {
    return groups.some((g) => g.hasFiles);
  }, [groups]);

  const getSigRangeLabel = useCallback((groupValue) => {
    const ranges = GROUP_SIG_RANGES_BY_PROGRAM[program];
    const range = ranges?.[groupValue];
    return range ? `(${range})` : "";
  }, [program]);

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const query = searchQuery.toLowerCase();
    return images.filter((img) =>
      img.fileName.toLowerCase().includes(query)
    );
  }, [images, searchQuery]);

  const isUploadedToday = useCallback((fullPath) => {
    const today = new Date().toISOString().split("T")[0];
    const uploadedToday = JSON.parse(
      localStorage.getItem("uploadedToday") || "{}"
    );
    return uploadedToday[today]?.includes(fullPath) || false;
  }, []);

  useEffect(() => {
    if (message.includes("업로드")) {
      const today = new Date().toISOString().split("T")[0];
      const uploadedToday = JSON.parse(
        localStorage.getItem("uploadedToday") || "{}"
      );
      uploadedToday[today] = uploadedToday[today] || [];
      images.forEach((img) => {
        if (!uploadedToday[today].includes(img.fullPath)) {
          uploadedToday[today].push(img.fullPath);
        }
      });
      localStorage.setItem("uploadedToday", JSON.stringify(uploadedToday));
    }
  }, [message, images]);

  const toggleAllSelection = useCallback(() => {
    if (selectedImages.size === filteredImages.length && filteredImages.length > 0) {
      setSelectedImages(new Set());
    } else {
      const all = new Set(filteredImages.map((img) => img.fullPath));
      setSelectedImages(all);
    }
  }, [filteredImages, selectedImages.size]);

  const getSelectedImagesData = useCallback(() => {
    return Array.from(selectedImages).map((path) =>
      images.find((img) => img.fullPath === path)
    ).filter(Boolean);
  }, [selectedImages, images]);

  return (
    <div style={{ padding: 16 }}>
      <ToastInline message={message} error={error} onClear={clearToast} />

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
              🖼️ 시그 이미지 관리
            </div>
            <div style={{ fontSize: 15, color: "#9ca3af" }}>
              프로그램별 그룹 폴더 내 이미지 업로드, 삭제, 미리보기
            </div>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid rgba(99,102,241,0.6)",
              background: "rgba(99,102,241,0.08)",
              color: "#a5b4fc",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.18)";
              e.currentTarget.style.color = "#c7d2fe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.08)";
              e.currentTarget.style.color = "#a5b4fc";
            }}
          >
            📖 매뉴얼
          </button>
        </div>

        <div style={{ minWidth: 240 }}>
          <label
            style={{
              display: "block",
              fontSize: 15,
              color: "#cbd5e1",
              marginBottom: 6,
            }}
          >
            프로그램
          </label>
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 10px",
              borderRadius: 10,
              border: "1px solid #374151",
              background: "#020617",
              color: "#e5e7eb",
              outline: "none",
              fontSize: 16,
            }}
          >
            {PROGRAMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 280px) 1fr",
          gap: 16,
        }}
      >
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(55,65,81,0.9)",
            background: "rgba(15,23,42,0.95)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            height: "fit-content",
            maxHeight: "70vh",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, color: "#e5e7eb" }}>
            📁 그룹 목록
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              paddingBottom: 8,
              borderBottom: "1px solid rgba(55,65,81,0.5)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {loadingGroups
                ? "로드 중..."
                : hasGroupsWithFiles
                ? `${groups.filter((g) => g.hasFiles).length}개 그룹`
                : "파일 없음"}
            </span>
            {!loadingGroups && hasGroupsWithFiles && (
              <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                (총 {groups.reduce((sum, g) => sum + g.count, 0)}개)
              </span>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {loadingGroups ? (
              <div style={{ fontSize: 15, color: "#9ca3af", padding: 8 }}>
                그룹을 불러오는 중...
              </div>
            ) : groups.filter((g) => g.hasFiles).length === 0 ? (
              <div style={{ fontSize: 15, color: "#6b7280", padding: 8 }}>
                파일이 있는 그룹이 없습니다.
              </div>
            ) : (
              groups.map((g) => {
                if (!g.hasFiles) return null;

                const isSelected = selectedGroup === g.value;
                const sigRangeLabel = getSigRangeLabel(g.value);

                return (
                  <button
                    key={g.value}
                    onClick={() => loadGroupImages(g.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: isSelected
                        ? "2px solid #22c55e"
                        : "1px solid rgba(55,65,81,0.5)",
                      background: isSelected
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(2,6,23,0.5)",
                      color: isSelected ? "#4ade80" : "#cbd5e1",
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: 18,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      {g.label} {sigRangeLabel}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: isSelected ? "#4ade80" : "#9ca3af",
                        marginTop: 4,
                      }}
                    >
                      {g.count}개 파일
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedGroup && (
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(55,65,81,0.9)",
                background: "rgba(15,23,42,0.95)",
                padding: 14,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>
                ⬆️ 이미지 업로드
              </div>

              <div
                onDrop={onDropFiles}
                onDragOver={onDragOver}
                onClick={() => inputRef.current?.click()}
                style={{
                  borderRadius: 12,
                  border: "2px dashed #4b5563",
                  background: "#020617",
                  padding: 20,
                  cursor: "pointer",
                  userSelect: "none",
                  marginBottom: 12,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28 }}>📸</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>
                      여기에 파일을 드롭하거나 클릭하세요
                    </div>
                    <div style={{ fontSize: 15, color: "#9ca3af", marginTop: 4 }}>
                      허용: JPG, PNG, GIF, WebP (다중 선택 가능)
                    </div>
                  </div>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={onPickFiles}
              />

              <div style={{ marginTop: 12 }}>
                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    cursor: "pointer",
                    marginBottom: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useCustomName}
                    onChange={(e) => setUseCustomName(e.target.checked)}
                  />
                  <span style={{ fontSize: 15, color: "#cbd5e1" }}>
                    저장 시 파일명 직접 지정하기
                  </span>
                </label>

                {useCustomName && (
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="예) sig_001.webp"
                    style={{
                      width: "100%",
                      padding: "10px 10px",
                      borderRadius: 10,
                      border: "1px solid #374151",
                      background: "#020617",
                      color: "#e5e7eb",
                      outline: "none",
                      fontSize: 15,
                    }}
                  />
                )}

                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginTop: 6,
                  }}
                >
                  현재 경로: <code>{currentFolderPath}</code>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(55,65,81,0.9)",
              background: "rgba(15,23,42,0.95)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              height: 600,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#e5e7eb" }}>
                  📷 이미지 목록
                </div>
                {selectedGroup && (
                  <div style={{ fontSize: 15, color: "#6b7280", marginTop: 4 }}>
                    {loadingImages
                      ? "로드 중..."
                      : `총 ${images.length}개 (선택: ${selectedImages.size}개)`}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="이미지명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(55,65,81,0.9)",
                    background: "rgba(2,6,23,0.8)",
                    color: "#e5e7eb",
                    fontSize: 15,
                    outline: "none",
                    minWidth: 180,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#22c55e";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(55,65,81,0.9)";
                  }}
                />

                {selectedImages.size > 0 && (
                  <>
                    <button
                      onClick={() => setShowBulkDownloadModal(true)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(59,130,246,0.6)",
                        background: "transparent",
                        color: "#93c5fd",
                        fontWeight: 900,
                        fontSize: 15,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⬇️ 다운로드 ({selectedImages.size})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={deletingPaths.size > 0}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(248,113,113,0.6)",
                        background: "transparent",
                        color: deletingPaths.size > 0 ? "#fecaca" : "#fda4af",
                        fontWeight: 900,
                        fontSize: 15,
                        cursor: deletingPaths.size > 0 ? "default" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🗑️ 삭제 ({selectedImages.size})
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
              {!selectedGroup ? (
                <div style={{ padding: 16, color: "#6b7280", fontSize: 15 }}>
                  그룹을 선택하세요.
                </div>
              ) : loadingImages ? (
                <div style={{ padding: 16, color: "#9ca3af", fontSize: 15 }}>
                  이미지를 불러오는 중...
                </div>
              ) : images.length === 0 ? (
                <div style={{ padding: 16, color: "#6b7280", fontSize: 15 }}>
                  이 그룹에 이미지가 없습니다.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      borderBottom: "1px solid rgba(55,65,81,0.5)",
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedImages.size === filteredImages.length &&
                        filteredImages.length > 0
                      }
                      onChange={toggleAllSelection}
                    />
                    <span style={{ fontSize: 15, color: "#cbd5e1" }}>
                      전체 선택
                    </span>
                  </div>

                  {filteredImages.length === 0 && searchQuery ? (
                    <div style={{ padding: 16, color: "#6b7280", fontSize: 15 }}>
                      "{searchQuery}"에 일치하는 이미지가 없습니다.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {filteredImages.map((img) => {
                        const isSelected = selectedImages.has(img.fullPath);
                        const isDeleting = deletingPaths.has(img.fullPath);

                        return (
                          <div
                            key={img.fullPath}
                            style={{
                              borderRadius: 12,
                              border: isSelected
                                ? "2px solid #22c55e"
                                : "1px solid rgba(55,65,81,0.9)",
                              background: isSelected
                                ? "rgba(34,197,94,0.05)"
                                : "#020617",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                position: "relative",
                                paddingBottom: "100%",
                                background: "#0f172a",
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src={img.url}
                                alt={img.fileName}
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                onClick={() => setPreviewImage(img)}
                              />

                              {isUploadedToday(img.fullPath) && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    left: 8,
                                    background: "#22c55e",
                                    color: "#022c22",
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    fontSize: 14,
                                    fontWeight: 900,
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  NEW
                                </div>
                              )}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleImageSelection(img.fullPath)
                                  }
                                  style={{
                                    width: 20,
                                    height: 20,
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                padding: 10,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                              {renamingPath === img.fullPath ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    autoFocus
                                    style={{
                                      padding: "4px 6px",
                                      borderRadius: 6,
                                      border: "1px solid #22c55e",
                                      background: "#020617",
                                      color: "#e5e7eb",
                                      fontSize: 14,
                                      outline: "none",
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleRenameSubmit(img);
                                      if (e.key === "Escape") handleRenameCancel();
                                    }}
                                  />
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button
                                      onClick={() => handleRenameSubmit(img)}
                                      disabled={isDeleting}
                                      style={{
                                        flex: 1,
                                        padding: "3px 6px",
                                        borderRadius: 4,
                                        border: "none",
                                        background: "#22c55e",
                                        color: "#022c22",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        cursor: isDeleting ? "default" : "pointer",
                                      }}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={handleRenameCancel}
                                      disabled={isDeleting}
                                      style={{
                                        flex: 1,
                                        padding: "3px 6px",
                                        borderRadius: 4,
                                        border: "1px solid #6b7280",
                                        background: "transparent",
                                        color: "#9ca3af",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        cursor: isDeleting ? "default" : "pointer",
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      color: "#cbd5e1",
                                      fontWeight: 700,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {img.fileName}
                                  </div>
                                  <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                                    <button
                                      onClick={() => handleRenameStart(img)}
                                      disabled={isDeleting}
                                      style={{
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        border: "1px solid rgba(139,92,246,0.6)",
                                        background: "transparent",
                                        color: isDeleting ? "#9ca3af" : "#d8b4fe",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: isDeleting ? "default" : "pointer",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      ✍️ 이름바꾸기
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSingle(img)}
                                      disabled={isDeleting}
                                      style={{
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        border: "1px solid rgba(248,113,113,0.6)",
                                        background: "transparent",
                                        color: isDeleting ? "#fecaca" : "#fda4af",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: isDeleting ? "default" : "pointer",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {isDeleting ? "삭제중..." : "삭제"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showManualModal && <ManualModal onClose={() => setShowManualModal(false)} />}

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {showBulkDownloadModal && (
        <BulkDownloadModal
          images={getSelectedImagesData()}
          onClose={() => setShowBulkDownloadModal(false)}
          onDownload={handleBulkDownload}
        />
      )}
    </div>
  );
}