const chatBox = document.getElementById("chatBox");
const optionsBox = document.getElementById("optionsBox");
const planBox = document.getElementById("planBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const aiStatus = document.getElementById("aiStatus");
const quickExitBtn = document.getElementById("quickExitBtn");
const stealthBtn = document.getElementById("stealthBtn");
const autoclearToggle = document.getElementById("autoclearToggle");
const call102 = document.getElementById("call102");
const call103 = document.getElementById("call103");

const state = {
  stealthMode: false,
  autoClear: false,
  city: "",
  age: "",
  risk: {
    safePlace: "",
    aggressorNearby: "",
    selfHarmRisk: "",
    urgentMedical: ""
  },
  distressType: "",
  plan: []
};

function updateAiStatus(text, online) {
  aiStatus.textContent = `AI: ${text}`;
  aiStatus.style.background = online ? "#d8f2e5" : "#f5dbe0";
  aiStatus.style.color = online ? "#18623d" : "#8f2335";
}

const resourcesByCity = {
  алматы: ["Кризисный центр: +7 (placeholder)", "Горлиния: +7 (placeholder)"],
  астана: ["Центр поддержки: +7 (placeholder)", "Горлиния: +7 (placeholder)"],
  шымкент: ["Кризисная помощь: +7 (placeholder)", "НПО помощь: +7 (placeholder)"]
};

function addMessage(text, sender = "bot") {
  const node = document.createElement("div");
  node.className = `msg ${sender}`;
  node.textContent = text;
  chatBox.appendChild(node);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setOptions(options = []) {
  optionsBox.innerHTML = "";
  options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = option.label;
    btn.addEventListener("click", option.action);
    optionsBox.appendChild(btn);
  });
}

function short(text, shortText) {
  return state.stealthMode && shortText ? shortText : text;
}

function startFlow() {
  addMessage("Привет. Я рядом, чтобы помочь сделать безопасные шаги.");
  addMessage(
    short(
      "Ты не обязана или не обязан рассказывать детали. Если есть непосредственная угроза жизни, лучше сразу звонить 102 или 103. Здесь мы можем пройти первые шаги вместе.",
      "Если опасно - 102/103. Я помогу короткими шагами."
    )
  );
  askCity();
}

function askCity() {
  addMessage("В каком городе или регионе ты сейчас?");
  setOptions([
    { label: "Алматы", action: () => handleCity("Алматы") },
    { label: "Астана", action: () => handleCity("Астана") },
    { label: "Шымкент", action: () => handleCity("Шымкент") },
    { label: "Другой", action: () => handleCity("Другой") }
  ]);
}

function handleCity(city) {
  state.city = city;
  addMessage(city, "user");
  setOptions([]);
  askAge();
}

function askAge() {
  addMessage("Тебе уже есть 18?");
  setOptions([
    { label: "Да", action: () => saveAge("18+") },
    { label: "Нет", action: () => saveAge("16-17") },
    { label: "Не хочу отвечать", action: () => saveAge("нет ответа") }
  ]);
}

function saveAge(value) {
  state.age = value;
  addMessage(value, "user");
  setOptions([]);
  askSafetyQuestions();
}

function askSafetyQuestions() {
  addMessage(short("Сейчас проверим 4 вопроса безопасности.", "4 вопроса безопасности."));
  askSafePlace();
}

function askSafePlace() {
  addMessage("Ты сейчас в безопасном месте?");
  setOptions([
    { label: "Да", action: () => setRisk("safePlace", "да", askAggressor) },
    { label: "Нет", action: () => setRisk("safePlace", "нет", askAggressor) },
    { label: "Не уверен(а)", action: () => setRisk("safePlace", "не уверен", askAggressor) }
  ]);
}

function askAggressor() {
  addMessage("Есть риск, что человек может быть рядом или выйти на тебя сегодня?");
  setOptions([
    { label: "Да", action: () => setRisk("aggressorNearby", "да", askSelfHarm) },
    { label: "Нет", action: () => setRisk("aggressorNearby", "нет", askSelfHarm) },
    { label: "Не знаю", action: () => setRisk("aggressorNearby", "не знаю", askSelfHarm) }
  ]);
}

function askSelfHarm() {
  addMessage("Есть мысли причинить себе вред или ощущение, что не справляешься?");
  setOptions([
    { label: "Да", action: () => setRisk("selfHarmRisk", "да", askMedical) },
    { label: "Нет", action: () => setRisk("selfHarmRisk", "нет", askMedical) },
    { label: "Затрудняюсь", action: () => setRisk("selfHarmRisk", "затрудняюсь", askMedical) }
  ]);
}

