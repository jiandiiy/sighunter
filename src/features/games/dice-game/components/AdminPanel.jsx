import { useState } from 'react';
import useDiceGame from '../hooks/useDiceGame';

export default function AdminPanel({ onClose }) {
  const { setWeightMode, setNextManualResult } = useDiceGame();
  const [localWeightMode, setLocalWeightMode] = useState('normal');
  const [manualDice1, setManualDice1] = useState(3);
  const [manualDice2, setManualDice2] = useState(4);

  const handleApply = () => {
    setWeightMode(localWeightMode);

    if (localWeightMode === 'manual') {
      setNextManualResult({
        dice1: Number(manualDice1),
        dice2: Number(manualDice2),
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 rounded-2xl w-full max-w-md mx-4 border border-purple-700 shadow-2xl p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-black text-lg">⚙️ 주사위 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl transition"
          >
            ✕
          </button>
        </div>

        {/* 가중치 모드 선택 */}
        <div className="space-y-3 mb-6">
          <p className="text-gray-400 font-bold text-sm">확률 모드</p>

          {[
            {
              value: 'normal',
              label: '일반 (균등)',
              description: '모든 숫자가 동일 확률',
            },
            {
              value: 'high_number',
              label: '높은 숫자 (6 확률 ↑)',
              description: '6이 더 자주 나옴',
            },
            {
              value: 'high_sum',
              label: '높은 합계 (12 확률 ↑)',
              description: '합계 12가 더 자주 나옴 (2개 모드)',
            },
            {
              value: 'manual',
              label: '수동 설정',
              description: '다음 결과값 지정',
            },
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => setLocalWeightMode(mode.value)}
              className={`w-full text-left px-4 py-3 rounded-lg transition border ${
                localWeightMode === mode.value
                  ? 'bg-purple-700 border-purple-400 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
              }`}
            >
              <p className="font-bold text-sm">{mode.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{mode.description}</p>
            </button>
          ))}
        </div>

        {/* 수동 설정 입력 */}
        {localWeightMode === 'manual' && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
            <p className="text-gray-400 font-bold text-sm mb-3">다음 결과값 지정</p>
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1">주사위 1</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={manualDice1}
                  onChange={(e) => setManualDice1(e.target.value)}
                  className="w-16 bg-gray-700 text-white rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">주사위 2</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={manualDice2}
                  onChange={(e) => setManualDice2(e.target.value)}
                  className="w-16 bg-gray-700 text-white rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <p className="text-gray-400">=</p>
              <p className="text-yellow-300 font-bold text-lg">
                {Number(manualDice1) + Number(manualDice2)}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 다음 ROLL 버튼 클릭 시 이 값이 나옵니다.
            </p>
          </div>
        )}

        {/* 설명 */}
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-300">
            💡 <strong>백엔드 연동 시:</strong> 이 설정은 프론트에서만 유지되므로, 서버에 전송하여 실제 확률 계산에 적용해야 합니다.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold text-sm transition"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold text-sm transition"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
