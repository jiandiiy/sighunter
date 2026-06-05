// diceServer/index.js
// Dice Game 전용 백엔드 서버 (포트 5001)

const express = require('express');
const cors = require('cors');
const diceRoutes = require('./routes/diceRoutes');

const app = express();
const PORT = process.env.DICE_PORT || 5001;

// CORS 설정 - 환경에 따라 다르게
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sighunter.vercel.app',  // ✅ 프로덕션 추가
    ];

    // origin이 없으면 (같은 도메인 요청) 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
};

// CORS 미들웨어 - 모든 요청에 적용 (OPTIONS 포함)
app.use(cors(corsOptions));

// JSON 본문 파싱
app.use(express.json());

// Dice Game API 라우트
app.use('/api/dice', diceRoutes);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'Dice Game Server is running', port: PORT });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🎲 Dice Game Server listening on port ${PORT}`);
});