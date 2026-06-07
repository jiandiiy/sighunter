const express = require("express");
const router = express.Router();

/**
 * POST /api/telegram/notify
 * Body: { program, group, fileNames }
 *
 * 환경변수 필요:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */
router.post("/notify", async (req, res) => {
  try {
    const { program, group, fileNames } = req.body;

    // 환경변수 확인
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({
        error: "Telegram 환경변수가 설정되지 않았습니다",
      });
    }

    if (!program || !group || !fileNames || fileNames.length === 0) {
      return res.status(400).json({
        error: "program, group, fileNames가 필요합니다",
      });
    }

    // 프로그램명 변환
    const programLabel = {
      muse: "뮤즈",
      queendom: "퀸덤",
      holic: "홀릭",
    }[program] ?? program;

    // 파일 목록 포맷팅
    const fileList = fileNames.map((name) => `  • ${name}`).join("\n");

    // Telegram 메시지 구성
    const message = `📸 시그 이미지 업로드 완료\n\n📁 ${programLabel} / ${group}\n📊 ${fileNames.length}개 파일\n\n${fileList}`;

    // Telegram Bot API 호출
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error("[Telegram API Error]", errorData);
      return res.status(500).json({
        error: "Telegram API 오류",
        details: errorData,
      });
    }

    const result = await telegramResponse.json();
    console.log("[Telegram] ✅ 메시지 전송 성공", result.result.message_id);

    return res.json({
      success: true,
      message: "Telegram 알림 전송 성공",
      messageId: result.result.message_id,
    });
  } catch (err) {
    console.error("[Telegram Route Error]", err);
    return res.status(500).json({
      error: "서버 오류",
      message: err.message,
    });
  }
});

module.exports = router;