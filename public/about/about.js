// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

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

// Scroll animations with IntersectionObserver
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            animateObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements with data-animate attribute
document.querySelectorAll('[data-animate]').forEach(element => {
    animateObserver.observe(element);
});

// Counter animation for stats
const counters = document.querySelectorAll('.stat-number');
const speed = 200;

const runCounter = (counter) => {
    const target = parseInt(counter.getAttribute('data-target'));
    const increment = target / speed;
    let count = 0;

    const updateCounter = () => {
        count += increment;
        if (count < target) {
            // Format numbers with commas for readability
            if (target >= 1000000) {
                counter.textContent = (count / 1000000).toFixed(1) + 'M+';
            } else if (target >= 1000) {
                counter.textContent = Math.ceil(count / 1000) + 'K+';
            } else {
                counter.textContent = Math.ceil(count) + '%';
            }
            requestAnimationFrame(updateCounter);
        } else {
            // Final value
            if (target >= 1000000) {
                counter.textContent = (target / 1000000).toFixed(1) + 'M+';
            } else if (target >= 1000) {
                counter.textContent = (target / 1000) + 'K+';
            } else {
                counter.textContent = target + '%';
            }
        }
    };

    updateCounter();
};

// Observer for stats counter
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target.querySelector('.stat-number');
            if (counter && !counter.classList.contains('counted')) {
                counter.classList.add('counted');
                runCounter(counter);
            }
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observe all stat cards
document.querySelectorAll('.stat-card').forEach(card => {
    statsObserver.observe(card);
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

// CTA button click effect
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
    ctaBtn.addEventListener('click', function(e) {
        // Create ripple effect
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
        
        // Navigate to booking or show alert
        console.log('Booking tickets...');
        // You can add actual booking functionality here
        // window.location.href = '/booking.html';
    });
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.about-hero');
    if (hero && scrolled < hero.offsetHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add cursor glow effect on mouse move
let cursorGlowTimeout;
document.addEventListener('mousemove', (e) => {
    // Throttle the cursor glow creation
    if (cursorGlowTimeout) return;
    
    cursorGlowTimeout = setTimeout(() => {
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        glow.style.left = e.pageX + 'px';
        glow.style.top = e.pageY + 'px';
        document.body.appendChild(glow);
        
        setTimeout(() => {
            glow.remove();
        }, 1000);
        
        cursorGlowTimeout = null;
    }, 50);
});

// Add dynamic styles for effects
const style = document.createElement('style');
style.textContent = `
    .cursor-glow {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(150, 150, 150, 0.3) 0%, transparent 70%);
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
`;
document.head.appendChild(style);

// Page load animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Add hover effect sound (optional - can be enabled with audio files)
const addHoverSound = false; // Set to true if you want to add sound effects
if (addHoverSound) {
    const hoverSound = new Audio('/assets/sounds/hover.mp3');
    hoverSound.volume = 0.2;
    
    document.querySelectorAll('.feature-card, .team-card, .value-item').forEach(element => {
        element.addEventListener('mouseenter', () => {
            hoverSound.currentTime = 0;
            hoverSound.play().catch(() => {
                // Handle autoplay restrictions
            });
        });
    });
}

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Add active state to current nav link based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active');
            });
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
});

// Handle window resize for responsive adjustments
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    }, 250);
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Close menu with Escape key
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

// Accessibility: Focus management for mobile menu
const focusableElements = navLinks.querySelectorAll('a, button');
const firstFocusable = focusableElements[0];
const lastFocusable = focusableElements[focusableElements.length - 1];

navLinks.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
});

// Console message for developers
console.log('%cMALABAR CINEHUB Premium Cinema', 'color: #888888; font-size: 24px; font-weight: bold;');
console.log('%cExperience the magic of cinema', 'color: #b0b0b0; font-size: 16px;');
console.log('%cDeveloped with care for movie lovers', 'color: #ffffff; font-size: 14px;');