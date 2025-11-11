// ==========================================================
// 🎬 MALABAR CINEHUB MOVIES PAGE JS (Full Functioning Version)
// Dynamically fetches movies from MongoDB via Express backend
// ==========================================================

// Navbar functionality
const navbar = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

// Hamburger menu toggle
hamburger?.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navLinks.classList.toggle("active");
});

// Close menu when clicking on a link
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
  });
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
  }
});

// ==========================================================
// 👤 CHECK USER LOGIN STATUS (LOCALSTORAGE)
// ==========================================================
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem("MALABAR CINEHUBUser"));
  const loginBtn = document.querySelector(".login-btn");

  if (user && loginBtn) {
    loginBtn.outerHTML = `
      <div class="profile-container">
          <button class="profile-btn" id="profileBtn">
              <div class="profile-avatar">${user.firstName
                .charAt(0)
                .toUpperCase()}${user.lastName.charAt(0).toUpperCase()}</div>
              <span class="profile-name">${user.firstName}</span>
              <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
          </button>
          <div class="dropdown-menu" id="dropdownMenu">
              <div class="dropdown-header">
                  <div class="dropdown-avatar">${user.firstName
                    .charAt(0)
                    .toUpperCase()}${user.lastName
      .charAt(0)
      .toUpperCase()}</div>
                  <div class="dropdown-info">
                      <p class="dropdown-name">${user.firstName} ${user.lastName}</p>
                      <p class="dropdown-email">${user.email}</p>
                  </div>
              </div>
              <div class="dropdown-divider"></div>
              <a href="#" class="dropdown-item">My Profile</a>
              <a href="#" class="dropdown-item">My Bookings</a>
              <a href="#" class="dropdown-item">Settings</a>
              <div class="dropdown-divider"></div>
              <a href="/auth/logout" class="dropdown-item logout-item" id="logoutBtn">Logout</a>
          </div>
      </div>
    `;
    setupProfileDropdown();
  }
}

function setupProfileDropdown() {
  const profileBtn = document.getElementById("profileBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  if (profileBtn && dropdownMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
      profileBtn.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove("show");
        profileBtn.classList.remove("active");
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        // The link now points to /auth/logout, so we just let it navigate.
        // For SPA-like behavior, you could do:
        // e.preventDefault();
        // localStorage.removeItem("MALABAR CINEHUBUser");
        // window.location.href = "/auth/logout";
      });
    }
  }
}

// ==========================================================
// 🎥 MOVIES FETCHING (BACKEND CONNECTED)
// ==========================================================

// Auto-detect API base URL - uses same origin as the page
const API_BASE = `${window.location.origin}/api`;

const BOOKING_SELECTION_KEY = "MALABAR CINEHUBBookingSelection";
const MAX_TICKETS_PER_BOOKING = 10;
const movieCache = new Map();

const ticketModal = document.getElementById("ticketModal");
const ticketModalBackdrop = document.getElementById("ticketModalBackdrop");
const ticketModalCloseBtn = document.getElementById("ticketModalClose");
const ticketDecreaseBtn = document.getElementById("ticketDecrease");
const ticketIncreaseBtn = document.getElementById("ticketIncrease");
const ticketCountDisplay = document.getElementById("ticketCountDisplay");
const ticketCancelBtn = document.getElementById("ticketCancelBtn");
const ticketConfirmBtn = document.getElementById("ticketConfirmBtn");
const modalMovieTitle = document.getElementById("modalMovieTitle");
const modalScreenLabel = document.getElementById("modalScreenLabel");

let selectedMovieForBooking = null;
let desiredTicketCount = 1;
// Fetch movies from backend
async function fetchMovies() {
  try {
    const res = await fetch(`${API_BASE}/movies`);
    if (!res.ok) throw new Error("Failed to fetch movies");
    const movies = await res.json();
    console.log("Fetched movies:", movies.length, "movies");
    if (movies.length > 0) {
      console.log("Sample movie structure:", movies[0]);
      console.log("Sample movie ID:", movies[0].id || movies[0]._id);
    }
    renderMovies(movies);
  } catch (err) {
    console.error("Error loading movies:", err);
    document.getElementById("moviesGrid").innerHTML = `
      <p style="color:#999;text-align:center;margin-top:3rem;">⚠️ Unable to load movies. Please try again later.</p>
    `;
  }
}

