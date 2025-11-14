// Auto-detect API base URL - uses same origin as the page
const API_BASE = `${window.location.origin}/api`;

const BOOKING_SELECTION_KEY = "MALABAR CINEHUBBookingSelection";

const params = new URLSearchParams(window.location.search);
const movieId = params.get("movie");

const movieTitleEl = document.getElementById("movieTitle");
const screenLabelEl = document.getElementById("screenLabel");
const ticketInfoEl = document.getElementById("ticketInfo");
const seatGridEl = document.getElementById("seatGrid");
const feedbackEl = document.getElementById("bookingFeedback");
const summaryTicketCountEl = document.getElementById("summaryTicketCount");
const summaryPriceEl = document.getElementById("summaryPrice");
const summaryTotalEl = document.getElementById("summaryTotal");
const selectedSeatsListEl = document.getElementById("selectedSeatsList");
const confirmBookingBtn = document.getElementById("confirmBookingBtn");
const changeMovieBtn = document.getElementById("changeMovieBtn");
const loginPromptEl = document.getElementById("loginPrompt");
const loginCancelBtn = document.getElementById("loginCancelBtn");
const pageLoaderEl = document.getElementById("pageLoader");

let bookingSelection;
let seatLayout = [];
let bookedSeatSet = new Set();
let selectedSeats = [];
let moviePrice = 0;

const toggleLoader = (shouldShow) => {
  if (!pageLoaderEl) return;
  if (shouldShow) {
    pageLoaderEl.classList.remove("hidden");
    pageLoaderEl.classList.add("visible");
  } else {
    pageLoaderEl.classList.remove("visible");
    pageLoaderEl.classList.add("hidden");
  }
};

