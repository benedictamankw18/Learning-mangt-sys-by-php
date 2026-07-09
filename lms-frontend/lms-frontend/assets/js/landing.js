/**
 * Landing Page JavaScript
 * Handles navigation, smooth scrolling, and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScrolling();
    initNavbarScroll();
    initMobileMenu();
    initAnimations();
    initContactForm();
    initScrollSpy();
});

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"], a[href*="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Skip if it's just "#" or external links
            if (href === '#' || href.startsWith('http') || !href.includes('#')) {
                return;
            }
            
            // Extract the hash part (e.g., "#home" from "index.html#home")
            const hash = href.includes('#') ? '#' + href.split('#')[1] : href;
            const target = document.querySelector(hash);
            
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Add shadow to navbar on scroll
 */
function initNavbarScroll() {
    const navbar = document.querySelector('.landing-nav');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Toggle icon
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}

/**
 * Initialize scroll animations
 */
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Get all animated elements
    const animatedElements = document.querySelectorAll('.fade-in, .slide-down, .slide-up');
    
    // Check which elements are already in viewport and make them visible immediately
    animatedElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
            // Element is already visible, show it immediately
            el.classList.add('visible');
        }
        
        // Continue observing for scroll events
        observer.observe(el);
    });
}

/**
 * Add visible class for animations
 */
const style = document.createElement('style');
style.textContent = `
    .fade-in:not(.visible) {
        opacity: 0;
        transform: translateY(20px);
    }
    .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
`;
document.head.appendChild(style);

/**
 * Initialize contact form
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('contactFormMessage');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.btn-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        // Get form data
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value,
        };
        
        // Validate
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            showFormMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        formMessage.style.display = 'none';
        
        try {
            // In production, this would send to your API
            // await fetch('/api/contact', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Show success message
            showFormMessage(
                'Thank you for your message! We\'ll get back to you within 24 hours.',
                'success'
            );
            
            // Reset form
            contactForm.reset();
            
        } catch (error) {
            showFormMessage(
                'Oops! Something went wrong. Please try again or email us directly.',
                'error'
            );
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

/**
 * Show form message
 */
function showFormMessage(message, type) {
    const formMessage = document.getElementById('contactFormMessage');
    
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

/**
 * Initialize scroll spy for navigation highlighting
 */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href*="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) return;
    
    // Function to update active link based on scroll position
    function updateActiveLink() {
        let currentSection = '';
        const scrollPosition = window.scrollY + 150; // Offset for navbar height
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // Remove active class from all links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current section link
        if (currentSection) {
            // Try both formats: "#section" and "index.html#section"
            const activeLink = document.querySelector(`.nav-link[href="#${currentSection}"]`) ||
                             document.querySelector(`.nav-link[href="index.html#${currentSection}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        } else if (window.scrollY < 100) {
            // If at top, activate home link
            const homeLink = document.querySelector('.nav-link[href="#home"]') ||
                           document.querySelector('.nav-link[href="index.html#home"]');
            if (homeLink) homeLink.classList.add('active');
        }
    }
    
    // Update on scroll
    window.addEventListener('scroll', updateActiveLink);
    
    // Update on load
    updateActiveLink();
}

