// ============================
// 🎬 THEATRE ADMIN DASHBOARD JS
// ============================

// DOM Elements
const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const navItems = document.querySelectorAll(".nav-item");
const contentSections = document.querySelectorAll(".content-section");
const addMovieBtn = document.getElementById("addMovieBtn");
const movieForm = document.getElementById("movieForm");
const cancelMovieBtn = document.getElementById("cancelMovieBtn");
const movieFormElement = document.getElementById("movieFormElement");
const posterInput = document.getElementById("moviePoster");
const posterPreview = document.getElementById("posterPreview");
const moviesList = document.getElementById("moviesList");
const movieScreenSelect = document.getElementById("movieScreen");

// Dashboard elements
const statsGrid = document.querySelector(".stats-grid");
const activityList = document.getElementById("activityList");

// API Base URL
const API_BASE = `${window.location.origin}/api`;

let cachedScreens = [];
let allUsers = [];
let allBookings = [];

// ============================
// 🚀 INITIALIZATION
// ============================
document.addEventListener("DOMContentLoaded", function() {
    console.log("🔄 Admin Dashboard Initializing...");
    initializeAdmin();
});

async function initializeAdmin() {
    try {
        setupEventListeners();
        await loadScreens();
        await loadMovies();
        await loadDashboardStats();
        await loadUsers();
        await loadBookings();
        
        const year = document.querySelector(".current-year");
        if (year) year.textContent = new Date().getFullYear();
        
        console.log("✅ Admin Dashboard Loaded Successfully");
    } catch (error) {
        console.error("❌ Admin initialization failed:", error);
    }
}

// ============================
// ⚙️ EVENT LISTENERS
// ============================
function setupEventListeners() {
    console.log("🔧 Setting up event listeners...");
    
    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebar);
    }
    
    // Movie form
    if (addMovieBtn) {
        addMovieBtn.addEventListener("click", toggleMovieForm);
    }
    
    if (cancelMovieBtn) {
        cancelMovieBtn.addEventListener("click", toggleMovieForm);
    }
    
    if (posterInput) {
        posterInput.addEventListener("change", handlePosterPreview);
    }
    
    if (movieFormElement) {
        movieFormElement.addEventListener("submit", handleMovieSubmit);
    }
    
    // Navigation
    navItems.forEach((item) => {
        if (!item.classList.contains("logout")) {
            item.addEventListener("click", function() {
                switchSection(this.dataset.section);
            });
        }
    });
    
    console.log("✅ Event listeners setup complete");
}

// ============================
// 🧭 NAVIGATION
// ============================
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}

function switchSection(sectionId) {
    console.log(`🔄 Switching to section: ${sectionId}`);
    
    // Update nav items
    navItems.forEach((item) => {
        item.classList.toggle("active", item.dataset.section === sectionId);
    });

    // Show/hide content sections
    contentSections.forEach((section) => {
        section.classList.toggle("active", section.id === sectionId);
    });

    // Hide movie form when not in movies section
    if (movieForm && sectionId !== "movies") {
        movieForm.style.display = "none";
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove("active");
    }
}

// ============================
// 🎞 SCREEN MANAGEMENT
// ============================
async function loadScreens() {
    if (!movieScreenSelect) {
        console.log("❌ Screen select element not found");
        return;
    }

    console.log("🔄 Loading screens...");
    movieScreenSelect.disabled = true;
    movieScreenSelect.innerHTML = `<option value="">Loading screens...</option>`;

    try {
        const response = await fetch(`${API_BASE}/screens`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const screens = await response.json();
        cachedScreens = screens;

        if (!Array.isArray(screens) || screens.length === 0) {
            movieScreenSelect.innerHTML = `<option value="">No screens available</option>`;
            return;
        }

        movieScreenSelect.innerHTML = [
            `<option value="">Select Screen</option>`,
            ...screens.map(screen => 
                `<option value="${screen.code}">${screen.name} • ${screen.totalSeats} seats</option>`
            )
        ].join("");

        movieScreenSelect.disabled = false;
        console.log(`✅ Loaded ${screens.length} screens`);
    } catch (error) {
        console.error("❌ Error loading screens:", error);
        movieScreenSelect.innerHTML = `<option value="">Error loading screens</option>`;
        showNotification("⚠️ Failed to load screens", "error");
    }
}

// ============================
// 🎞 MOVIE FORM
// ============================
function toggleMovieForm() {
    if (!movieForm) return;
    
    if (movieForm.style.display === "none" || !movieForm.style.display) {
        movieForm.style.display = "block";
        movieForm.scrollIntoView({ behavior: "smooth" });
    } else {
        movieForm.style.display = "none";
        if (movieFormElement) {
            movieFormElement.reset();
        }
        if (posterPreview) {
            posterPreview.innerHTML = '<i class="fas fa-image"></i><span>Click to upload poster</span>';
            posterPreview.classList.remove("has-image");
        }
    }
}

// ============================
// 🖼 POSTER PREVIEW
// ============================
function handlePosterPreview(e) {
    const file = e.target.files[0];
    if (file && posterPreview) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            posterPreview.innerHTML = `<img src="${ev.target.result}" alt="Poster Preview">`;
            posterPreview.classList.add("has-image");
        };
        reader.readAsDataURL(file);
    }
}

