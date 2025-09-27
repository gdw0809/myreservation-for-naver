import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import cron from "node-cron";
import axios from "axios";

// =================================================
//                    [설정]
// =================================================
// 1. 요청하신 원래 URL로 복원
const TARGET_URL = "https://m.booking.naver.com/booking/12/bizes/843881/items/6627331?area=pll&entry=pll&isProgramBizItem=false&lang=ko&startDateTime=2025-09-28T00%3A00%3A00%2B09%3A00&theme=place";
const NTFY_TOPIC = "my-naver-alert-a1b2c3d4"; 
const CHECK_INTERVAL = "* * * * *"; // 1분마다 실행
// =================================================

async function checkReservation() {
  console.log(`[${new Date().toLocaleString()}] 예약 현황 확인 시작...`);
  
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

    // 2. 빈자리 확인 로직은 '오전' 또는 '오후' 텍스트가 있는 버튼으로 유지
    const isAvailable = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
      return buttons.some(btn => 
        btn.textContent.includes('오전') || btn.textContent.includes('오후')
      );
    });

    if (isAvailable) {
      console.log("🎉 빈자리 발견! 푸시 알림을 보냅니다.");
      await sendNotification("🚨 네이버 예약에 빈자리가 생겼습니다! 바로 확인하세요!");
    } else {
      console.log("😴 빈자리 없음. 다음 확인까지 대기합니다.");
    }
  } catch (error) {
    console.error("페이지 확인 중 오류 발생:", error.message);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

async function sendNotification(message) {
  try {
    await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, message, {
      headers: { 
        'Title': '네이버 예약 빈자리 알림',
        'Priority': 'high',
        'Tags': 'tada'
      },
    });
  } catch (err) {
    console.error("알림 전송 실패:", err.message);
  }
}

console.log("✅ 네이버 예약 빈자리 알림 서비스를 시작합니다.");
console.log(`⏰ 확인 주기: ${CHECK_INTERVAL}`);

checkReservation();
cron.schedule(CHECK_INTERVAL, checkReservation);