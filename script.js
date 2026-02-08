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
  role === "bot"
    ? (content.innerHTML = formatGeminiResponse(text))
    : (content.innerText = text);

  bubble.appendChild(content);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/*********************************************************
 * SEND QUESTION
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
      appendMessage("bot", data.detail || "Something went wrong");
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

sendBtn?.addEventListener("click", sendQuestion);
questionInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendQuestion();
  }
});
questionForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  sendQuestion();
});

/*********************************************************
 * SUPABASE CONFIG
 *********************************************************/
const SUPABASE_URL = "https://ctquajydjitfjhqvezfz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cXVhanlkaml0ZmpocXZlemZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MjA1MzQsImV4cCI6MjA4MzE5NjUzNH0.3cenuqB4XffJdRQisJQhq7PS9_ybXDN7ExbsKfXx9gU";

const supabaseClient =
  typeof supabase !== "undefined"
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

/*********************************************************
 * AUTH MESSAGE HELPER
 *********************************************************/
function showAuthMessage(text, type = "error") {
  const box = document.getElementById("authMessage");
  if (!box) return;

  box.textContent = text;
  box.className = `auth-message ${type}`;
  box.style.display = "block";
}

/*********************************************************
 * EMAIL LOGIN
 *********************************************************/
async function login(event) {
  event.preventDefault();
  if (!supabaseClient) return;

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    showAuthMessage("Please enter email and password.", "error");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showAuthMessage("Invalid login or email not confirmed.", "error");
    return;
  }

  showAuthMessage("Login successful. Redirecting…", "success");
  setTimeout(() => (window.location.href = "dashboard.html"), 800);
}

/*********************************************************
 * EMAIL SIGNUP
 *********************************************************/
async function signup(event) {
  event.preventDefault();
  if (!supabaseClient) return;

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    showAuthMessage("Please enter email and password.", "error");
    return;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (password.length < 6 || !hasLetter || !hasNumber) {
    showAuthMessage(
      "Password must be at least 6 characters and include letters and numbers.",
      "error"
    );
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    showAuthMessage("Account already exists or invalid email.", "error");
    return;
  }

  showAuthMessage(
    "Confirmation email sent. Please verify and login.",
    "success"
  );
}

/*********************************************************
 * GOOGLE LOGIN (LOGIN PAGE — BLOCK NEW USERS)
 *********************************************************/
async function googleLogin() {
  if (!supabaseClient) return;

  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/login.html",
    },
  });
}

/*********************************************************
 * GOOGLE SIGNUP (SIGNUP PAGE — CREATE ONLY)
 *********************************************************/
async function googleSignup() {
  if (!supabaseClient) return;

  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/signup.html",
    },
  });
}

/*********************************************************
 * GOOGLE RETURN HANDLER (LOGIN / SIGNUP LOGIC)
 *********************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  if (!supabaseClient) return;

  const { data } = await supabaseClient.auth.getUser();
  if (!data?.user) return;

  const user = data.user;
  const isLogin = location.pathname.includes("login");
  const isSignup = location.pathname.includes("signup");

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  /* SIGNUP PAGE */
  if (isSignup) {
    if (!profile) {
      await supabaseClient.from("profiles").insert({
        id: user.id,
        email: user.email,
      });
    }

    showAuthMessage("Account created successfully. Please login.", "success");
    await supabaseClient.auth.signOut();
    return;
  }

  /* LOGIN PAGE */
  if (isLogin) {
    if (!profile) {
      await supabaseClient.auth.signOut();
      showAuthMessage(
        "Account not found. Please sign up first.",
        "error"
      );
      return;
    }

    window.location.href = "dashboard.html";
  }
});

/*********************************************************
 * NAVBAR + THEME
 *********************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const menuDropdown = document.getElementById("menuDropdown");
  const themeToggle = document.getElementById("themeToggle");

  document.body.setAttribute(
    "data-theme",
    localStorage.getItem("theme") || "dark"
  );

  menuToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    menuDropdown?.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (
      menuDropdown &&
      !menuDropdown.contains(e.target) &&
      !menuToggle?.contains(e.target)
    ) {
      menuDropdown.classList.remove("open");
    }
  });

  themeToggle?.addEventListener("click", () => {
    const next =
      document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem("theme", next);
  });
});
async function logout() {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Logout failed. Try again.");
    return;
  }

  // Optional: clear local storage (theme, UI prefs stay if you want)
  localStorage.removeItem("supabase.auth.token");

  // Redirect to login
  window.location.href = "login.html";
}
