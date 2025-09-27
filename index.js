import puppeteer from "puppeteer";
import cron from "node-cron";
import axios from "axios";

// =================================================
//                    [설정]
// =================================================
const TARGET_URL = "https://m.booking.naver.com/booking/12/bizes/843881/items/6627331?area=pll&entry=pll&isProgramBizItem=false&lang=ko&startDateTime=2025-09-28T00%3A00%3A00%2B09%3A00&theme=place"; 
// ↑ 실제 예약하려는 상품의 상세 페이지 주소로 바꾸세요
const NTFY_TOPIC = "myreservation-for-naver"; // 추측하기 어려운 나만의 토픽 이름으로 바꾸세요
const CHECK_INTERVAL = "* * * * *"; // 1분마다 실행
// =================================================

async function checkReservation() {
  console.log(`[${new Date().toLocaleString()}] 예약 현황 확인 시작...`);

  const browser = await puppeteer.launch({
    headless: "new", // 최신 헤드리스 모드
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // 서버 환경에서 안정적인 실행을 위한 옵션
  });

  const page = await browser.newPage();
  
  try {
    await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

    // '선택' 또는 '예약' 이라는 텍스트를 포함하고, 비활성화(disabled)되지 않은 버튼 찾기
    const isAvailable = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
      return buttons.some(btn => 
        btn.textContent.includes('선택') || btn.textContent.includes('예약')
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
    await browser.close();
  }
}

async function sendNotification(message) {
  try {
    await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, message, {
      headers: { 
        'Title': '네이버 예약 빈자리 알림',
        'Priority': 'high', // 알림 우선순위 높임
        'Tags': 'tada' // 아이콘 추가 (예: 🎉)
      },
    });
  } catch (err) {
    console.error("알림 전송 실패:", err.message);
  }
}

console.log("✅ 네이버 예약 빈자리 알림 서비스를 시작합니다.");
console.log(`⏰ 확인 주기: ${CHECK_INTERVAL}`);

// 서버 시작 시 1회 즉시 실행
checkReservation();

// 설정된 주기로 반복 실행
cron.schedule(CHECK_INTERVAL, checkReservation);