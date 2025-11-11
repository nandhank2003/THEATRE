// ==========================================================
// 🎬 MAIN INITIALIZATION
// ==========================================================

function initializeApp() {
    // Initialize navbar functionality
    initNavbar();
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize partner logos animation
    initPartnerLogos();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize intersection observers
    initIntersectionObservers();
    
    // Initialize button effects
    initButtonEffects();
    
    // Initialize responsive behavior
    initResponsiveBehavior();
    
    // Initialize ticket booking
    initTicketBooking();
    
    // Check login status
    checkLoginStatus();
}

// ==========================================================
// 🧭 NAVBAR FUNCTIONALITY
// ==========================================================

function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (!navbar || !hamburger || !navLinks) {
        console.warn('Navbar elements not found');
        return;
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Hamburger menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// ==========================================================
// 🔐 LOGIN STATUS & PROFILE
// ==========================================================

function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('MALABAR CINEHUBUser'));
    const loginBtn = document.querySelector('.login-btn');
    
    if (user && loginBtn) {
        // User is logged in - show profile dropdown
        loginBtn.outerHTML = `
            <div class="profile-container">
                <button class="profile-btn" id="profileBtn">
                    <div class="profile-avatar">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>
                    <span class="profile-name">${user.firstName}</span>
                    <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="dropdown-menu" id="dropdownMenu">
                    <div class="dropdown-header">
                        <div class="dropdown-avatar">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>
                        <div class="dropdown-info">
                            <p class="dropdown-name">${user.firstName} ${user.lastName}</p>
                            <p class="dropdown-email">${user.email}</p>
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
                    <a href="#" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m4.22-13.22l-1.42 1.42M10.2 13.8l-1.42 1.42M1 12h6m6 0h6M4.22 4.22l1.42 1.42M13.8 13.8l1.42 1.42M4.22 19.78l1.42-1.42M13.8 10.2l1.42-1.42"></path>
                        </svg>
                        Settings
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
            </div>
        `;
        
        // Add profile dropdown functionality
        setupProfileDropdown();
    }
}

function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (profileBtn && dropdownMenu) {
        // Toggle dropdown
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            profileBtn.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                profileBtn.classList.remove('active');
            }
        });
        
        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('MALABAR CINEHUBUser');
                window.location.reload();
            });
        }
    }
}

// ==========================================================
// 🎫 TICKET BOOKING FUNCTIONALITY
// ==========================================================

function initTicketBooking() {
    const ticketBtn = document.querySelector('.ticket-btn');
    
    if (ticketBtn) {
        ticketBtn.addEventListener('click', function(e) {
            // Check if user is logged in
            const user = JSON.parse(localStorage.getItem('MALABAR CINEHUBUser'));
            
            if (!user) {
                // If not logged in, show login prompt or redirect to login
                e.preventDefault();
                const proceed = confirm('Please login to book tickets. Would you like to login now?');
                if (proceed) {
                    window.location.href = '/public/login-form/login.html';
                }
                return;
            }
            
            // Add loading state
            this.classList.add('loading');
            
            // Simulate booking process
            setTimeout(() => {
                this.classList.remove('loading');
                // Redirect to booking page
                window.location.href = this.getAttribute('href');
            }, 1000);
        });
    }
}

// ==========================================================
// 🎨 ANIMATIONS & EFFECTS
// ==========================================================

function initScrollAnimations() {
    // Add parallax effect to hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

function initPartnerLogos() {
    // Logo entrance animation with IntersectionObserver
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const logoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = entry.target.dataset.index;
                const delay = parseInt(index) * 100;
                
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                logoObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all logo wrappers
    document.querySelectorAll('.logo-wrapper').forEach(wrapper => {
        logoObserver.observe(wrapper);
    });

    // Duplicate marquee content for seamless loop
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContent) {
        const clone = marqueeContent.cloneNode(true);
        marqueeContent.parentElement.appendChild(clone);
    }
}

function initSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initIntersectionObservers() {
    // Initialize any additional intersection observers here
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

    // Observe elements with fade-in class
    document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
        fadeObserver.observe(el);
    });
}