const showFeedback = (message, tone = "info") => {
  if (!feedbackEl) return;
  feedbackEl.textContent = message;
  feedbackEl.className = `booking-feedback tone-${tone}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const loadSelectionFromStorage = () => {
  try {
    const raw = localStorage.getItem(BOOKING_SELECTION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse booking selection:", error);
    return null;
  }
};

const updateSummaryUI = () => {
  if (!bookingSelection) return;
  const targetTickets = bookingSelection.ticketCount;
  const currentlySelected = selectedSeats.length;
  
  // Calculate total amount based on seat type modifiers
  let totalAmount = 0;
  selectedSeats.forEach(seatId => {
    const seatBtn = document.querySelector(`[data-seat-id="${seatId}"]`);
    if (seatBtn) {
      const modifier = parseFloat(seatBtn.dataset.priceModifier || 0);
      totalAmount += moviePrice + modifier;
    } else {
      totalAmount += moviePrice;
    }
  });

  if (summaryTicketCountEl) {
    summaryTicketCountEl.textContent = `${currentlySelected} / ${targetTickets}`;
  }

  if (summaryPriceEl) {
    const avgPrice = currentlySelected > 0 ? totalAmount / currentlySelected : moviePrice;
    summaryPriceEl.textContent = formatCurrency(avgPrice);
  }

  if (summaryTotalEl) {
    summaryTotalEl.textContent = formatCurrency(totalAmount);
  }

  if (selectedSeatsListEl) {
    selectedSeatsListEl.textContent =
      selectedSeats.length > 0 ? selectedSeats.join(", ") : "None selected";
  }

  if (ticketInfoEl) {
    const remaining = targetTickets - currentlySelected;
    ticketInfoEl.textContent =
      remaining > 0
        ? `Please pick ${remaining} more seat${remaining === 1 ? "" : "s"}.`
        : "You're all set! Review and confirm your booking.";
  }
};

const handleSeatClick = (event) => {
  const button = event.currentTarget;
  const seatId = button.dataset.seatId;
  if (!seatId) return;

  if (button.classList.contains("booked")) {
    return;
  }

  const alreadySelected = selectedSeats.includes(seatId);
  const targetTickets = bookingSelection.ticketCount;

  if (alreadySelected) {
    selectedSeats = selectedSeats.filter((seat) => seat !== seatId);
    button.classList.remove("selected");
    showFeedback(`Seat ${seatId} removed from your selection.`);
  } else {
    if (selectedSeats.length >= targetTickets) {
      showFeedback(
        `You already selected ${targetTickets} seat${
          targetTickets === 1 ? "" : "s"
        }.`,
        "warning"
      );
      return;
    }
    selectedSeats.push(seatId);
    button.classList.add("selected");
    showFeedback(`Seat ${seatId} added to your selection.`);
  }

  selectedSeats.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  updateSummaryUI();
};

const renderSeatLayout = () => {
  if (!seatGridEl) return;
  seatGridEl.innerHTML = "";

  const fragment = document.createDocumentFragment();
  const rows = seatLayout.reduce((acc, seat) => {
    const rowLabel = seat.row;
    if (!acc[rowLabel]) {
      acc[rowLabel] = [];
    }
    acc[rowLabel].push(seat);
    return acc;
  }, {});

  Object.keys(rows)
    .sort()
    .forEach((rowLabel) => {
      const rowSeats = rows[rowLabel].sort(
        (a, b) => Number(a.column) - Number(b.column)
      );

      const rowEl = document.createElement("div");
      rowEl.className = "seat-row";

      const labelEl = document.createElement("div");
      labelEl.className = "row-label";
      labelEl.textContent = rowLabel;
      rowEl.appendChild(labelEl);

      const seatsContainer = document.createElement("div");
      seatsContainer.className = "row-seats";

      rowSeats.forEach((seat) => {
        const seatBtn = document.createElement("button");
        seatBtn.type = "button";
        seatBtn.className = "seat";
        seatBtn.dataset.seatId = seat.seatId;
        seatBtn.dataset.row = seat.row;
        seatBtn.dataset.column = seat.column;
        seatBtn.dataset.seatType = seat.seatType || "standard";
        seatBtn.dataset.priceModifier = seat.priceModifier || 0;
        
        // Apply seat type class
        if (seat.seatType) {
          seatBtn.classList.add(seat.seatType);
        } else if (seat.isPremium) {
          seatBtn.classList.add("premium");
        }

        // Hide text for wheelchair seats (using icon instead)
        if (seat.seatType !== "wheelchair" && !seat.isWheelchair) {
          seatBtn.textContent = seat.seatId;
        }

        if (bookedSeatSet.has(seat.seatId)) {
          seatBtn.classList.add("booked");
          seatBtn.disabled = true;
        } else {
          seatBtn.addEventListener("click", handleSeatClick);
        }

        seatsContainer.appendChild(seatBtn);
      });

      rowEl.appendChild(seatsContainer);
      fragment.appendChild(rowEl);
    });

  seatGridEl.appendChild(fragment);
};

const fetchSeatLayout = async () => {
  toggleLoader(true);
  try {
    const res = await fetch(`${API_BASE}/movies/${movieId}/seats`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || "Failed to load seat layout");
    }
    const data = await res.json();

    seatLayout = Array.isArray(data.seatMap) ? data.seatMap : [];
    bookedSeatSet = new Set(data.bookedSeatIds || []);

    if (data.movie) {
      movieTitleEl.textContent = data.movie.title;
      const screenName = data.movie.screen?.name || bookingSelection.screenName;
      if (screenLabelEl) {
        screenLabelEl.textContent = `${screenName} • ${
          data.movie.screen?.totalSeats ?? seatLayout.length
        } seats`;
      }
    }

    if (seatLayout.length === 0) {
      throw new Error("No seats available for this movie. Please contact admin.");
    }

    renderSeatLayout();
    updateSummaryUI();
    showFeedback("Select your preferred seats.");
  } catch (error) {
    console.error("Seat layout fetch failed:", error);
    const errorMessage = error.message || "Unable to load seats. Please refresh the page.";
    showFeedback(errorMessage, "error");
    
    // Show a helpful message with a link back to movies
    if (feedbackEl) {
      const backLink = document.createElement("a");
      backLink.href = "/movies/movies.html";
      backLink.textContent = " ← Back to Movies";
      backLink.style.color = "#4a9eff";
      backLink.style.marginLeft = "0.5rem";
      backLink.style.textDecoration = "underline";
      feedbackEl.appendChild(backLink);
    }
  } finally {
    toggleLoader(false);
  }
};

const showLoginPrompt = () => {
  if (!loginPromptEl) return;
  loginPromptEl.classList.remove("hidden");
  loginPromptEl.classList.add("visible");
};

const hideLoginPrompt = () => {
  if (!loginPromptEl) return;
  loginPromptEl.classList.remove("visible");
  loginPromptEl.classList.add("hidden");
};

const resetSelection = () => {
  selectedSeats = [];
  document
    .querySelectorAll(".seat.selected")
    .forEach((seat) => seat.classList.remove("selected"));
  updateSummaryUI();
};

const handleBookingSubmission = async () => {
  if (!bookingSelection) return;

  const requiredSeats = bookingSelection.ticketCount;
  if (selectedSeats.length !== requiredSeats) {
    showFeedback(
      `Please select ${requiredSeats} seat${
        requiredSeats === 1 ? "" : "s"
      } to continue.`,
      "warning"
    );
    return;
  }

  let sessionUser = null;
  try {
    const raw = localStorage.getItem("MALABAR_CINEHUB_USER");
    sessionUser = raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to parse session user:", error);
  }

  if (!sessionUser || !sessionUser.token) {
    showLoginPrompt();
    return;
  }

  confirmBookingBtn.disabled = true;
  confirmBookingBtn.textContent = "Processing...";
  showFeedback("Verifying seat availability...");

  // Calculate total amount with seat modifiers
  let calculatedTotal = 0;
  selectedSeats.forEach(seatId => {
    const seatBtn = document.querySelector(`[data-seat-id="${seatId}"]`);
    if (seatBtn) {
      const modifier = parseFloat(seatBtn.dataset.priceModifier || 0);
      calculatedTotal += moviePrice + modifier;
    } else {
      calculatedTotal += moviePrice;
    }
  });

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionUser.token}`,
      },
      body: JSON.stringify({
        movieId,
        seats: selectedSeats,
        totalAmount: calculatedTotal,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        showFeedback(
          "One or more seats were just booked by someone else. Please pick new seats.",
          "error"
        );
        await fetchSeatLayout();
        resetSelection();
      } else if (res.status === 401) {
        showLoginPrompt();
      } else {
        showFeedback(data.message || "Booking failed. Try again.", "error");
      }
      return;
    }

    // Store booking data for payment page
    const bookingData = {
      bookingId: data.booking?.id || data.booking?._id,
      movieId: movieId,
      seats: selectedSeats,
      totalAmount: calculatedTotal,
      movieTitle: bookingSelection.title,
    };
    
    localStorage.setItem("pendingPayment", JSON.stringify(bookingData));
    
    // Redirect to payment page
    showFeedback("✅ Seats reserved! Redirecting to payment...", "success");
    setTimeout(() => {
      window.location.href = "/booking/payment.html";
    }, 1500);
  } catch (error) {
    console.error("Booking submission failed:", error);
    showFeedback("Unexpected error while booking. Please try again.", "error");
  } finally {
    confirmBookingBtn.disabled = false;
    confirmBookingBtn.textContent = "Confirm Booking";
  }
};

const initialisePage = async () => {
  if (!movieId) {
    window.location.href = "/movies/movies.html";
    return;
  }

  bookingSelection = loadSelectionFromStorage();

  if (!bookingSelection || bookingSelection.movieId !== movieId) {
    window.location.href = `/movies/movies.html`;
    return;
  }

  moviePrice = bookingSelection.price || 0;
  selectedSeats = [];

  if (movieTitleEl) movieTitleEl.textContent = "Fetching seat layout...";
  if (screenLabelEl) screenLabelEl.textContent = bookingSelection.screenName || "";

  updateSummaryUI();
  await fetchSeatLayout();
};

confirmBookingBtn?.addEventListener("click", handleBookingSubmission);
changeMovieBtn?.addEventListener("click", () => {
  window.location.href = "/movies/movies.html";
});
loginCancelBtn?.addEventListener("click", hideLoginPrompt);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideLoginPrompt();
  }
});

initialisePage();

