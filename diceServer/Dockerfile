FROM node:18-alpine

WORKDIR /app

# package.json, package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 프로젝트 파일 복사
COPY . .

# 포트 노출
EXPOSE 5001

# 서버 시작
CMD ["node", "index.js"]