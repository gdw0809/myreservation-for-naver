# Node.js와 브라우저가 모두 설치된 안정적인 이미지를 사용 (최신 LTS 버전)
FROM mcr.microsoft.com/playwright/node:jammy

# 이하 내용은 동일합니다.
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]