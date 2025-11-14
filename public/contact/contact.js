// Navbar elements
const API_BASE = `${window.location.origin}/api`;

// Navbar elements
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

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

// Check if user is logged in and update navbar
function checkLoginStatusAndAdminStatus() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) return;

    fetch(`${API_BASE}/users/me`, { credentials: "include" })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
            if (user) {
                // User is logged in - show profile dropdown
                const avatarInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
                loginBtn.outerHTML = `
            <div class="profile-container">
                <button class="profile-btn" id="profileBtn">
                    <div class="profile-avatar">${avatarInitials}</div>
                    <span class="profile-name">${user.firstName}</span>
                    <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="dropdown-menu" id="dropdownMenu">
                    <div class="dropdown-header">
                        <div class="dropdown-avatar">${avatarInitials}</div>
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
                    <a href="/booking/booking.html" class="dropdown-item">
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
                    ${user.isAdmin ? `
                    <a href="/admin/admin.html" class="dropdown-item">
                        <i class="fas fa-user-shield"></i>
                        Admin Panel
                    </a>` : ''}
                    <div class="dropdown-divider"></div>
                    <a href="/auth/logout" class="dropdown-item logout-item" id="logoutBtn">
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
                setupProfileDropdown(); // Re-attach event listeners for the new elements
                addAdminButtonIfAdmin(user); // Add button at bottom if admin
            } else {
                // User is not logged in, keep the original login button
                // No change needed, loginBtn already exists
            }
        })
        .catch(err => console.error("Error checking login status:", err));
}

// Setup profile dropdown interactions
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
                // No e.preventDefault() needed, link goes to /auth/logout
                localStorage.removeItem('MALABAR_CINEHUB_USER'); // Clear JWT if it exists
            });
        }
    }
}

// New function to add admin button at the bottom of the page
function addAdminButtonIfAdmin(user) {
    const adminButtonContainer = document.getElementById('adminButtonContainer');
    if (!adminButtonContainer || !user || !user.isAdmin) {
        return;
    }

    const adminButton = document.createElement('a');
    adminButton.href = '/admin/admin.html';
    adminButton.className = 'admin-panel-btn'; // Add a class for styling
    adminButton.innerHTML = `<i class="fas fa-user-shield"></i> Admin Panel`;
    adminButtonContainer.appendChild(adminButton);
}

// Check login status on page load
document.addEventListener('DOMContentLoaded', checkLoginStatusAndAdminStatus);

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
const successModal = document.getElementById('successModal');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Get form data
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
    };

    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'An unknown error occurred.');
        }

        // --- Handle Admin Redirect ---
        if (data.isAdminRedirect) {
            window.location.href = '/admin/admin.html';
            return; // Stop further execution
        }

        // Show success modal for normal users
        successModal.classList.add('show');
        contactForm.reset();

    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
});

// Modal close function
function closeModal() {
    successModal.classList.remove('show');
}

// Close modal when clicking outside
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && successModal.classList.contains('show')) {
        closeModal();
    }
});

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        // Close other items
        faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle current item
        item.classList.toggle('active');
    });
});

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

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.contact-hero');
    if (hero && window.innerWidth > 768) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Input animations
const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');

formInputs.forEach(input => {
    // Add focus class for labels
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.parentElement.classList.remove('focused');
        }
    });
    
    // Check if input has value on load
    if (input.value) {
        input.parentElement.classList.add('focused');
    }
});

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return phone === '' || re.test(phone);
}

// Real-time validation
document.getElementById('email').addEventListener('blur', function() {
    if (this.value && !validateEmail(this.value)) {
        this.style.borderColor = 'rgba(255, 107, 107, 0.6)';
        setTimeout(() => {
            this.style.borderColor = '';
        }, 2000);
    }
});

document.getElementById('phone').addEventListener('blur', function() {
    if (this.value && !validatePhone(this.value)) {
        this.style.borderColor = 'rgba(255, 107, 107, 0.6)';
        setTimeout(() => {
            this.style.borderColor = '';
        }, 2000);
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe info cards
document.querySelectorAll('.info-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Observe FAQ items
document.querySelectorAll('.faq-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = `all 0.5s ease ${index * 0.1}s`;
    observer.observe(item);
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Add cursor glow effect on contact form
const contactFormWrapper = document.querySelector('.contact-form-wrapper');
if (contactFormWrapper && window.innerWidth > 768) {
    contactFormWrapper.addEventListener('mousemove', (e) => {
        const rect = contactFormWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        contactFormWrapper.style.background = `
            radial-gradient(circle 600px at ${x}px ${y}px, 
            rgba(100, 100, 100, 0.1), 
            rgba(255, 255, 255, 0.03))
        `;
    });
    
    contactFormWrapper.addEventListener('mouseleave', () => {
        contactFormWrapper.style.background = 'rgba(255, 255, 255, 0.03)';
    });
}

// Add CSS for the admin button dynamically
style.textContent += `
    .admin-button-container {
        text-align: center;
        margin-top: 40px;
        padding-bottom: 40px;
    }
    .admin-panel-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 25px;
        background: linear-gradient(45deg, #6a11cb, #2575fc);
        color: #fff;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .admin-panel-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        background: linear-gradient(45deg, #5a0fbb, #1e60e0);
    }
    .admin-panel-btn i {
        font-size: 1.1rem;
    }
`;

// Add profile dropdown styles dynamically
const style = document.createElement('style');
style.textContent = `
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
        background: linear-gradient(135deg, #666, #444);
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
        background: linear-gradient(135deg, #666, #444);
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
`;
document.head.appendChild(style);

// Console log for debugging
console.log('MALABAR CINEHUB Contact Page Loaded Successfully!');