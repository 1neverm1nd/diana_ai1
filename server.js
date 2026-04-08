const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT = `
Ты AI-ассистент учебного проекта "Вместе" (психологическая поддержка в кризисе).
Правила:
1) Пиши по-русски, теплым и спокойным тоном.
2) Не ставь диагнозы и не обвиняй пользователя.
3) При признаках непосредственной угрозы всегда приоритет: безопасность и экстренные службы 102/103.
4) Ответ структурируй коротко: поддержка -> 2-4 практических шага -> мягкое приглашение к живой помощи.
5) Избегай графических описаний насилия и сложной юридической терминологии.
6) Если пользователь просит "коротко", отвечай 1-3 короткими фразами.
`.trim();

/** Стабильная цепочка: сначала быстрая новая модель, потом более доступные резервные. */
const FALLBACK_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, context, shortMode } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Get a key at https://aistudio.google.com/apikey"
      });
    }

    const primary = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
    const models = [...new Set([primary, ...FALLBACK_MODELS])];

    const userText = `
Контекст: ${context || "нет"}
Режим коротких ответов: ${shortMode ? "да" : "нет"}
Сообщение пользователя: ${message}
`.trim();

    const ai = new GoogleGenAI({ apiKey });

    let lastErr = null;
    for (const model of models) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userText,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.5
            }
          });

          const text = typeof response.text === "string" ? response.text : "";
          if (text.trim()) {
            return res.json({ reply: text, modelUsed: model, attempt });
          }
          lastErr = { message: "empty text", model, attempt };
          break;
        } catch (e) {
          const status = e.status;
          lastErr = {
            message: e.message || String(e),
            status,
            model,
            attempt
          };

          // При 503 обычно помогает короткий backoff и повтор.
          if (status === 503 && attempt < 3) {
            await sleep(500 * attempt);
            continue;
          }
          break;
        }
      }
    }

    const details = JSON.stringify(lastErr, null, 2).slice(0, 2000);
    return res.status(502).json({
      error: "Gemini API: не удалось получить ответ ни с одной модели",
      details
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.get("/api/health", (req, res) => {
  const key = process.env.GEMINI_API_KEY || "";
  res.json({
    ok: true,
    hasGeminiKey: key.length > 20,
    port: Number(PORT),
    sdk: "@google/genai"
  });
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Vmeste app running: http://localhost:${PORT}`);
  console.log("AI: Google Gemini (@google/genai, GEMINI_API_KEY)");
});
