import useDiceGame from '../hooks/useDiceGame';

export default function ModeSelector() {
  const { mode, setMode, isRolling } = useDiceGame();
  const rolling = isRolling();

  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => setMode(1)}
        disabled={rolling}
        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition ${
          mode === 1
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        } ${rolling ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        🎲 1개 모드
      </button>

      <button
        onClick={() => setMode(2)}
        disabled={rolling}
        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition ${
          mode === 2
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        } ${rolling ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        🎲🎲 2개 모드
      </button>
    </div>
  );
}