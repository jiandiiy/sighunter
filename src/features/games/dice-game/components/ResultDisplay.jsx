import { motion } from 'framer-motion';
import useDiceGame from '../hooks/useDiceGame';

export default function ResultDisplay() {
  // ⚠️ 각각 별도의 셀렉터로 구독 (객체 분산 방지)
  const mode = useDiceGame((state) => state.mode);
  const phase = useDiceGame((state) => state.phase);
  const result = useDiceGame((state) => state.result);

  // 결과가 없거나 idle 상태면 렌더링 X
  if (!result || phase === 'idle') {
    return null;
  }

  const { dice1, dice2, sum, specialEffect } = result;
  const isSpecial = specialEffect !== null && specialEffect !== undefined;

  // ────────────────────────────────────────────
  // 애니메이션 variants
  // ────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: 'backOut' },
    },
  };

  const specialEffectVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.6, duration: 0.4, ease: 'backOut' },
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 1.5, repeat: Infinity },
    },
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-4 mt-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 결과값 표시 */}
      <motion.div
        className="bg-gray-800/80 backdrop-blur rounded-2xl px-8 py-6 border border-purple-600/50 shadow-lg"
        variants={itemVariants}
        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
      >
        {mode === 1 ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">결과</p>
            <motion.p
              className="text-5xl font-black text-yellow-300"
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 100 }}
            >
              {dice1}
            </motion.p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">주사위 1 + 주사위 2 | 합계</p>
            <div className="flex items-end justify-center gap-4">
              {/* 주사위 1 */}
              <motion.div variants={itemVariants}>
                <motion.p
                  className="text-4xl font-black text-yellow-300"
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
                >
                  {dice1}
                </motion.p>
              </motion.div>

              <p className="text-2xl text-gray-500 mb-1">+</p>

              {/* 주사위 2 */}
              <motion.div variants={itemVariants}>
                <motion.p
                  className="text-4xl font-black text-yellow-300"
                  initial={{ scale: 0.5, rotate: 10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.4, type: 'spring' }}
                >
                  {dice2}
                </motion.p>
              </motion.div>

              <p className="text-2xl text-gray-500 mb-1">|</p>

              {/* 합계 */}
              <motion.div variants={itemVariants}>
                <motion.p
                  className="text-5xl font-black text-green-400"
                  initial={{ scale: 0, rotate: 360 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
                >
                  {sum}
                </motion.p>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>

      {/* 특별 이펙트 표시 */}
      {isSpecial && (
        <motion.div
          className="text-center"
          variants={specialEffectVariants}
          initial="hidden"
          animate={['visible', 'pulse']}
        >
          {specialEffect === 'double' && (
            <p className="text-2xl font-black text-pink-400">
              🎉 더블! ({dice1} + {dice1})
            </p>
          )}
          {specialEffect === 'max' && (
            <p className="text-2xl font-black text-yellow-400">
              ✨ 최대값! {mode === 1 ? '6' : '12'}
            </p>
          )}
        </motion.div>
      )}

      {/* Flipped 상태에서만 닫기 안내 */}
      {phase === 'flipped' && (
        <motion.p
          className="text-xs text-gray-500 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          주사위를 클릭하거나 [초기화] 버튼을 눌러 다시 시작하세요
        </motion.p>
      )}
    </motion.div>
  );
}