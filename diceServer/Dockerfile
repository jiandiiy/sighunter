FROM node:18-alpine

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 나머지 코드 복사
COPY . .

# 헬스 체크 (선택사항)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5001), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Railway는 PORT 환경변수를 자동 할당
CMD ["node", "index.js"]