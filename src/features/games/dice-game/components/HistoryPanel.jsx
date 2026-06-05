import useDiceGame from '../hooks/useDiceGame';

export default function HistoryPanel() {
  const { history } = useDiceGame();

  if (history.length === 0) {
    return (
      <div className="mt-10 text-center text-gray-600 text-sm">
        아직 게임 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-10 w-full max-w-2xl mx-auto">
      <h3 className="text-gray-400 font-bold text-sm mb-3">📋 최근 기록</h3>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-wrap gap-2">
          {history.map((record, idx) => (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                record.specialEffect
                  ? 'bg-gradient-to-r from-yellow-600 to-pink-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={new Date(record.timestamp).toLocaleTimeString()}
            >
              {record.dice2 !== null ? (
                <>
                  {record.dice1}+{record.dice2}
                  <span className="text-yellow-200 ml-1">=</span>
                  <span className="text-green-300 ml-1 font-black">{record.sum}</span>
                </>
              ) : (
                <span className="text-yellow-300 font-black">{record.dice1}</span>
              )}
              {record.specialEffect === 'double' && ' 🎉'}
              {record.specialEffect === 'max' && ' ✨'}
            </div>
          ))}
        </div>

        {/* 통계 */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex gap-6 text-xs text-gray-400">
          <div>
            <p className="text-gray-600">총 횟수</p>
            <p className="text-white font-bold">{history.length}</p>
          </div>
          <div>
            <p className="text-gray-600">더블</p>
            <p className="text-pink-400 font-bold">
              {history.filter((r) => r.specialEffect === 'double').length}
            </p>
          </div>
          <div>
            <p className="text-gray-600">최대값</p>
            <p className="text-yellow-400 font-bold">
              {history.filter((r) => r.specialEffect === 'max').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