// ============================
// ☁️ UPLOAD POSTER TO CLOUDINARY
// ============================
async function uploadPoster(file) {
    console.log("🔄 Uploading poster...");
    const formData = new FormData();
    formData.append("poster", file);

    try {
        const response = await fetch(`${API_BASE}/uploads/poster`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
        
        const data = await response.json();
        console.log("✅ Poster uploaded:", data.url);
        return data.url;
    } catch (error) {
        console.error("❌ Poster upload failed:", error);
        throw error;
    }
}

// ============================
// 🎬 ADD MOVIE
// ============================
async function handleMovieSubmit(event) {
    event.preventDefault();
    console.log("🔄 Adding new movie...");

    try {
        // Get form data
        const title = document.getElementById("movieTitle")?.value;
        const language = document.getElementById("movieLanguage")?.value;
        const duration = document.getElementById("movieDuration")?.value;
        const genre = document.getElementById("movieGenre")?.value;
        const description = document.getElementById("movieDescription")?.value;
        const screenCode = movieScreenSelect?.value;
        const price = document.getElementById("moviePrice")?.value;
        const showtimes = document.getElementById("movieShowtimes")?.value;

        // Validation
        if (!screenCode) {
            showNotification("❌ Please select a screen", "error");
            return;
        }

        if (!title || !language || !duration || !price) {
            showNotification("❌ Please fill all required fields", "error");
            return;
        }

        // Upload poster if available
        let posterUrl = "";
        const file = posterInput?.files[0];
        if (file) {
            posterUrl = await uploadPoster(file);
        }

        // Prepare showtimes
        const rawShowtimes = showtimes ? showtimes.split(",").map(t => t.trim()).filter(t => t.length > 0) : [];

        // Create movie data
        const movieData = {
            title,
            language,
            duration: parseInt(duration),
            genre,
            description,
            screenCode,
            price: parseFloat(price),
            showtimes: rawShowtimes,
            poster: posterUrl,
        };

        console.log("📦 Sending movie data:", movieData);

        // Send request
        const response = await fetch(`${API_BASE}/movies`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify(movieData),
        });

        if (response.ok) {
            showNotification("✅ Movie added successfully!", "success");
            
            // Reset form
            movieFormElement.reset();
            if (posterPreview) {
                posterPreview.innerHTML = '<i class="fas fa-image"></i><span>Click to upload poster</span>';
                posterPreview.classList.remove("has-image");
            }
            
            // Reload data
            await loadMovies();
            await loadDashboardStats();
            
            // Hide form
            movieForm.style.display = "none";
        } else {
            const errorData = await response.json();
            showNotification(`❌ Error: ${errorData.message || "Failed to add movie"}`, "error");
        }
    } catch (error) {
        console.error("❌ Movie submission error:", error);
        showNotification("⚠️ Failed to add movie. Check connection.", "error");
    }
}

