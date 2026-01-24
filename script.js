/*********************************************************
 * CHAT CONFIG (Render backend)
 *********************************************************/

const backendBaseUrl = "https://new-try-zfki.onrender.com";

const classLevelSelect = document.getElementById("classLevel");
const boardSelect = document.getElementById("board");
const subjectSelect = document.getElementById("subject");
const chapterInput = document.getElementById("chapter");
const questionInput = document.getElementById("questionInput");
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chatWindow");
const questionForm = document.getElementById("questionForm");

/*********************************************************
 * GEMINI RESPONSE FORMATTER
 *********************************************************/

function formatGeminiResponse(text) {
  if (!text) return "";

  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

/*********************************************************
 * CHAT UI
 *********************************************************/

function appendMessage(role, text, meta) {
  if (!chatWindow) return;

  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (role === "bot" && meta) {
    const metaDiv = document.createElement("div");
    metaDiv.className = "meta-text";
    metaDiv.textContent =
      `${meta.board} • Class ${meta.class_level} • ${meta.subject} • ${meta.chapter}`;
    bubble.appendChild(metaDiv);
  }

  const content = document.createElement("div");
  if (role === "bot") {
    content.innerHTML = formatGeminiResponse(text);
  } else {
    content.innerText = text;
  }

  bubble.appendChild(content);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/*********************************************************
 * SEND QUESTION (FIXED: BOARD ADDED)
 *********************************************************/

async function sendQuestion() {
  if (!questionInput || !sendBtn) return;

  const question = questionInput.value.trim();
  if (!question) return;

  appendMessage("user", question);

  questionInput.value = "";
  questionInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const response = await fetch(`${backendBaseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        board: boardSelect?.value || "ICSE",
        class_level: classLevelSelect?.value || "10",
        subject: subjectSelect?.value || "General",
        chapter: chapterInput?.value || "General",
        question,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      appendMessage(
        "bot",
        data.detail || "Something went wrong"
      );
    } else {
      appendMessage("bot", data.answer || "No answer received.", data.meta);
    }
  } catch {
    appendMessage("bot", "Network error. Please try again.");
  } finally {
    questionInput.disabled = false;
    sendBtn.disabled = false;
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
 * SUPABASE LOGIN (UNCHANGED)
 *********************************************************/

const SUPABASE_URL = "https://ctquajydjitfjhqvezfz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cXVhanlkaml0ZmpocXZlemZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MjA1MzQsImV4cCI6MjA4MzE5NjUzNH0.3cenuqB4XffJdRQisJQhq7PS9_ybXDN7ExbsKfXx9gU";

let supabaseClient = null;
if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

async function login(event) {
  if (event) event.preventDefault();
  if (!supabaseClient) return;

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    alert("Wrong email or password");
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

  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);

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
      const current = document.body.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
});
