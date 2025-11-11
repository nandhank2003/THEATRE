// Auto-detect API base URL
const API_BASE = `${window.location.origin}/api`;

// Get booking data from localStorage
const pendingPayment = JSON.parse(localStorage.getItem("pendingPayment") || "null");

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
  if (!pendingPayment) return;
  
  renderBookingSummary();
  setupPaymentHandler();
});

function renderBookingSummary() {
  if (!bookingSummaryEl || !pendingPayment) return;
  
  bookingSummaryEl.innerHTML = `
    <div class="summary-row">
      <span>Movie</span>
      <strong>${pendingPayment.movieTitle || "Movie"}</strong>
    </div>
    <div class="summary-row">
      <span>Seats</span>
      <strong>${pendingPayment.seats.join(", ")}</strong>
    </div>
    <div class="summary-row">
      <span>Number of Tickets</span>
      <strong>${pendingPayment.seats.length}</strong>
    </div>
    <div class="summary-row">
      <span>Price per Seat</span>
      <strong>₹${(pendingPayment.totalAmount / pendingPayment.seats.length).toFixed(0)}</strong>
    </div>
    <div class="summary-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border);">
      <span style="font-size: 1.1rem;">Total Amount</span>
      <strong style="font-size: 1.3rem; color: var(--accent);">₹${pendingPayment.totalAmount.toFixed(0)}</strong>
    </div>
  `;
  
  if (totalAmountDisplayEl) {
    totalAmountDisplayEl.textContent = pendingPayment.totalAmount.toFixed(0);
  }
}

async function setupPaymentHandler() {
  if (!payNowBtn) return;
  
  payNowBtn.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("MALABAR CINEHUBUser") || "null");
    if (!user || !user.token) {
      alert("Please login to continue");
      window.location.href = "/login-form/login.html";
      return;
    }
    
    // Show loader
    if (paymentLoaderEl) {
      paymentLoaderEl.classList.remove("hidden");
    }
    payNowBtn.disabled = true;
    
    try {
      // Create Razorpay order (you'll need to implement this endpoint)
      const orderRes = await fetch(`${API_BASE}/bookings/${pendingPayment.bookingId}/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          amount: pendingPayment.totalAmount * 100, // Razorpay expects amount in paise
        }),
      });
      
      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({ message: "Unknown error" }));
        console.error("Payment order creation failed:", errorData);
        throw new Error(errorData.error || errorData.message || "Failed to create payment order");
      }
      
      const orderData = await orderRes.json();
      
      // Initialize Razorpay
      const options = {
        key: orderData.razorpayKey || "rzp_test_Re7Ks1Il3ik9Ci",
        amount: orderData.amount,
        currency: "INR",
        name: "MALABAR CINEHUB",
        description: `Booking for ${pendingPayment.movieTitle}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          // Payment successful
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        theme: {
          color: "#ff6b35",
        },
        modal: {
          ondismiss: function() {
            // User closed the payment modal
            if (paymentLoaderEl) {
              paymentLoaderEl.classList.add("hidden");
            }
            payNowBtn.disabled = false;
          },
        },
      };
      
      const razorpay = new Razorpay(options);
      razorpay.open();
      
      // Hide loader when modal opens
      if (paymentLoaderEl) {
        paymentLoaderEl.classList.add("hidden");
      }
      
    } catch (error) {
      console.error("Payment initialization failed:", error);
      const errorMessage = error.message || "Failed to initialize payment. Please try again.";
      alert(`Payment Error: ${errorMessage}\n\nPlease check:\n1. Your booking is still valid\n2. You have sufficient balance\n3. Try again in a moment`);
      if (paymentLoaderEl) {
        paymentLoaderEl.classList.add("hidden");
      }
      payNowBtn.disabled = false;
    }
  });
}

async function handlePaymentSuccess(paymentResponse) {
  if (!paymentLoaderEl) return;
  
  paymentLoaderEl.classList.remove("hidden");
  payNowBtn.disabled = true;
  payNowBtn.textContent = "Processing...";
  
  try {
    const user = JSON.parse(localStorage.getItem("MALABAR CINEHUBUser") || "null");
    
    // Verify payment and confirm booking
    const verifyRes = await fetch(`${API_BASE}/bookings/${pendingPayment.bookingId}/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      }),
    });
    
    const verifyData = await verifyRes.json();
    
    if (!verifyRes.ok) {
      throw new Error(verifyData.message || "Payment verification failed");
    }
    
    // Payment successful - store ticket data
    if (verifyData.ticket) {
      localStorage.setItem("latestTicket", JSON.stringify({
        bookingId: pendingPayment.bookingId,
        ticketId: verifyData.ticket.ticketId,
        qrCode: verifyData.ticket.qrCode,
        booking: verifyData.booking,
      }));
    }
    
    // Clear pending payment
    localStorage.removeItem("pendingPayment");
    
    // Redirect to tickets page
    window.location.href = "/index.html#tickets";
    
  } catch (error) {
    console.error("Payment verification failed:", error);
    alert("Payment verification failed. Please contact support with your payment ID.");
    if (paymentLoaderEl) {
      paymentLoaderEl.classList.add("hidden");
    }
    payNowBtn.disabled = false;
    payNowBtn.textContent = "Pay Now";
  }
}