function askMedical() {
  addMessage("Нужна срочная медицинская помощь из-за боли, травм или кровотечения?");
  setOptions([
    { label: "Да", action: () => setRisk("urgentMedical", "да", routeByRisk) },
    { label: "Нет", action: () => setRisk("urgentMedical", "нет", routeByRisk) },
    { label: "Не знаю", action: () => setRisk("urgentMedical", "не знаю", routeByRisk) }
  ]);
}

function setRisk(key, value, next) {
  state.risk[key] = value;
  addMessage(value, "user");
  setOptions([]);
  next();
}

function routeByRisk() {
  const { safePlace, aggressorNearby, selfHarmRisk, urgentMedical } = state.risk;
  if (safePlace !== "да" || aggressorNearby === "да") {
    emergencySafetyBranch();
    return;
  }
  if (selfHarmRisk === "да") {
    crisisSupportBranch();
    return;
  }
  if (urgentMedical === "да") {
    medicalBranch();
    return;
  }
  stabilizationBranch();
}

function emergencySafetyBranch() {
  addMessage(
    short(
      "Сейчас главный приоритет - твоя безопасность. Мини-план: 1) переместиться в безопасное место, 2) написать или позвонить доверенному человеку, 3) при угрозе сразу 102/103.",
      "Приоритет: безопасное место, контакт с доверенным, 102/103."
    )
  );
  state.plan.push("Переместиться в безопасное место.");
  state.plan.push("Связаться с доверенным человеком.");
  state.plan.push("При угрозе вызвать 102/103.");
  stabilizationBranch();
}

function crisisSupportBranch() {
  addMessage(
    short(
      "Спасибо, что сказала или сказал об этом. Ты не обязана или не обязан оставаться с этим в одиночку. Сейчас важно связаться с живой поддержкой: 103, близкий человек или кризисная линия.",
      "Ты не одна или не один. Нужен живой контакт: 103 или близкий."
    )
  );
  addMessage("Сделаем одну короткую стабилизацию: вдох 4 сек, выдох 6 сек, 5 циклов.");
  state.plan.push("Связаться с живой поддержкой (103/близкий).");
  state.plan.push("Повторить дыхание 4/6 в течение 1-2 минут.");
  stabilizationBranch();
}

function medicalBranch() {
  addMessage(
    "Если есть физические симптомы, лучше обратиться в 103, приемный покой или травмпункт. Это важно для здоровья и бережной фиксации состояния."
  );
  state.plan.push("Обратиться за медицинской помощью (103/приемный покой).");
  stabilizationBranch();
}

function stabilizationBranch() {
  addMessage("Что сейчас сильнее всего ощущается?");
  setOptions([
    { label: "Паника", action: () => selectDistress("паника") },
    { label: "Оцепенение", action: () => selectDistress("оцепенение") },
    { label: "Ощущение 'не здесь'", action: () => selectDistress("диссоциация") },
    { label: "Сильная тревога", action: () => selectDistress("тревога") }
  ]);
}

function selectDistress(type) {
  state.distressType = type;
  addMessage(type, "user");
  setOptions([]);

  if (type === "паника") {
    addMessage("Техника 60 секунд: 4 вдоха через нос (по 4 сек), затем длинный выдох (6-8 сек).");
  } else if (type === "диссоциация") {
    addMessage("Заземление 5-4-3-2-1: назови 5 предметов, 4 ощущения телом, 3 звука, 2 запаха, 1 вкус.");
  } else if (type === "оцепенение") {
    addMessage("Микродвижения: сожми и разожми кулаки 10 раз, поверни голову вправо-влево, назови цвет 3 предметов вокруг.");
  } else {
    addMessage("При тревоге: поставь обе стопы на пол, выдохни медленно и назови 3 вещи, которые сейчас под контролем.");
  }

  addMessage("Стало хотя бы на 10% легче?");
  setOptions([
    { label: "Да", action: () => afterStabilization(true) },
    { label: "Пока нет", action: () => afterStabilization(false) }
  ]);
}

function afterStabilization(helped) {
  addMessage(helped ? "Да" : "Пока нет", "user");
  setOptions([]);
  if (!helped) {
    addMessage("Нормально, если с первого раза не сработало. Давай попробуем еще одну короткую технику.");
    stabilizationBranch();
    return;
  }
  cognitiveSupport();
}

function cognitiveSupport() {
  addMessage("То, что произошло, не твоя вина. Ответственность всегда на том, кто причинил вред.");
  addMessage("Какая мысль мучает сильнее всего?");
  setOptions([
    { label: "Меня осудят", action: () => processThought("осудят") },
    { label: "Мне не поверят", action: () => processThought("не поверят") },
    { label: "Я виноват(а)", action: () => processThought("вина") },
    { label: "Другое", action: () => processThought("другое") }
  ]);
}

