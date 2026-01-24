/*********************************************************
 * CHAT CONFIG (Render backend)
 *********************************************************/

const backendBaseUrl = "https://new-try-zfki.onrender.com";

const classLevelSelect = document.getElementById("classLevel");
const subjectSelect = document.getElementById("subject");
const chapterSelect = document.getElementById("chapter");
const questionInput = document.getElementById("questionInput");
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chatWindow");
const questionForm = document.getElementById("questionForm");

const CHAPTERS = {
  Maths: [
    "Commercial Mathematics",
    "Algebra",
    "Geometry",
    "Mensuration",
    "Trigonometry",
  ],
  Physics: [
    "Force, Work, Power and Energy",
    "Light",
    "Sound",
    "Electricity and Magnetism",
    "Heat",
    "Modern Physics",
  ],
};

function populateChapters() {
  if (!subjectSelect || !chapterSelect) return;
  const subject = subjectSelect.value;
  chapterSelect.innerHTML = "";
  (CHAPTERS[subject] || []).forEach((ch) => {
    const opt = document.createElement("option");
    opt.value = ch;
    opt.textContent = ch;
    chapterSelect.appendChild(opt);
  });
}

if (subjectSelect) {
  subjectSelect.addEventListener("change", populateChapters);
  populateChapters();
}

/*********************************************************
 * GEMINI RESPONSE FORMATTER
 * Converts *important* → <strong>important</strong>
 *********************************************************/

function formatGeminiResponse(text) {
  if (!text) return "";

  return text
    // Escape HTML for safety
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Convert *text* to bold
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    // Line breaks
    .replace(/\n/g, "<br>");
}

/*********************************************************
 * CHAT UI
 *********************************************************/

function appendMessage(role, text, meta) {
  if (!chatWindow) return;

  const row = document.createElement("div");
  row.classList.add("message-row", role);

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  if (role === "bot" && meta) {
    const metaDiv = document.createElement("div");
    metaDiv.classList.add("meta-text");
    metaDiv.textContent = `${meta.class_level} • ${meta.subject} • ${meta.chapter}`;
    bubble.appendChild(metaDiv);
  }

  const p = document.createElement("div");

  if (role === "bot") {
    p.innerHTML = formatGeminiResponse(text);
  } else {
    p.innerText = text;
  }

  bubble.appendChild(p);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendQuestion() {
  if (!questionInput || !sendBtn) return;

  const question = questionInput.value.trim();
  if (!question) return;

  appendMessage("user", question);

  const originalBtnContent = sendBtn.innerHTML;

  questionInput.value = "";
  questionInput.disabled = true;
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<div class="send-spinner"></div>';

  try {
    const response = await fetch(`${backendBaseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_level: classLevelSelect?.value || "",
        subject: subjectSelect?.value || "",
        chapter: chapterSelect?.value || "",
        question,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      appendMessage(
        "bot",
        `Error: ${data.detail || data.error || "Something went wrong"}`
      );
    } else {
      appendMessage("bot", data.answer || "No answer received.", data.meta);
    }
  } catch {
    appendMessage("bot", "Network error. Please try again.");
  } finally {
    questionInput.disabled = false;
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalBtnContent || "Ask";
    questionInput.focus();
  }
}

if (sendBtn) {
  sendBtn.addEventListener("click", sendQuestion);
}

if (questionInput) {
  questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  });
}

if (questionForm) {
  questionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendQuestion();
  });
}

/*********************************************************
 * SUPABASE LOGIN
 *********************************************************/

const SUPABASE_URL = "https://ctquajydjitfjhqvezfz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cXVhanlkaml0ZmpocXZlemZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MjA1MzQsImV4cCI6MjA4MzE5NjUzNH0.3cenuqB4XffJdRQisJQhq7PS9_ybXDN7ExbsKfXx9gU";

let supabaseClient = null;
if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function login(event) {
  if (event) event.preventDefault();

  if (!supabaseClient) {
    alert("Supabase is not loaded on this page.");
    return;
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("❌ Wrong email or password");
    return;
  }

  window.location.href = "dashboard.html";
}

/*********************************************************
 * NAVBAR MENU + THEME TOGGLE
 *********************************************************/

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("menuDropdown");
  const themeToggle = document.getElementById("themeToggle");

  const savedTheme = localStorage.getItem("theme");
  const initialTheme =
    savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  document.body.setAttribute("data-theme", initialTheme);

  if (menuToggle && menuDropdown) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (
        !menuDropdown.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        menuDropdown.classList.remove("open");
      }
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
});
