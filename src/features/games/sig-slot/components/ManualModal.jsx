// src/features/games/sig-slot/components/ManualModal.jsx

import { useState } from "react";

// ─────────────────────────────────────────────
// 탭 데이터
// ─────────────────────────────────────────────
const TABS = [
  { id: "intro",   label: "🎰 소개" },
  { id: "basic",   label: "▶ 기본 사용" },
  { id: "pick",    label: "🎯 연출 기능" },
  { id: "admin",   label: "⚙️ 관리자" },
  { id: "faq",     label: "❓ 문제 해결" },
];

// ─────────────────────────────────────────────
// 섹션별 내용 컴포넌트
// ─────────────────────────────────────────────

function SectionIntro() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-gray-300 text-s leading-relaxed">
        <span className="text-yellow-300 font-bold">SIG SLOT</span>은 시그 이미지(예: 1000번~5000번) 중에서
        랜덤으로 당첨 이미지를 뽑고, 그에 따른 보상을 보여주는 슬롯머신입니다.
      </p>

      <div className="flex flex-col gap-2">
        <h3 className="text-purple-300 font-bold text-s">주요 기능</h3>
        <ul className="flex flex-col gap-2 text-s text-gray-300">
          {[
            ["🎭", "프로그램별 운영", "뮤즈 / 퀸덤 / 홀릭 각각 이미지와 보상을 별도로 관리합니다."],
            ["🎴", "슬롯 개수 선택", "1개 또는 3개 슬롯으로 동시에 추첨할 수 있습니다."],
            ["🔢", "구간 필터", "1000~2000, 1000~5000 등 원하는 시그 번호 범위만 사용할 수 있습니다."],
            ["🎯", "연출 정지 기능", "회전 중 원하는 시그 번호를 선택하면 그 이미지에서 자연스럽게 멈춥니다."],
          ].map(([icon, title, desc]) => (
            <li key={title} className="flex items-start gap-3 bg-gray-800 rounded-xl p-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="font-bold text-white">{title}</div>
                <div className="text-gray-400 text-s mt-0.5">{desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-purple-300 font-bold text-s">화면 구성</h3>
        <div className="grid grid-cols-2 gap-2 text-s">
          {[
            ["상단 헤더", "제목 · 관리 · 매뉴얼 버튼"],
            ["프로그램 탭", "뮤즈 / 퀸덤 / 홀릭 선택"],
            ["슬롯 모드", "🎴 1개 / 🎴🎴🎴 3개"],
            ["구간 필터", "시그 번호 범위 선택"],
            ["슬롯머신 본체", "이미지 회전 · 정지 · 보상 확인"],
            ["우측 패널", "슬롯 선택 + 시그 번호 목록"],
            ["하단 히스토리", "최근 당첨 기록 최대 10개"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-gray-800 rounded-lg p-2.5">
              <div className="text-yellow-300 font-bold">{title}</div>
              <div className="text-gray-400 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-s font-black flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <div className="text-white font-bold text-s">{title}</div>
        <div className="text-gray-400 text-s mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionBasic() {
  return (
    <div className="flex flex-col gap-5">
      {/* 준비 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-purple-300 font-bold text-s border-b border-gray-700 pb-1">① 추첨 준비</h3>
        <Step num={1} title="프로그램 선택">
          상단 탭에서 <span className="text-yellow-300">뮤즈 / 퀸덤 / 홀릭</span> 중 하나를 클릭합니다.
          프로그램마다 이미지와 보상이 다르게 관리됩니다.
        </Step>
        <Step num={2} title="시그 구간 선택">
          <span className="text-yellow-300">1000~2000</span>, <span className="text-yellow-300">1000~3000</span> 등 원하는 범위를 선택합니다.
          특정 구간의 시그 이미지만 슬롯에 사용됩니다. 전체를 사용하려면 <span className="text-yellow-300">전체</span> 버튼을 클릭합니다.
        </Step>
        <Step num={3} title="슬롯 개수 선택">
          <span className="text-yellow-300">🎴</span>: 1개 슬롯 &nbsp;·&nbsp;
          <span className="text-yellow-300">🎴🎴🎴</span>: 3개 동시 추첨
        </Step>
        <Step num={4} title="이미지 로딩 확인">
          화면 중앙에 로딩 스피너가 사라지고,
          <span className="text-green-400"> "뮤즈 · 1000~3000 · 120개 이미지 로드됨"</span> 같은 문구가
          나타나면 준비 완료입니다. <span className="text-red-400">스피너가 돌아가는 동안 START를 누르지 마세요.</span>
        </Step>
      </div>

      {/* 진행 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-purple-300 font-bold text-s border-b border-gray-700 pb-1">② 추첨 진행</h3>
        <Step num={5} title="▶ START 클릭">
          슬롯이 빠르게 돌아가기 시작합니다. 상단 노란 경고등이 깜빡입니다.
          3개 슬롯 모드에서는 SLOT 1 → 2 → 3 순서로 0.3초 간격으로 시작됩니다.
        </Step>
        <Step num={6} title="자동 감속 후 정지">
          일정 시간(랜덤, 약 4~8초) 후 슬롯이 단계적으로 감속하며 멈춥니다.
        </Step>
        <Step num={7} title="보상 카드 확인">
          멈춘 슬롯 카드를 <span className="text-yellow-300">클릭</span>하면 카드가 뒤집히며
          아이콘 · 보상명 · 설명 · 시그 번호가 표시됩니다.
          결과는 하단 <span className="text-yellow-300">히스토리</span>에 자동 기록됩니다.
        </Step>
        <Step num={8} title="다시 추첨">
          바로 <span className="text-yellow-300">▶ START</span>를 눌러 재추첨하거나,
          <span className="text-yellow-300">🔄 새로고침</span>으로 슬롯을 초기화 후 시작할 수 있습니다.
        </Step>
      </div>
    </div>
  );
}

function SectionPick() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-gray-300 text-s leading-relaxed">
        슬롯이 돌아가는 도중 <span className="text-yellow-300">원하는 시그 번호</span>를 선택하면,
        해당 이미지에서 자연스럽게 감속 후 정지합니다.
        참가자가 직접 번호를 고르는 <span className="text-purple-300 font-bold">이벤트 연출</span>에 활용하세요.
      </p>

      {/* 흐름 도식 */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-s text-center">
        {[
          ["▶ START", "슬롯 시작"],
          ["→"],
          ["우측 패널", "슬롯 탭 선택"],
          ["→"],
          ["시그 번호", "클릭"],
          ["→"],
          ["감속 후", "자동 정지"],
        ].map((item, i) =>
          item.length === 1 ? (
            <span key={i} className="text-gray-500 text-base">{item[0]}</span>
          ) : (
            <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
              <div className="text-yellow-300 font-bold">{item[0]}</div>
              <div className="text-gray-400">{item[1]}</div>
            </div>
          )
        )}
      </div>

      {/* 상세 단계 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-purple-300 font-bold text-s border-b border-gray-700 pb-1">상세 단계</h3>
        <Step num={1} title="슬롯을 먼저 돌립니다">
          <span className="text-yellow-300">▶ START</span>를 눌러 최소 1개 이상의 슬롯이 돌아가는 상태여야 합니다.
        </Step>
        <Step num={2} title="우측 패널에서 슬롯 선택">
          패널 상단의 <span className="text-yellow-300">SLOT 1 / SLOT 2 / SLOT 3</span> 탭 중
          조종할 슬롯을 클릭합니다. 선택된 슬롯은 노란색으로 강조됩니다.
          (1개 슬롯 모드에서는 SLOT 1만 표시됩니다)
        </Step>
        <Step num={3} title="시그 번호 클릭">
          패널 아래 시그 번호 목록에서 원하는 번호를 클릭합니다.
          숫자 <span className="text-yellow-300">검색창</span>에 일부 숫자를 입력하면 목록을 필터링할 수 있습니다.
        </Step>
        <Step num={4} title="자동 감속 후 정지">
          클릭 즉시 멈추지 않고, <span className="text-yellow-300">약 2~3초</span> 동안 자연스럽게
          감속하면서 선택한 시그 번호 이미지에서 정지합니다.
        </Step>
      </div>

      <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3 text-s text-yellow-300 flex flex-col gap-1">
        <div className="font-bold">⚠️ 주의사항</div>
        <div>· START 없이 슬롯이 대기 중인 상태에서는 동작하지 않습니다.</div>
        <div>· 슬롯 탭을 먼저 선택해야 시그 번호 버튼이 활성화됩니다.</div>
        <div>· 번호 클릭 후에는 슬롯 선택이 자동으로 해제됩니다.</div>
      </div>
    </div>
  );
}

function SectionAdmin() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-gray-300 text-s">
        상단의 <span className="text-yellow-300">⚙️ 관리</span> 버튼을 클릭하면
        보상 설정 창이 열립니다. 보상 구성을 변경할 필요가 없다면
        <span className="text-gray-400"> 이 메뉴는 관리자만 사용합니다.</span>
      </p>

      <div className="flex flex-col gap-3">
        <h3 className="text-purple-300 font-bold text-s border-b border-gray-700 pb-1">보상 항목 구성</h3>
        <div className="grid grid-cols-2 gap-2 text-s">
          {[
            ["아이콘", "이모지 — 카드 뒷면에 크게 표시"],
            ["보상명", "예: 기여도 보상, 상금 보상"],
            ["설명", "예: 기여도 +500 지급"],
            ["확률(%)", "전체 합계가 반드시 100%"],
          ].map(([k, v]) => (
            <div key={k} className="bg-gray-800 rounded-lg p-2.5">
              <div className="text-yellow-300 font-bold">{k}</div>
              <div className="text-gray-400 mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-purple-300 font-bold text-s border-b border-gray-700 pb-1">주요 조작</h3>
        <div className="flex flex-col gap-2 text-sm">
          {[
            ["아이콘 변경", "각 항목 맨 왼쪽 아이콘 버튼 클릭 → 이모지 선택"],
            ["확률 자동 맞춤", "\"자동 맞춤\" 버튼 → 항목 수에 맞게 100% 균등 분배"],
            ["항목 추가", "하단 \"+ 보상 항목 추가\" 버튼"],
            ["항목 삭제", "각 항목 우측 ✕ 버튼"],
            ["순서 변경", "▲ / ▼ 버튼으로 위아래 이동"],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-2 bg-gray-800 rounded-lg p-2.5">
              <span className="text-purple-300 font-bold text-s shrink-0 mt-0.5">▸</span>
              <div>
                <span className="text-white font-bold text-s">{title}</span>
                <span className="text-gray-400 text-s"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-purple-300 font-bold text-s border-b border-gray-700 pb-1">저장</h3>
        <div className="text-s text-gray-300 leading-relaxed">
          보상명이 모두 입력되고 확률 합계가 정확히 <span className="text-yellow-300">100%</span>일 때만
          <span className="text-yellow-300"> 💾 저장</span> 버튼이 활성화됩니다.
          저장 성공 시 메인 화면 상단에 <span className="text-green-400">✅ HH:MM:SS 저장</span> 표시가 나타납니다.
        </div>
      </div>
    </div>
  );
}

function SectionFaq() {
  const items = [
    {
      q: "이미지가 거의 안 뜨고 슬롯이 바로 멈춰요",
      answers: [
        "로딩 스피너가 돌아가는 도중 START를 눌렀을 수 있습니다. 로딩이 완전히 끝난 뒤 START를 눌러 주세요.",
        "선택한 구간에 이미지가 거의 없을 수 있습니다. 하단에 \"해당 구간의 이미지가 없습니다\" 메시지가 뜨면 구간을 변경하거나 '전체'를 선택하세요.",
        "그래도 이상하면 프로그램/구간/슬롯 수 조합을 기록해 개발 담당자에게 전달해 주세요.",
      ],
    },
    {
      q: "원하는 번호를 클릭해도 멈추지 않아요",
      answers: [
        "먼저 ▶ START로 슬롯을 돌려야 합니다.",
        "우측 패널에서 SLOT 1 / 2 / 3 탭 중 하나를 선택해야 시그 번호 버튼이 활성화됩니다.",
        "이미 멈춰 있는 슬롯에는 적용되지 않습니다. 다시 START를 누른 뒤 시도하세요.",
      ],
    },
    {
      q: "3개 슬롯 중 하나만 이미지가 적게 나와요",
      answers: [
        "3개 슬롯 중 하나가 START 직후 잠깐 늦게 시작되는 것은 정상입니다. (0.3초 간격 딜레이)",
        "그래도 한 슬롯만 유독 이상하면 🔄 새로고침 후 다시 START를 눌러 주세요.",
      ],
    },
    {
      q: "보상 카드 뒷면에 이모지가 잘못 나와요",
      answers: [
        "⚙️ 관리 버튼 → 해당 프로그램 보상 설정에서 아이콘을 변경 후 저장하면 바로 반영됩니다.",
      ],
    },
  ];

  const [open, setOpen] = useState(null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-4 py-3 flex items-center justify-between gap-2"
          >
            <span className="text-white text-s font-bold">Q. {item.q}</span>
            <span className="text-gray-400 text-sm shrink-0">{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <div className="px-4 pb-3 flex flex-col gap-1.5">
              {item.answers.map((a, j) => (
                <div key={j} className="text-gray-300 text-s flex items-start gap-2">
                  <span className="text-purple-400 shrink-0">▸</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="bg-gray-800 rounded-xl p-3 text-s text-gray-400 mt-1">
        위 내용으로 해결이 안 되면 <span className="text-purple-300">프로그램 · 구간 · 슬롯 수</span>와
        증상을 메모해 <span className="text-yellow-300">개발 담당자</span>에게 전달해 주세요.
      </div>
    </div>
  );
}

const SECTION_MAP = {
  intro: SectionIntro,
  basic: SectionBasic,
  pick:  SectionPick,
  admin: SectionAdmin,
  faq:   SectionFaq,
};

// ─────────────────────────────────────────────
// ManualModal
// ─────────────────────────────────────────────
export function ManualModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("intro");
  const Content = SECTION_MAP[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg mx-4 border border-purple-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-white font-black text-lg">📖 이용 매뉴얼</h2>
            <p className="text-gray-500 text-xs mt-0.5">SIG SLOT 사용 가이드</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700"
          >✕</button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-4 pt-3 shrink-0 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-s font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto px-5 py-4 flex-1">
          <Content />
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3 border-t border-gray-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-s font-bold transition"
          >닫기</button>
        </div>
      </div>
    </div>
  );
}