function openTicketModal(movie) {
  if (!ticketModal || !ticketModalBackdrop) {
    console.error("Ticket modal elements not found in DOM");
    return;
  }
  if (!movie) {
    console.error("No movie provided to openTicketModal");
    return;
  }
  selectedMovieForBooking = movie;
  desiredTicketCount = 1;
  if (modalMovieTitle) {
    modalMovieTitle.textContent = `Book tickets for ${movie.title}`;
  }
  if (modalScreenLabel) {
    modalScreenLabel.textContent = `${movie.screen || "Screen"} • ${
      movie.seatCapacity || movie.totalSeats || 0
    } seats`;
  }
  updateTicketCountDisplay();
  ticketModal.classList.add("active");
  ticketModalBackdrop.classList.add("active");
  console.log("Ticket modal opened for movie:", movie.title);
}

function closeTicketModal() {
  if (!ticketModal || !ticketModalBackdrop) return;
  selectedMovieForBooking = null;
  ticketModal.classList.remove("active");
  ticketModalBackdrop.classList.remove("active");
}

function updateTicketCountDisplay() {
  if (ticketCountDisplay) {
    ticketCountDisplay.textContent = desiredTicketCount.toString();
  }

  if (ticketConfirmBtn && selectedMovieForBooking) {
    const price = selectedMovieForBooking.price || 0;
    const total = price * desiredTicketCount;
    ticketConfirmBtn.textContent = total
      ? `Select Seats • ₹${total}`
      : `Select Seats`;
  }
}

function changeTicketCount(step) {
  const nextValue = desiredTicketCount + step;
  if (nextValue < 1 || nextValue > MAX_TICKETS_PER_BOOKING) return;
  desiredTicketCount = nextValue;
  updateTicketCountDisplay();
}

function handleTicketConfirm() {
  if (!selectedMovieForBooking) return;

  const movieId = selectedMovieForBooking.id || selectedMovieForBooking._id;
  if (!movieId) {
    console.error("Cannot proceed: Movie ID is missing");
    return;
  }

  const selectionPayload = {
    movieId: movieId,
    title: selectedMovieForBooking.title,
    price: selectedMovieForBooking.price || 0,
    screenCode:
      selectedMovieForBooking.screenCode || selectedMovieForBooking.screen?.code,
    screenName:
      selectedMovieForBooking.screen ||
      selectedMovieForBooking.screenName ||
      "Screen",
    ticketCount: desiredTicketCount,
    createdAt: Date.now(),
  };

  localStorage.setItem(
    BOOKING_SELECTION_KEY,
    JSON.stringify(selectionPayload)
  );
  window.location.href = `/booking/seat-selection.html?movie=${movieId}`;
}

function attachTicketModalEvents() {
  if (!ticketModal) return;

  ticketModalBackdrop?.addEventListener("click", closeTicketModal);
  ticketModalCloseBtn?.addEventListener("click", closeTicketModal);
  ticketCancelBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeTicketModal();
  });
  ticketDecreaseBtn?.addEventListener("click", () => changeTicketCount(-1));
  ticketIncreaseBtn?.addEventListener("click", () => changeTicketCount(1));
  ticketConfirmBtn?.addEventListener("click", handleTicketConfirm);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ticketModal.classList.contains("active")) {
      closeTicketModal();
    }
  });
}

function handleBookButtonClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const movieId = event.currentTarget.dataset.movieId;
  if (!movieId) {
    console.error("No movie ID found on button");
    return;
  }
  const movie = movieCache.get(movieId);
  if (movie) {
    openTicketModal(movie);
  } else {
    console.error("Movie not found in cache for ID:", movieId);
  }
}