function initButtonEffects() {
    // Book Now button ripple effect
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
            
            // You can add booking functionality here
            console.log('Book Now clicked!');
        });
    }

    // Add cursor glow effect (optional premium feature)
    document.addEventListener('mousemove', (e) => {
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        glow.style.left = e.pageX + 'px';
        glow.style.top = e.pageY + 'px';
        document.body.appendChild(glow);
        
        setTimeout(() => {
            glow.remove();
        }, 1000);
    });
}

function initResponsiveBehavior() {
    // Handle responsive behavior
    window.addEventListener('resize', () => {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        
        if (window.innerWidth > 768) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// ==========================================================
// 🎯 EVENT LISTENERS & INITIALIZATION
// ==========================================================

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Add CSS for cursor glow and profile dropdown dynamically
const style = document.createElement('style');
style.textContent = `
    .cursor-glow {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(106, 17, 203, 0.3) 0%, transparent 70%);
        pointer-events: none;
        z-index: 9999;
        animation: glowFade 1s ease-out forwards;
    }
    
    @keyframes glowFade {
        to {
            opacity: 0;
            transform: scale(2);
        }
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    /* Profile Dropdown Styles */
    .profile-container {
        position: relative;
        z-index: 1001;
    }
    
    .profile-btn {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.5rem 1rem 0.5rem 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        color: #fff;
        font-weight: 600;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
    }
    
    .profile-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
    }
    
    .profile-btn.active {
        background: rgba(255, 255, 255, 0.15);
    }
    
    .profile-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6a11cb, #000000ff);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.85rem;
        letter-spacing: 0.5px;
    }
    
    .profile-name {
        font-weight: 500;
        font-size: 0.9rem;
    }
    
    .dropdown-arrow {
        transition: transform 0.3s ease;
    }
    
    .profile-btn.active .dropdown-arrow {
        transform: rotate(180deg);
    }
    
    .dropdown-menu {
        position: absolute;
        top: calc(100% + 0.8rem);
        right: 0;
        min-width: 260px;
        background: rgba(17, 17, 17, 0.98);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
    }
    
    .dropdown-menu.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .dropdown-header {
        padding: 1.2rem;
        display: flex;
        align-items: center;
        gap: 0.9rem;
    }
    
    .dropdown-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6a11cb, #2575fc);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 0.5px;
        flex-shrink: 0;
    }
    
    .dropdown-info {
        flex: 1;
        min-width: 0;
    }
    
    .dropdown-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: #fff;
        margin-bottom: 0.2rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .dropdown-email {
        font-size: 0.8rem;
        color: #888;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .dropdown-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 0.5rem 0;
    }
    
    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.9rem 1.2rem;
        color: #ccc;
        text-decoration: none;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }
    
    .dropdown-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
    }
    
    .dropdown-item svg {
        flex-shrink: 0;
    }
    
    .logout-item {
        color: #ff6b6b;
    }
    
    .logout-item:hover {
        background: rgba(255, 107, 107, 0.1);
        color: #ff5252;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
        .profile-name {
            display: none;
        }
        
        .profile-btn {
            padding: 0.5rem;
        }
        
        .dropdown-arrow {
            display: none;
        }
        
        .dropdown-menu {
            right: -10px;
            min-width: 240px;
        }
    }
    
    @media (max-width: 480px) {
        .dropdown-menu {
            right: -20px;
            left: auto;
            min-width: 220px;
        }
        
        .dropdown-header {
            padding: 1rem;
        }
        
        .dropdown-avatar {
            width: 42px;
            height: 42px;
            font-size: 0.9rem;
        }
        
        .dropdown-item {
            padding: 0.8rem 1rem;
            font-size: 0.85rem;
        }
    }
    
    /* Loading state for buttons */
    .ticket-btn.loading {
        pointer-events: none;
        opacity: 0.7;
    }
    
    .ticket-btn.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// ==========================================================
// 🚀 START APPLICATION
// ==========================================================

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Export functions for global access (if needed)
window.MALABAR_CINEHUB = {
    initializeApp,
    checkLoginStatus
};