# Node.js와 브라우저가 모두 설치된 안정적인 이미지를 사용
FROM mcr.microsoft.com/playwright/node:18-jammy

# 작업 폴더 설정
WORKDIR /usr/src/app

# 의존성 설치 (가벼운 패키지만 설치하므로 빌드 제한에 걸리지 않음)
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 앱 실행
CMD ["npm", "start"]