function processThought(type) {
  addMessage(type, "user");
  setOptions([]);
  const map = {
    осудят: "Осуждение окружающих не определяет правду о твоем опыте. Ты имеешь право на защиту и поддержку.",
    "не поверят": "Сомнения других не отменяют твоих чувств и фактов. Поддержка и официальные шаги возможны поэтапно.",
    вина: "Реакции тела в стрессе (ступор, растерянность, молчание) - нормальны. Это не делает тебя виновной или виноватым.",
    другое: "Твои чувства важны. Мы можем идти маленькими шагами: безопасность, поддержка, помощь."
  };
  addMessage(map[type]);
  officialHelpBranch();
}

function officialHelpBranch() {
  addMessage("Хочешь выбрать следующий шаг?");
  setOptions([
    { label: "Обратиться сейчас", action: () => choosePath("сейчас") },
    { label: "Подготовиться и обратиться позже", action: () => choosePath("позже") }
  ]);
}

function choosePath(path) {
  addMessage(path === "сейчас" ? "Обратиться сейчас" : "Подготовиться и обратиться позже", "user");
  setOptions([]);
  if (path === "сейчас") {
    addMessage("План: 1) 102 или отделение, 2) медицинская фиксация, 3) заявление, 4) сопровождение доверенным человеком.");
    state.plan.push("При готовности: 102/отделение + мед. фиксация.");
  } else {
    addMessage("План подготовки: собрать документы, выбрать безопасного сопровождающего, записать хронологию фактов, сохранить контакты помощи.");
    state.plan.push("Подготовить документы и контакты помощи.");
  }
  trustSupportBranch();
}

function trustSupportBranch() {
  addMessage("Есть человек, которому ты в целом доверяешь?");
  setOptions([
    { label: "Да", action: () => trustAnswer("да") },
    { label: "Нет", action: () => trustAnswer("нет") },
    { label: "Не знаю", action: () => trustAnswer("не знаю") }
  ]);
}

function trustAnswer(answer) {
  addMessage(answer, "user");
  setOptions([]);
  if (answer === "да") {
    addMessage("Можно написать коротко: 'Мне нужна поддержка. Побудь со мной, пожалуйста.'");
    state.plan.push("Связаться с доверенным человеком.");
  } else {
    addMessage("Если пока нет доверенного человека, опора может быть на горячие линии и кризисные службы.");
    state.plan.push("Использовать профессиональные службы поддержки.");
  }
  showResources();
  buildPlan24h();
}

function showResources() {
  const cityKey = state.city.toLowerCase();
  const cityList = resourcesByCity[cityKey] || ["Кризисный центр: [добавьте локальный контакт]", "Горячая линия: [добавьте контакт]"];
  addMessage(`Ресурсы для ${state.city}:`);
  addMessage(`Экстренно: 102, 103\n${cityList.join("\n")}`);
}

function buildPlan24h() {
  const basePlan = [
    "Обеспечить физическую безопасность и доступ к связи.",
    "Минимальная забота о теле: вода, еда, отдых.",
    "Сохранить важные контакты: 102, 103, кризисный центр."
  ];
  const uniquePlan = [...new Set([...state.plan, ...basePlan])];
  const html = [
    "<strong>Персональный план на ближайшие 24 часа:</strong>",
    ...uniquePlan.map((item, i) => `${i + 1}. ${item}`),
    "4. Если станет хуже - сразу обратиться за живой помощью.",
    "5. Возвращайся в чат, чтобы пройти шаги еще раз."
  ];
  planBox.innerHTML = `<p>${html.join("<br/>")}</p>`;
  addMessage("Готово. Мы собрали план. Ты не одна и не один, и обращаться за помощью - нормально.");
}

function quickExit() {
  document.body.innerHTML = "<main style='font-family:Segoe UI,Arial,sans-serif;padding:24px'><h2>Погода сегодня</h2><p>Солнечно, +19°C. Небольшой ветер.</p></main>";
}

function clearChat() {
  chatBox.innerHTML = "";
  optionsBox.innerHTML = "";
  planBox.innerHTML = "<p>История очищена.</p>";
}

function buildContextSnapshot() {
  return `Город: ${state.city || "не указан"}, Возраст: ${state.age || "не указан"}, Риски: ${JSON.stringify(state.risk)}`;
}

/** База API: 127.0.0.1 надёжнее localhost на Windows (IPv6). */
function apiOrigin() {
  const loc = window.location;
  if (loc.protocol === "file:") {
    return "http://127.0.0.1:3000";
  }
  const isLocal =
    loc.hostname === "localhost" || loc.hostname === "127.0.0.1";
  if (isLocal && loc.port && loc.port !== "3000") {
    return "http://127.0.0.1:3000";
  }
  return "";
}

