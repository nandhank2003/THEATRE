// =============================
// 🎬 LOGIN / SIGNUP FUNCTIONAL JS (Fixed - Consistent Password Handling)
// =============================

// ✅ AUTO-DETECT LOCAL OR DEPLOYED BACKEND
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_BASE = isLocal
  ? "http://localhost:5000/api/users"
  : "https://theatre-1-err2.onrender.com/api/users"; // ✅ your live Render backend

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
    if (target === "signup") showOnly(signupForm);
    else showOnly(loginForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// =============================
// 👁 PASSWORD VISIBILITY
// =============================
document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    const eye = button.querySelector(".eye-icon");
    if (!target || !eye) return;

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
// 🔔 NOTIFICATION
// =============================
function showNotification(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3500);
}

// =============================
// 🔑 LOGIN HANDLER (FIXED VERSION)
// =============================
const loginFormEl = loginForm?.querySelector(".auth-form");
if (loginFormEl) {
  loginFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // ✅ FIX: Get raw values without any processing
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    // Normalize email only
    const normalizedEmail = email.trim().toLowerCase();

    console.log("🚨 LOGIN ATTEMPT - RAW DATA:", {
      email: normalizedEmail,
      rawPassword: password,
      rawPasswordLength: password.length,
      passwordCharCodes: Array.from(password).map(c => c.charCodeAt(0))
    });

    if (!normalizedEmail || !password)
      return showNotification("⚠️ Please fill all fields", "error");

    try {
      const requestData = {
        email: normalizedEmail,
        password: password // Send RAW password exactly as entered
      };

      console.log("🚨 LOGIN - SENDING RAW DATA:", JSON.stringify(requestData, null, 2));
      
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      console.log("🚨 LOGIN RESPONSE:", {
        status: res.status,
        statusText: res.statusText,
        responseData: data
      });

      if (!res.ok) {
        console.log("❌ LOGIN FAILED:", data);
        throw new Error(data?.message || "Login failed");
      }

      // ✅ Save user data
      const sessionUser = {
        _id: data.user?._id,
        firstName: data.user?.firstName || "",
        lastName: data.user?.lastName || "",
        email: data.user?.email || normalizedEmail,
        token: data.token,
        loggedIn: true,
        loginDate: new Date().toISOString(),
      };
      localStorage.setItem("MALABAR CINEHUBUser", JSON.stringify(sessionUser));

      showNotification("✅ Login successful! Redirecting...", "success");

      // ✅ Redirect with fallback
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1200);
    } catch (err) {
      console.error("❌ LOGIN ERROR:", err);
      showNotification(`⚠️ ${err.message}`, "error");
    }
  });
}

// =============================
// 📝 SIGNUP HANDLER (FIXED VERSION)
// =============================
const signupFormEl = signupForm?.querySelector(".auth-form");
if (signupFormEl) {
  signupFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // ✅ FIX: Get raw values - only trim names and email, keep password raw
    const firstName = document.getElementById("signup-firstname").value.trim();
    const lastName = document.getElementById("signup-lastname").value.trim();
    const email = document.getElementById("signup-email").value;
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value; // RAW
    const confirm = document.getElementById("signup-confirm-password").value; // RAW
    const terms = document.getElementById("terms").checked;

    // Normalize email only
    const normalizedEmail = email.trim().toLowerCase();

    console.log("🔍 SIGNUP ATTEMPT:", {
      email: normalizedEmail,
      password: password,
      passwordLength: password.length,
      passwordCharCodes: Array.from(password).map(c => c.charCodeAt(0)),
      confirmPassword: confirm,
      confirmLength: confirm.length
    });

    if (password !== confirm)
      return showNotification("❌ Passwords do not match!", "error");
    if (!terms)
      return showNotification("⚠️ Please accept the terms & conditions", "error");

    try {
      const requestData = {
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        password: password // Send RAW password exactly as entered
      };

      console.log("🔍 SIGNUP - SENDING RAW DATA:", requestData);
      
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      
      const data = await res.json();
      console.log("🔍 SIGNUP RESPONSE:", data);
      
      if (!res.ok) throw new Error(data.message || "Signup failed");

      showNotification("✅ OTP sent! Please verify your email.", "info");

      if (otpSection) {
        showOnly(otpSection);
        localStorage.setItem("pendingEmail", normalizedEmail);
      } else {
        showOnly(loginForm);
      }
    } catch (err) {
      console.error("❌ SIGNUP ERROR:", err);
      showNotification(`⚠️ ${err.message}`, "error");
    }
  });
}

// =============================
// 🔐 VERIFY OTP HANDLER
// =============================
const otpForm = document.getElementById("otpForm");
if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("pendingEmail");
    const otpInput = document.getElementById("otpInput");
    const otp = otpInput?.value?.trim();

    if (!email) return showNotification("No pending email!", "error");
    if (!otp) return showNotification("Enter OTP.", "error");

    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      console.log("🧩 Verify response:", data);

      if (!res.ok) throw new Error(data.message || "OTP verify failed");

      showNotification("✅ Email verified! You can now log in.", "success");
      localStorage.removeItem("pendingEmail");
      showOnly(loginForm);
    } catch (err) {
      console.error("❌ Verify OTP error:", err);
      showNotification(`⚠️ ${err.message}`, "error");
    }
  });
}

// =============================
// 🔁 RESEND OTP HANDLER
// =============================
const resendBtn = document.getElementById("resendOtpBtn");
if (resendBtn) {
  resendBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("pendingEmail");
    if (!email) return showNotification("No pending email!", "error");

    try {
      const res = await fetch(`${API_BASE}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      console.log("🧩 Resend OTP response:", data);

      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      showNotification("🔄 OTP resent to your email.", "info");
    } catch (err) {
      console.error("❌ Resend OTP error:", err);
      showNotification(`❌ ${err.message}`, "error");
    }
  });
}

// =============================
// 🧪 TEST DIRECT API CALL
// =============================
function testDirectLogin() {
  console.log("🧪 TESTING DIRECT API CALL...");

  const testData = {
    email: "nandhankd@gmail.com",
    password: "Test321"
  };

  console.log("🧪 SENDING:", testData);
  console.log("🧪 PASSWORD CHAR CODES:", Array.from(testData.password).map(c => c.charCodeAt(0)));

  fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Debug': 'true'
    },
    body: JSON.stringify(testData)
  })
  .then(r => {
    console.log("🧪 RESPONSE STATUS:", r.status, r.statusText);
    return r.json();
  })
  .then(data => console.log("🧪 RESPONSE DATA:", data))
  .catch(err => console.error("🧪 ERROR:", err));
}

// Run test on page load for debugging
setTimeout(() => {
  console.log("🔧 DEBUG: Page loaded, you can run testDirectLogin() in console");
  window.testDirectLogin = testDirectLogin;
}, 1000);