const API_BASE = `${window.location.origin}/api`;

let allBookings = [];
let filteredBookings = [];

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  loadTickets();
  setupFilterTabs();
});

// Check if user is logged in
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem("MALABAR CINEHUBUser") || "null");
  if (!user || !user.token) {
    showEmptyState("Please login to view your bookings", true);
    return false;
  }
  return true;
}

// Load tickets from API
async function loadTickets() {
  const ticketsContainer = document.getElementById("ticketsContainer");
  const emptyState = document.getElementById("emptyState");

  if (!checkLoginStatus()) {
    return;
  }

  const user = JSON.parse(localStorage.getItem("MALABAR CINEHUBUser"));
  
  try {
    ticketsContainer.innerHTML = `
      <div class="tickets-loading">
        <div class="loader"></div>
        <p>Loading your tickets...</p>
      </div>
    `;
    emptyState.classList.add("hidden");

    const res = await fetch(`${API_BASE}/bookings`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch bookings");
    }

    allBookings = await res.json();
    
    // Filter out cancelled/failed bookings
    allBookings = allBookings.filter(
      (booking) => booking.status !== "cancelled" && booking.status !== "failed"
    );

    if (allBookings.length === 0) {
      showEmptyState();
      return;
    }

    // Sort by booking time (newest first)
    allBookings.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));

    filteredBookings = allBookings;
    renderTickets(allBookings);

  } catch (error) {
    console.error("Error loading tickets:", error);
    ticketsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error Loading Tickets</h3>
        <p>Failed to load your bookings. Please try again later.</p>
        <button class="cta-button" onclick="loadTickets()">Retry</button>
      </div>
    `;
  }
}

// Render tickets
function renderTickets(bookings) {
  const ticketsContainer = document.getElementById("ticketsContainer");
  const emptyState = document.getElementById("emptyState");

  if (bookings.length === 0) {
    showEmptyState();
    return;
  }

  emptyState.classList.add("hidden");

  ticketsContainer.innerHTML = bookings
    .map((booking) => {
      const bookingDate = new Date(booking.bookingTime);
      const formattedDate = bookingDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = bookingDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const statusClass = booking.status === "confirmed" ? "confirmed" : "pending";
      const statusText = booking.status === "confirmed" ? "Confirmed" : "Pending Payment";

      return `
        <div class="ticket-card" data-status="${booking.status}">
          <div class="ticket-card-header">
            <div class="ticket-poster">
              <img src="${booking.movie?.poster || "/asset/Logo.png"}" 
                   alt="${booking.movie?.title || "Movie"}" 
                   onerror="this.src='/asset/Logo.png'">
            </div>
            <div class="ticket-info">
              <h3>${booking.movie?.title || "Movie"}</h3>
              <span class="ticket-status ${statusClass}">${statusText}</span>
            </div>
          </div>
          
          <div class="ticket-details">
            <div class="ticket-detail-item">
              <label>Ticket ID</label>
              <span>${booking.ticketId || "N/A"}</span>
            </div>
            <div class="ticket-detail-item">
              <label>Screen</label>
              <span>${booking.screen?.name || "N/A"}</span>
            </div>
            <div class="ticket-detail-item">
              <label>Seats</label>
              <span>${booking.seats.join(", ")}</span>
            </div>
            <div class="ticket-detail-item">
              <label>Date</label>
              <span>${formattedDate}</span>
            </div>
            <div class="ticket-detail-item">
              <label>Time</label>
              <span>${formattedTime}</span>
            </div>
            <div class="ticket-detail-item">
              <label>Amount</label>
              <span>₹${booking.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div class="ticket-actions">
            ${booking.status === "confirmed" && booking.ticket?.qrCode ? `
              <button class="ticket-action-btn primary" onclick="showQRCode('${booking._id}')">
                View QR Code
              </button>
            ` : ""}
            ${booking.status === "pending" ? `
              <button class="ticket-action-btn primary" onclick="completePayment('${booking._id}')">
                Complete Payment
              </button>
            ` : ""}
            <button class="ticket-action-btn secondary" onclick="viewTicketDetails('${booking._id}')">
              View Details
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Show empty state
function showEmptyState(message, showLogin = false) {
  const ticketsContainer = document.getElementById("ticketsContainer");
  const emptyState = document.getElementById("emptyState");

  ticketsContainer.innerHTML = "";
  emptyState.classList.remove("hidden");

  if (message) {
    emptyState.innerHTML = `
      <div class="empty-icon">🎬</div>
      <h3>${message}</h3>
      ${showLogin ? `
        <p>Please login to view your bookings</p>
        <a href="/login-form/login.html" class="cta-button">Login</a>
      ` : `
        <p>You haven't booked any tickets yet. Start booking your favorite movies!</p>
        <a href="/movies/movies.html" class="cta-button">Browse Movies</a>
      `}
    `;
  }
}

// Setup filter tabs
function setupFilterTabs() {
  const filterTabs = document.querySelectorAll(".filter-tab");
  
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      filterTabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");

      const filter = tab.dataset.filter;
      filterTickets(filter);
    });
  });
}

