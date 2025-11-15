// ==========================================================
// 🎬 MALABAR CINEHUB — MOBILE RESPONSIVE FRONTEND SCRIPT
// ==========================================================

// ==========================================================
// 🔐 GLOBAL AUTH HELPERS
// ==========================================================

function getCurrentUser() {
    try {
        const raw = localStorage.getItem("MALABAR_CINEHUB_USER");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (err) {
        console.error("Auth parse error:", err);
        return null;
    }
}

function isLoggedIn() {
    const user = getCurrentUser();
    return !!(user && user.loggedIn);
}

function requireLogin(event) {
    const user = getCurrentUser();

    if (!user || !user.loggedIn) {
        if (event && event.preventDefault) event.preventDefault();
        window.location.href = "/login-form/login.html";
        return false;
    }

    return true;
}

window.MCH_AUTH = {
    getCurrentUser,
    isLoggedIn,
    requireLogin,
};

// ==========================================================
// 🎬 MAIN INITIALIZATION
// ==========================================================

function initializeApp() {
    initNavbar();
    initScrollAnimations();
    initPartnerLogos();
    initSmoothScrolling();
    initIntersectionObservers();
    initButtonEffects();
    initResponsiveBehavior();
    initTicketBooking();
    checkLoginStatus();
    initMobileBottomNav();
}

// ==========================================================
// 🧭 NAVBAR FUNCTIONALITY
// ==========================================================

function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (!navbar) return;

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (hamburger && navLinks) {
        // Hamburger menu toggle
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// ==========================================================
// 📱 MOBILE BOTTOM NAVIGATION
// ==========================================================

function initMobileBottomNav() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    // Create mobile bottom nav if not exists
    let bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) return; // Already exists

    bottomNav = document.createElement('div');
    bottomNav.className = 'mobile-bottom-nav';
    
    const user = getCurrentUser();
    
    if (user && user.loggedIn) {
        // Show ticket button and profile
        bottomNav.innerHTML = `
            <a href="/booking/booking.html" class="ticket-btn" data-require-login="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
                    <path d="M13 5v2"></path>
                    <path d="M13 17v2"></path>
                    <path d="M13 11v2"></path>
                </svg>
                Book Tickets
            </a>
            <div class="profile-container">
                <button class="profile-btn" id="mobileProfileBtn">
                    <div class="profile-avatar">
                        ${(user.firstName?.charAt(0) || "U")}${user.lastName?.charAt(0) || ""}
                    </div>
                    <span class="profile-name">${user.firstName || "User"}</span>
                </button>
                <div class="dropdown-menu" id="mobileDropdownMenu">
                    <div class="dropdown-header">
                        <div class="dropdown-avatar">
                            ${(user.firstName?.charAt(0) || "U")}${user.lastName?.charAt(0) || ""}
                        </div>
                        <div class="dropdown-info">
                            <p class="dropdown-name">${user.firstName || ""} ${user.lastName || ""}</p>
                            <p class="dropdown-email">${user.email || ""}</p>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        My Profile
                    </a>
                    <a href="#" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        My Bookings
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-item" id="mobileLogoutBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                    </a>
                </div>
            </div>
        `;
    } else {
        // Show ticket button and login
        bottomNav.innerHTML = `
            <a href="/booking/booking.html" class="ticket-btn" data-require-login="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
                    <path d="M13 5v2"></path>
                    <path d="M13 17v2"></path>
                    <path d="M13 11v2"></path>
                </svg>
                Book
            </a>
            <a href="/login-form/login.html" class="login-btn">Login</a>
        `;
    }
    
    document.body.appendChild(bottomNav);
    
    // Setup mobile profile dropdown
    if (user && user.loggedIn) {
        setupMobileProfileDropdown();
    }
    
    // Reinit ticket booking for mobile nav
    initTicketBooking();
}

function setupMobileProfileDropdown() {
    const profileBtn = document.getElementById('mobileProfileBtn');
    const dropdownMenu = document.getElementById('mobileDropdownMenu');
    const logoutBtn = document.getElementById('mobileLogoutBtn');
    
    if (!profileBtn || !dropdownMenu) return;
    
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
        profileBtn.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            profileBtn.classList.remove('active');
        }
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("MALABAR_CINEHUB_USER");
            window.location.reload();
        });
    }
}