function apiChatUrl() {
  const o = apiOrigin();
  return o ? `${o}/api/chat` : "/api/chat";
}

function apiHealthUrl() {
  const o = apiOrigin();
  return o ? `${o}/api/health` : "/api/health";
}

async function askAi(message) {
  let response;
  try {
    response = await fetch(apiChatUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context: buildContextSnapshot(),
        shortMode: state.stealthMode
      })
    });
  } catch (networkErr) {
    const err = new Error("Network error");
    err.detail =
      networkErr && networkErr.message
        ? networkErr.message
        : "Не удалось выполнить запрос (сервер не запущен или блокировка сети).";
    throw err;
  }
  if (!response.ok) {
    let detail = "";
    try {
      const err = await response.json();
      detail = err.details || err.error || "";
    } catch {
      detail = await response.text();
    }
    const err = new Error("API request failed");
    err.detail = typeof detail === "string" ? detail.slice(0, 600) : "";
    throw err;
  }
  const data = await response.json();
  return data.reply;
}

async function handleUserInput() {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  userInput.value = "";
  sendBtn.disabled = true;

  const lower = text.toLowerCase();
  if (lower.includes("102") || lower.includes("полиц") || lower.includes("угроза")) {
    addMessage("Экстренно: 102. Если есть угроза, приоритет - безопасность и немедленный вызов.");
    sendBtn.disabled = false;
    return;
  }
  if (lower.includes("103") || lower.includes("скор") || lower.includes("кров")) {
    addMessage("Экстренно: 103. При боли, травмах или кровотечении лучше обратиться сразу.");
    sendBtn.disabled = false;
    return;
  }

  const typing = document.createElement("div");
  typing.className = "msg bot";
  typing.textContent = state.stealthMode ? "..." : "AI формирует ответ...";
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const reply = await askAi(text);
    typing.remove();
    addMessage(reply);
    updateAiStatus("online", true);
  } catch (error) {
    typing.remove();
    updateAiStatus("offline", false);
    addMessage(
      "AI временно недоступен. Базовая поддержка: медленный выдох 6-8 сек, опора на безопасное место, при угрозе 102/103."
    );
    addMessage(
      "Подсказка: запустите сервер командой npm run dev и откройте страницу по адресу http://127.0.0.1:3000 (не через «Открыть файл» и не с другого порта Live Server)."
    );
    if (error && error.detail) {
      addMessage(`Техническая подсказка: ${error.detail}`);
    }
  } finally {
    sendBtn.disabled = false;
  }
}

quickExitBtn.addEventListener("click", quickExit);
stealthBtn.addEventListener("click", () => {
  state.stealthMode = !state.stealthMode;
  stealthBtn.textContent = `Режим коротких ответов: ${state.stealthMode ? "вкл" : "выкл"}`;
  addMessage(state.stealthMode ? "Короткий режим включен." : "Короткий режим выключен.");
});

autoclearToggle.addEventListener("change", () => {
  state.autoClear = autoclearToggle.checked;
  addMessage(state.autoClear ? "Автоочистка включена." : "Автоочистка выключена.");
});

call102.addEventListener("click", () => addMessage("Экстренный номер: 102. При угрозе действуй немедленно."));
call103.addEventListener("click", () => addMessage("Экстренный номер: 103. При травмах и сильной боли лучше обратиться сразу."));

sendBtn.addEventListener("click", handleUserInput);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUserInput();
});

setInterval(() => {
  if (state.autoClear && chatBox.children.length > 0) {
    clearChat();
  }
}, 30000);

startFlow();

async function bootstrapAiStatus() {
  updateAiStatus("checking...", false);
  try {
    const healthRes = await fetch(apiHealthUrl());
    if (!healthRes.ok) {
      throw new Error("health not ok");
    }
    const health = await healthRes.json();
    if (!health.hasGeminiKey) {
      updateAiStatus("no key", false);
      addMessage(
        "В .env не найден GEMINI_API_KEY (или ключ слишком короткий). Создайте ключ в Google AI Studio и пропишите его в .env, затем перезапустите npm run dev."
      );
      return;
    }
  } catch {
    updateAiStatus("offline", false);
    addMessage(
      "Сервер не отвечает. Запустите в папке проекта: npm run dev и откройте сайт по адресу http://127.0.0.1:3000"
    );
    return;
  }

  try {
    await askAi("ок");
    updateAiStatus("online", true);
  } catch (e) {
    updateAiStatus("offline", false);
    addMessage(
      "Сервер работает, но Gemini не ответил (ключ, лимит или модель). Ниже — текст ошибки от API."
    );
    if (e && e.detail) {
      addMessage(String(e.detail).slice(0, 800));
    }
  }
}

bootstrapAiStatus();