// Render movies dynamically
function renderMovies(movies) {
  const moviesGrid = document.getElementById("moviesGrid");
  if (!moviesGrid) return;

  if (!movies || movies.length === 0) {
    moviesGrid.innerHTML = `<p style="text-align:center;margin-top:3rem;color:#ccc;">🎬 No movies available.</p>`;
    return;
  }

  movieCache.clear();
  moviesGrid.innerHTML = movies
    .map((movie) => {
      // Handle both id and _id (backend returns id from toJSON transform)
      const movieId = movie.id || movie._id;
      if (!movieId) {
        console.warn("Movie missing ID:", movie);
        return "";
      }
      movieCache.set(movieId, movie);
      return `
      <div class="movie-card" data-movie-id="${movieId}">
          <div class="movie-poster">
              <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
              <div class="movie-badge">${movie.genre?.split(",")[0] || "NEW"}</div>
          </div>
          <div class="movie-info">
              <h3 class="movie-title-text">${movie.title}</h3>
              <div class="movie-meta">
                  <span>${movie.duration || "120"} min</span>
                  <span>•</span>
                  <span>${movie.screen || "Screen"}</span>
              </div>
              <p class="movie-genre">${movie.genre || ""}</p>
              <div class="movie-price">
                  ₹${movie.price || 0}
                  <span class="price-label">onwards</span>
              </div>
              <button class="book-btn" data-movie-id="${movieId}" type="button">Book Now</button>
          </div>
      </div>
    `;
    })
    .filter(html => html !== "") // Remove empty strings from movies without IDs
    .join("");

  // Animation for smooth fade-in
  const cards = document.querySelectorAll(".movie-card");
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.style.animation = "fadeInUp 0.6s ease forwards";
    }, index * 100);
  });

  // Attach event listeners to all Book Now buttons
  const bookButtons = moviesGrid.querySelectorAll(".book-btn");
  console.log(`Attached event listeners to ${bookButtons.length} book buttons`);
  bookButtons.forEach((button) => {
    button.addEventListener("click", handleBookButtonClick);
    // Also add a visual indicator for debugging
    button.style.cursor = "pointer";
  });
}

// Handle "Book Now" click (fallback for legacy inline handlers)
window.bookMovie = (id) => {
  if (!id) {
    console.error("bookMovie called without ID");
    return;
  }
  const movie = movieCache.get(id);
  if (movie) {
    openTicketModal(movie);
  } else {
    console.error("Movie not found in cache for ID:", id);
}
};

// ==========================================================
// 🎨 PROFILE DROPDOWN STYLES
// ==========================================================
const style = document.createElement("style");
style.textContent = `
.profile-container { position: relative; z-index: 1001; }
.profile-btn {
    display: flex; align-items: center; gap: 0.7rem;
    padding: 0.5rem 1rem 0.5rem 0.5rem;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    color: #fff; font-weight: 600; border-radius: 50px;
    cursor: pointer; transition: all 0.3s ease;
    font-family: 'Poppins', sans-serif; font-size: 0.9rem;
}
.profile-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
.profile-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #6a11cb, #000000ff);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.85rem;
}
.dropdown-menu {
    position: absolute; top: calc(100% + 0.8rem); right: 0;
    min-width: 260px; background: rgba(17,17,17,0.98);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    opacity: 0; visibility: hidden; transform: translateY(-10px);
    transition: all 0.3s ease; z-index: 1000;
}
.dropdown-menu.show { opacity: 1; visibility: visible; transform: translateY(0); }
.dropdown-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.2rem; color: #ccc; font-size: 0.9rem; transition: all 0.2s ease; text-decoration:none;}
.dropdown-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
.logout-item { color: #ff6b6b; } .logout-item:hover { background: rgba(255,107,107,0.1); color: #ff5252; }
@media(max-width:768px){.profile-name{display:none;}.profile-btn{padding:0.5rem;}}
`;
document.head.appendChild(style);

// ==========================================================
// 🚀 INITIALIZATION
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  attachTicketModalEvents();
  checkLoginStatus();
  fetchMovies();
  
  // Event delegation for Book Now buttons (fallback)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("book-btn") || e.target.closest(".book-btn")) {
      const button = e.target.classList.contains("book-btn") ? e.target : e.target.closest(".book-btn");
      const movieId = button?.dataset?.movieId;
      if (movieId) {
        e.preventDefault();
        e.stopPropagation();
        const movie = movieCache.get(movieId);
        if (movie) {
          openTicketModal(movie);
        } else {
          console.error("Event delegation: Movie not found in cache for ID:", movieId);
          console.log("Available movie IDs in cache:", Array.from(movieCache.keys()));
        }
      } else {
        console.error("Event delegation: No movie ID found on button", button);
      }
    }
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target)
      target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