// ============================
// 🎞 LOAD MOVIES
// ============================
async function loadMovies() {
    if (!moviesList) {
        console.log("❌ Movies list element not found");
        return;
    }

    console.log("🔄 Loading movies...");
    
    try {
        const response = await fetch(`${API_BASE}/movies`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const movies = await response.json();
        
        if (!moviesList) return;
        
        moviesList.innerHTML = "";
        
        if (!Array.isArray(movies) || movies.length === 0) {
            moviesList.innerHTML = '<div class="no-data">No movies found</div>';
            return;
        }

        movies.forEach((movie) => addMovieToGrid(movie));
        console.log(`✅ Loaded ${movies.length} movies`);
    } catch (error) {
        console.error("❌ Error loading movies:", error);
        if (moviesList) {
            moviesList.innerHTML = '<div class="no-data">Error loading movies</div>';
        }
        showNotification("⚠️ Failed to load movies", "error");
    }
}

// ============================
// 🧱 DISPLAY MOVIES IN GRID
// ============================
function addMovieToGrid(movie) {
    if (!moviesList) return;
    
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
        ${movie.poster ? `<img src="${movie.poster}" alt="${movie.title}" class="movie-poster" onerror="this.style.display='none'">` : ''}
        <div class="movie-info">
            <h3 class="movie-title">${movie.title || 'Untitled'}</h3>
            <div class="movie-details">
                <span>${movie.language || 'N/A'}</span>
                <span>${movie.duration || 0} min</span>
                <span>${movie.genre || 'N/A'}</span>
                <span>Screen ${movie.screen || 'N/A'}</span>
                <span>₹${movie.price || 0}</span>
            </div>
            <p>${movie.description || 'No description available'}</p>
            <div class="movie-actions">
                <button class="btn btn-secondary btn-sm" onclick="editMovie('${movie._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteMovie('${movie._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    moviesList.appendChild(card);
}

// ============================
// ❌ DELETE MOVIE (WORKING)
// ============================
async function deleteMovie(movieId) {
    if (!movieId) {
        showNotification("❌ Invalid movie ID", "error");
        return;
    }

    if (!confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
        return;
    }

    console.log(`🔄 Deleting movie: ${movieId}`);
    
    try {
        const response = await fetch(`${API_BASE}/movies/${movieId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            showNotification("✅ Movie deleted successfully!", "success");
            await loadMovies();
            await loadDashboardStats();
        } else {
            const errorData = await response.json();
            showNotification(`❌ Delete failed: ${errorData.message || "Unknown error"}`, "error");
        }
    } catch (error) {
        console.error("❌ Delete error:", error);
        showNotification("⚠️ Network error while deleting movie", "error");
    }
}

// ============================
// 📊 DASHBOARD STATS
// ============================
async function loadDashboardStats() {
    if (!statsGrid || !activityList) {
        console.log("❌ Dashboard elements not found");
        return;
    }

    console.log("🔄 Loading dashboard stats...");
    
    try {
        const [moviesResponse, bookingsResponse] = await Promise.all([
            fetch(`${API_BASE}/movies`),
            fetch(`${API_BASE}/bookings/admin/stats`).catch(() => null)
        ]);

        // Process movies
        let movieCount = 0;
        let movies = [];
        
        if (moviesResponse.ok) {
            movies = await moviesResponse.json();
            movieCount = Array.isArray(movies) ? movies.length : 0;
        }

        // Process booking stats
        let bookingStats = { todayBookings: 0, totalBookings: 0, totalRevenue: 0 };
        if (bookingsResponse && bookingsResponse.ok) {
            bookingStats = await bookingsResponse.json();
        }

        // Update stats grid
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-film"></i></div>
                    <div class="stat-info">
                        <h3>${movieCount}</h3>
                        <p>Active Movies</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <h3 id="userCount">${allUsers.length}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-ticket-alt"></i></div>
                    <div class="stat-info">
                        <h3>${bookingStats.todayBookings || 0}</h3>
                        <p>Today's Bookings</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                    <div class="stat-info">
                        <h3>₹${(bookingStats.totalRevenue || 0).toLocaleString('en-IN')}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
            `;
        }

        // Update activity list
        if (activityList) {
            if (movieCount === 0) {
                activityList.innerHTML = `<p style="color:#888;text-align:center;">No recent activity</p>`;
            } else {
                const recentMovies = movies.slice(-5).reverse();
                activityList.innerHTML = recentMovies.map(movie => `
                    <div class="activity-item">
                        <div class="activity-icon success"><i class="fas fa-plus-circle"></i></div>
                        <div class="activity-content">
                            <p>New movie: <strong>${movie.title}</strong></p>
                            <span>${new Date(movie.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        console.log("✅ Dashboard stats loaded");
    } catch (error) {
        console.error("❌ Dashboard stats error:", error);
        if (statsGrid) {
            statsGrid.innerHTML = '<div class="error">Error loading stats</div>';
        }
    }
}

// ============================
// 👥 USER MANAGEMENT
// ============================
async function loadUsers() {
    const usersTableBody = document.getElementById("usersTableBody");
    if (!usersTableBody) {
        console.log("❌ Users table not found");
        return;
    }

    console.log("🔄 Loading users...");
    
    try {
        const response = await fetch(`${API_BASE}/users`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const users = await response.json();
        allUsers = Array.isArray(users) ? users : [];

        // Update user count in dashboard
        const userCountEl = document.getElementById("userCount");
        if (userCountEl) {
            userCountEl.textContent = allUsers.length;
        }

        // Update users table
        if (allUsers.length === 0) {
            usersTableBody.innerHTML = `
                <tr><td colspan="5" style="text-align:center;color:#888;">No users found</td></tr>`;
        } else {
            usersTableBody.innerHTML = allUsers.map(user => `
                <tr>
                    <td>${user.firstName || ''} ${user.lastName || ''}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.phone || "—"}</td>
                    <td>${new Date(user.joinedAt || user.createdAt).toLocaleDateString()}</td>
                    <td>
                        ${user.isVerified ? 
                            '<span class="status-badge verified">Verified</span>' : 
                            '<span class="status-badge pending">Pending</span>'
                        }
                    </td>
                </tr>
            `).join('');
        }
        
        console.log(`✅ Loaded ${allUsers.length} users`);
    } catch (error) {
        console.error("❌ Error loading users:", error);
        usersTableBody.innerHTML = `
            <tr><td colspan="5" style="text-align:center;color:#ff6b6b;">Error loading users</td></tr>`;
    }
}

// ============================
// 🎫 BOOKINGS MANAGEMENT
// ============================
async function loadBookings() {
    const bookingsTableBody = document.getElementById("bookingsTableBody");
    if (!bookingsTableBody) {
        console.log("❌ Bookings table not found");
        return;
    }

    console.log("🔄 Loading bookings...");
    
    try {
        // Try admin endpoint first, then fallback to regular endpoint
        let response = await fetch(`${API_BASE}/bookings/admin/all`).catch(() => null);
        
        if (!response || !response.ok) {
            response = await fetch(`${API_BASE}/bookings`);
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const bookings = await response.json();
        allBookings = Array.isArray(bookings) ? bookings : [];

        // Update bookings table
        if (allBookings.length === 0) {
            bookingsTableBody.innerHTML = `
                <tr><td colspan="7" style="text-align:center;color:#888;">No bookings found</td></tr>`;
        } else {
            bookingsTableBody.innerHTML = allBookings.map((booking, index) => {
                const bookingDate = new Date(booking.bookingTime || booking.createdAt);
                const user = booking.user || {};
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${booking.ticketId || 'N/A'}</strong></td>
                        <td>
                            <div class="movie-info-small">
                                <strong>${booking.movie?.title || 'Unknown Movie'}</strong>
                                <small>Screen: ${booking.screen?.name || booking.screenCode || 'N/A'}</small>
                            </div>
                        </td>
                        <td>
                            <div class="user-info-small">
                                <strong>${user.firstName || 'Unknown'} ${user.lastName || ''}</strong>
                                <small>${user.email || 'N/A'}</small>
                            </div>
                        </td>
                        <td>
                            <div class="seats-info">
                                ${Array.isArray(booking.seats) ? 
                                    booking.seats.map(seat => `<span class="seat-badge">${seat}</span>`).join('') : 
                                    'N/A'
                                }
                            </div>
                        </td>
                        <td>₹${booking.totalAmount || 0}</td>
                        <td>
                            <span class="status-badge ${booking.status || 'pending'}">
                                ${booking.status || 'Pending'}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        console.log(`✅ Loaded ${allBookings.length} bookings`);
    } catch (error) {
        console.error("❌ Error loading bookings:", error);
        bookingsTableBody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;color:#ff6b6b;">Error loading bookings</td></tr>`;
    }
}

// ============================
// 🛠 PLACEHOLDERS
// ============================
function editMovie(id) {
    showNotification(`Edit feature coming soon for movie ${id}`, "info");
}

// ============================
// 🔔 NOTIFICATIONS
// ============================
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);

    // Close button
    notification.querySelector(".notification-close").addEventListener("click", () => {
        notification.remove();
    });

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// ============================
// 🎨 ADD CSS STYLES
// ============================
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        display: inline-block;
    }
    
    .status-badge.verified, .status-badge.confirmed, .status-badge.success {
        background: #d4edda;
        color: #155724;
    }
    
    .status-badge.pending {
        background: #fff3cd;
        color: #856404;
    }
    
    .status-badge.cancelled {
        background: #f8d7da;
        color: #721c24;
    }
    
    .seat-badge {
        display: inline-block;
        padding: 2px 6px;
        background: #667eea;
        color: white;
        border-radius: 4px;
        font-size: 11px;
        margin: 2px;
    }
    
    .movie-info-small, .user-info-small {
        display: flex;
        flex-direction: column;
    }
    
    .movie-info-small strong, .user-info-small strong {
        font-size: 14px;
    }
    
    .movie-info-small small, .user-info-small small {
        font-size: 12px;
        color: #666;
    }
    
    .seats-info {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    }
    
    .notification-success { background: #28a745; }
    .notification-error { background: #dc3545; }
    .notification-warning { background: #ffc107; color: #000; }
    .notification-info { background: #17a2b8; }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        margin-left: 10px;
        cursor: pointer;
        float: right;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .no-data, .error {
        text-align: center;
        padding: 20px;
        color: #666;
    }
`;

document.head.appendChild(adminStyles);

console.log("🎬 Admin Dashboard JS Loaded Successfully!");