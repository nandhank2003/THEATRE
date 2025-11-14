// =============================
// 🎬 MALABAR CINEHUB LOGIN / SIGNUP JS
// =============================

// =============================
// 🔍 AUTO-DETECT BACKEND URL (FINAL FIX)
// =============================
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// 👉 LOCAL → http://localhost:5000
// 👉 RENDER → "" (same domain)
const API_BASE = isLocal ? "http://localhost:5000" : "";

console.log("🌐 USING API:", API_BASE);

// =============================
// 🧭 FORM TOGGLE
// =============================
const toggleFormLinks = document.querySelectorAll(".toggle-form");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const otpSection = document.getElementById("otpSection");

function showOnly(target) {
  [loginForm, signupForm, otpSection].forEach((el) => {
    if (el) el.classList.add("hidden");
  });
  if (target) target.classList.remove("hidden");
}

toggleFormLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.dataset.target;
    target === "signup" ? showOnly(signupForm) : showOnly(loginForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// =============================
// 👁 PASSWORD VISIBILITY TOGGLE
// =============================
document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    const eye = button.querySelector(".eye-icon");

    if (target.type === "password") {
      target.type = "text";
      eye.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>`;
    } else {
      target.type = "password";
      eye.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>`;
    }
  });
});

// =============================
// 🔔 NOTIFICATION SYSTEM
// =============================
function showNotification(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3500);
}

// =============================
// 🔑 LOGIN HANDLER
// =============================
const loginFormEl = loginForm?.querySelector(".auth-form");

if (loginFormEl) {
  loginFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    if (!email || !password)
      return showNotification("⚠️ Please fill all fields", "error");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      const sessionUser = {
        _id: data.user?.id,
        firstName: data.user?.firstName,
        lastName: data.user?.lastName,
        email: data.user?.email,
        isAdmin: data.user?.isAdmin || false,
        token: data.token,
        loggedIn: true,
      };

      localStorage.setItem("MALABAR_CINEHUB_USER", JSON.stringify(sessionUser));

      showNotification("✅ Login successful! Redirecting...", "success");
      setTimeout(() => (window.location.href = "/index.html"), 1200);
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      showNotification(err.message, "error");
    }
  });
}

// =============================
// 📝 SIGNUP HANDLER
// =============================
const signupFormEl = signupForm?.querySelector(".auth-form");

if (signupFormEl) {
  signupFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("signup-firstname").value.trim();
    const lastName = document.getElementById("signup-lastname").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm-password").value;
    const terms = document.getElementById("terms").checked;

    if (password !== confirm)
      return showNotification("❌ Passwords do not match!", "error");
    if (!terms)
      return showNotification("⚠️ Please accept the Terms & Conditions", "error");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      showNotification("📩 OTP sent to your email!", "info");

      localStorage.setItem("pendingEmail", email);
      showOnly(otpSection);
    } catch (err) {
      console.error("SIGNUP ERROR:", err);
      showNotification(err.message, "error");
    }
  });
}

// =============================
// 🔐 VERIFY OTP
// =============================
const otpForm = document.getElementById("otpForm");

if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = localStorage.getItem("pendingEmail");
    const otp = document.getElementById("otpInput")?.value?.trim();

    if (!email) return showNotification("No email found!", "error");
    if (!otp) return showNotification("Enter OTP!", "error");

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showNotification("🎉 OTP verified! You can now log in.", "success");

      localStorage.removeItem("pendingEmail");
      showOnly(loginForm);
    } catch (err) {
      console.error("VERIFY ERROR:", err);
      showNotification(err.message, "error");
    }
  });
}

// =============================
// 🔁 RESEND OTP
// =============================
const resendBtn = document.getElementById("resendOtpBtn");

if (resendBtn) {
  resendBtn.addEventListener("click", async () => {
    const email = localStorage.getItem("pendingEmail");
    if (!email) return showNotification("No email to resend!", "error");

    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showNotification("🔄 OTP resent to your email.", "info");
    } catch (err) {
      console.error("RESEND ERROR:", err);
      showNotification(err.message, "error");
    }
  });
}

// =============================
// 🧪 DEBUG TOOL
// =============================
setTimeout(() => {
  console.log("🔧 testDirectLogin() available");

  window.testDirectLogin = function () {
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@mail.com", password: "Test123" }),
    })
      .then((r) => r.json())
      .then(console.log)
      .catch(console.error);
  };
}, 1000);