// Filter tickets
function filterTickets(filter) {
  if (filter === "all") {
    filteredBookings = allBookings;
  } else {
    filteredBookings = allBookings.filter((booking) => booking.status === filter);
  }

  renderTickets(filteredBookings);
}

// Show QR Code in modal
async function showQRCode(bookingId) {
  const user = JSON.parse(localStorage.getItem("MALABAR CINEHUBUser"));
  const modal = document.getElementById("ticketModal");
  const modalContent = document.getElementById("modalTicketContent");

  try {
    modalContent.innerHTML = `
      <div class="tickets-loading">
        <div class="loader"></div>
        <p>Loading QR code...</p>
      </div>
    `;
    modal.classList.remove("hidden");

    const res = await fetch(`${API_BASE}/bookings/${bookingId}/ticket`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch ticket");
    }

    const ticket = await res.json();
    const booking = allBookings.find((b) => b._id === bookingId);

    modalContent.innerHTML = `
      <div class="modal-qr-code">
        <h2 style="margin-bottom: 1rem; color: #fff;">${booking?.movie?.title || "Movie"}</h2>
        <img src="${ticket.qrCode}" alt="QR Code">
        <p>Scan this QR code at the cinema entry</p>
        <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
          Ticket ID: ${ticket.ticketId || bookingId}
        </p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Seats: ${booking?.seats.join(", ") || "N/A"}
        </p>
      </div>
    `;
  } catch (error) {
    console.error("Error loading QR code:", error);
    modalContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error Loading QR Code</h3>
        <p>Failed to load QR code. Please try again.</p>
      </div>
    `;
  }
}

// Close ticket modal
function closeTicketModal() {
  const modal = document.getElementById("ticketModal");
  modal.classList.add("hidden");
}

// Complete payment (redirect to payment page)
function completePayment(bookingId) {
  const booking = allBookings.find((b) => b._id === bookingId);
  if (booking) {
    localStorage.setItem("pendingPayment", JSON.stringify({
      bookingId: bookingId,
      movieId: booking.movie?._id || booking.movie,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      movieTitle: booking.movie?.title || "Movie",
    }));
    window.location.href = "/booking/payment.html";
  }
}

// View ticket details
function viewTicketDetails(bookingId) {
  const booking = allBookings.find((b) => b._id === bookingId);
  if (booking) {
    const bookingDate = new Date(booking.bookingTime);
    const formattedDate = bookingDate.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = bookingDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    alert(`
Ticket Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Movie: ${booking.movie?.title || "N/A"}
Screen: ${booking.screen?.name || "N/A"}
Seats: ${booking.seats.join(", ")}
Date: ${formattedDate}
Time: ${formattedTime}
Amount: ₹${booking.totalAmount.toLocaleString("en-IN")}
Ticket ID: ${booking.ticketId || "N/A"}
Status: ${booking.status === "confirmed" ? "Confirmed" : "Pending Payment"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }
}

// Make functions globally available
window.showQRCode = showQRCode;
window.closeTicketModal = closeTicketModal;
window.completePayment = completePayment;
window.viewTicketDetails = viewTicketDetails;
window.loadTickets = loadTickets;

