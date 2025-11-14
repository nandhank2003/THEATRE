// Auto-detect API base URL
const API_BASE = `${window.location.origin}/api`;

// Get booking data from localStorage
const pendingPayment = JSON.parse(localStorage.getItem("pendingPayment") || "null");

// Redirect if no payment data found
if (!pendingPayment) {
  alert("No booking found. Redirecting to movies...");
  window.location.href = "/movies/movies.html";
}

// DOM Elements
const bookingSummaryEl = document.getElementById("bookingSummary");
const totalAmountDisplayEl = document.getElementById("totalAmountDisplay");
const payNowBtn = document.getElementById("payNowBtn");
const paymentLoaderEl = document.getElementById("paymentLoader");

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  renderBookingSummary();
  setupPaymentHandler();
});

// ------------------------------
// Render Booking Summary
// ------------------------------
function renderBookingSummary() {
  bookingSummaryEl.innerHTML = `
    <div class="summary-row">
      <span>Movie</span>
      <strong>${pendingPayment.movieTitle}</strong>
    </div>
    <div class="summary-row">
      <span>Seats</span>
      <strong>${pendingPayment.seats.join(", ")}</strong>
    </div>
    <div class="summary-row">
      <span>Tickets</span>
      <strong>${pendingPayment.seats.length}</strong>
    </div>
    <div class="summary-row">
      <span>Price per Seat</span>
      <strong>₹${(pendingPayment.totalAmount / pendingPayment.seats.length).toFixed(0)}</strong>
    </div>
    <div class="summary-row total-row">
      <span>Total Amount</span>
      <strong>₹${pendingPayment.totalAmount.toFixed(0)}</strong>
    </div>
  `;
  totalAmountDisplayEl.textContent = pendingPayment.totalAmount.toFixed(0);
}

// ------------------------------
// Payment Handler
// ------------------------------
async function setupPaymentHandler() {
  payNowBtn.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("MALABAR_CINEHUB_USER") || "null");

    if (!user || !user.token) {
      alert("Please login to continue");
      window.location.href = "/login-form/login.html";
      return;
    }

    paymentLoaderEl.classList.remove("hidden");
    payNowBtn.disabled = true;

    try {
      const orderRes = await fetch(`${API_BASE}/bookings/${pendingPayment.bookingId}/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          amount: pendingPayment.totalAmount * 100
        })
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || "Failed to create payment order");
      }

      const orderData = await orderRes.json();

      const options = {
        key: orderData.razorpayKey,
        amount: orderData.amount,
        currency: "INR",
        name: "MALABAR CINEHUB",
        description: `Booking for ${pendingPayment.movieTitle}`,
        order_id: orderData.orderId,

        handler: async function (response) {
          await handlePaymentSuccess(response);
        },

        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },

        theme: { color: "#ff6b35" },
        modal: {
          ondismiss: function () {
            paymentLoaderEl.classList.add("hidden");
            payNowBtn.disabled = false;
          }
        }
      };

      const razorpay = new Razorpay(options);
      razorpay.open();

      paymentLoaderEl.classList.add("hidden");

    } catch (error) {
      alert("Payment initialization failed. Try again.");
      paymentLoaderEl.classList.add("hidden");
      payNowBtn.disabled = false;
    }
  });
}

// ------------------------------
// Payment Success Handler
// ------------------------------
async function handlePaymentSuccess(payment) {
  paymentLoaderEl.classList.remove("hidden");
  payNowBtn.disabled = true;
  payNowBtn.textContent = "Processing...";

  const user = JSON.parse(localStorage.getItem("MALABAR_CINEHUB_USER"));

  const res = await fetch(`${API_BASE}/bookings/${pendingPayment.bookingId}/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`
    },
    body: JSON.stringify(payment)
  });

  const data = await res.json();

  if (!res.ok) {
    alert("Payment verification failed.");
    paymentLoaderEl.classList.add("hidden");
    return;
  }

  localStorage.removeItem("pendingPayment");

  window.location.href = "/index.html#tickets";
}