// ==========================================================
// 🔐 LOGIN STATUS & PROFILE (Desktop Navbar)
// ==========================================================

function checkLoginStatus() {
    const user = getCurrentUser();
    const loginBtn = document.querySelector('.nav-buttons .login-btn');
    
    if (!loginBtn) return;

    if (user && user.loggedIn) {
        // Replace login button with profile dropdown
        const navButtons = document.querySelector('.nav-buttons');
        const ticketBtn = navButtons.querySelector('.ticket-btn');
        
        navButtons.innerHTML = '';
        if (ticketBtn) navButtons.appendChild(ticketBtn);
        
        const profileContainer = document.createElement('div');
        profileContainer.className = 'profile-container';
        profileContainer.innerHTML = `
            <button class="profile-btn" id="profileBtn">
                <div class="profile-avatar">
                    ${(user.firstName?.charAt(0) || "U")}${user.lastName?.charAt(0) || ""}
                </div>
                <span class="profile-name">${user.firstName || "User"}</span>
                <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="dropdown-menu" id="dropdownMenu">
                <div class="dropdown-header">
                    <div class="dropdown-avatar">
                        ${(user.firstName?.charAt(0) || "U")}${user.lastName?.charAt(0) || ""}
                    </div>
                    <div class="dropdown-info">
                        <p class="dropdown-name">${user.firstName || ""} ${user.lastName || ""}</p>
                        <p class="dropdown-email">${user.email || ""}</p>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    My Profile
                </a>
                <a href="#" class="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    My Bookings
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-item" id="logoutBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                </a>
            </div>
        `;
        
        navButtons.appendChild(profileContainer);
        setupProfileDropdown();
    }
}

function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!profileBtn || !dropdownMenu) return;
    
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
        profileBtn.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            profileBtn.classList.remove('active');
        }
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("MALABAR_CINEHUB_USER");
            window.location.reload();
        });
    }
}

// ==========================================================
// 🎫 TICKET BOOKING FUNCTIONALITY
// ==========================================================

function initTicketBooking() {
    document.querySelectorAll('.ticket-btn').forEach(btn => {
        // Remove old listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function(e) {
            if (!requireLogin(e)) return;
            
            this.classList.add('loading');
            setTimeout(() => {
                const href = this.getAttribute('href') || "/booking/booking.html";
                window.location.href = href;
            }, 500);
        });
    });

    document.querySelectorAll("[data-require-login='true']").forEach(el => {
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        
        newEl.addEventListener("click", (e) => {
            if (!requireLogin(e)) return;
        });
    });
}

// ==========================================================
// 🎨 ANIMATIONS & EFFECTS
// ==========================================================

function initScrollAnimations() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero && window.innerWidth > 768) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

function initPartnerLogos() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const logoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = entry.target.dataset.index || 0;
                const delay = parseInt(index) * 100;
                
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                logoObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.logo-wrapper').forEach(wrapper => {
        logoObserver.observe(wrapper);
    });
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === "#") return;
            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
}

function initIntersectionObservers() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
        fadeObserver.observe(el);
    });
}

function initButtonEffects() {
    const bookNowBtn = document.querySelector('.book-now-btn');
    
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
}

function initResponsiveBehavior() {
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const hamburger = document.getElementById('hamburger');
            const navLinks = document.getElementById('navLinks');
            
            if (window.innerWidth > 768) {
                if (hamburger) hamburger.classList.remove('active');
                if (navLinks) {
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                // Remove mobile bottom nav on desktop
                const mobileNav = document.querySelector('.mobile-bottom-nav');
                if (mobileNav) mobileNav.remove();
            } else {
                // Reinit mobile bottom nav
                const mobileNav = document.querySelector('.mobile-bottom-nav');
                if (!mobileNav) {
                    initMobileBottomNav();
                }
            }
        }, 250);
    });
}

// ==========================================================
// 🚀 START APPLICATION
// ==========================================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Export functions
window.MALABAR_CINEHUB = {
    initializeApp,
    checkLoginStatus,
    getCurrentUser,
    isLoggedIn,
    requireLogin,
};
