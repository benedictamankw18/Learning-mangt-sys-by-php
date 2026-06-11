/**
 * Mobile Navigation & Responsive Interactions
 * LMS Frontend - All Roles
 * 
 * Handles:
 * - Sidebar toggle (mobile drawer)
 * - Search bar collapse/expand (mobile)
 * - Overlay click to close
 * - Keyboard escape to close
 * - Local storage to persist sidebar state
 */

class MobileNavigation {
    constructor(config = {}) {
        this.config = {
            hamburgerSelector: config.hamburgerSelector || '.hamburger-btn',
            sidebarSelector: config.sidebarSelector || '.sidebar-mobile',
            overlaySelector: config.overlaySelector || '.sidebar-overlay',
            searchToggleSelector: config.searchToggleSelector || '.search-toggle',
            searchContainerSelector: config.searchContainerSelector || '.search-container',
            breakpoint: config.breakpoint || 768, // md breakpoint
            storageKey: 'lms-sidebar-open',
            ...config
        };

        this.elements = {
            hamburger: null,
            sidebar: null,
            overlay: null,
            searchToggle: null,
            searchContainer: null
        };

        this.state = {
            sidebarOpen: false,
            searchOpen: false
        };

        this.init();
    }

    /**
     * Initialize mobile navigation
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupWindowListener();
        this.restoreSidebarState();
        
        console.log('[MobileNav] Initialized');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements.hamburger = document.querySelector(this.config.hamburgerSelector);
        this.elements.sidebar = document.querySelector(this.config.sidebarSelector);
        this.elements.overlay = document.querySelector(this.config.overlaySelector);
        this.elements.searchToggle = document.querySelector(this.config.searchToggleSelector);
        this.elements.searchContainer = document.querySelector(this.config.searchContainerSelector);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Hamburger button click
        if (this.elements.hamburger) {
            this.elements.hamburger.addEventListener('click', () => this.toggleSidebar());
        }

        // Overlay click to close
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', () => this.closeSidebar());
        }

        // Sidebar nav items click (auto-close on mobile)
        if (this.elements.sidebar) {
            const navItems = this.elements.sidebar.querySelectorAll('a, button');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (this.isMobileView()) {
                        this.closeSidebar();
                    }
                });
            });
        }

        // Search toggle click
        if (this.elements.searchToggle) {
            this.elements.searchToggle.addEventListener('click', () => this.toggleSearch());
        }

        // Escape key to close sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
                this.closeSearch();
            }
        });
    }

    /**
     * Setup window resize listener for responsive behavior
     */
    setupWindowListener() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Close mobile UI on larger screens
                if (!this.isMobileView()) {
                    this.closeSidebar();
                    this.closeSearch();
                }
            }, 250);
        });
    }

    /**
     * Check if current viewport is mobile
     */
    isMobileView() {
        return window.innerWidth < this.config.breakpoint;
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        if (this.state.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * Open sidebar
     */
    openSidebar() {
        if (!this.isMobileView()) return;

        this.state.sidebarOpen = true;

        if (this.elements.sidebar) {
            this.elements.sidebar.classList.add('active');
        }

        if (this.elements.overlay) {
            this.elements.overlay.classList.add('active');
        }

        if (this.elements.hamburger) {
            this.elements.hamburger.classList.add('active');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Save state
        this.saveSidebarState(true);

        console.log('[MobileNav] Sidebar opened');
    }

    /**
     * Close sidebar
     */
    closeSidebar() {
        this.state.sidebarOpen = false;

        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove('active');
        }

        if (this.elements.overlay) {
            this.elements.overlay.classList.remove('active');
        }

        if (this.elements.hamburger) {
            this.elements.hamburger.classList.remove('active');
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Save state
        this.saveSidebarState(false);

        console.log('[MobileNav] Sidebar closed');
    }

    /**
     * Toggle search visibility
     */
    toggleSearch() {
        if (this.state.searchOpen) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }

    /**
     * Open search
     */
    openSearch() {
        if (!this.isMobileView()) return;

        this.state.searchOpen = true;

        if (this.elements.searchContainer) {
            this.elements.searchContainer.classList.add('mobile-expanded');
        }

        if (this.elements.searchToggle) {
            this.elements.searchToggle.classList.add('active');
        }

        // Focus search input
        const searchInput = this.elements.searchContainer?.querySelector('.search-input');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        console.log('[MobileNav] Search opened');
    }

    /**
     * Close search
     */
    closeSearch() {
        this.state.searchOpen = false;

        if (this.elements.searchContainer) {
            this.elements.searchContainer.classList.remove('mobile-expanded');
        }

        if (this.elements.searchToggle) {
            this.elements.searchToggle.classList.remove('active');
        }

        // Restore body scroll
        document.body.style.overflow = '';

        console.log('[MobileNav] Search closed');
    }

    /**
     * Save sidebar state to local storage
     */
    saveSidebarState(isOpen) {
        try {
            localStorage.setItem(this.config.storageKey, isOpen ? '1' : '0');
        } catch (e) {
            console.warn('[MobileNav] Could not save to localStorage:', e);
        }
    }

    /**
     * Restore sidebar state from local storage
     */
    restoreSidebarState() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            // Don't auto-open sidebar on page load for better UX
            // Just load the preference for later use
        } catch (e) {
            console.warn('[MobileNav] Could not read from localStorage:', e);
        }
    }

    /**
     * Handle modal/dialog responsiveness
     * Closes modals on small screens if they're not essential
     */
    closeNonEssentialModals() {
        if (!this.isMobileView()) return;

        const modals = document.querySelectorAll('[role="dialog"]:not([data-essential="true"])');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('[aria-label="Close"]');
            if (closeBtn) {
                closeBtn.click();
            }
        });
    }

    /**
     * Public method to manually open/close sidebar
     */
    setSidebarOpen(isOpen) {
        if (isOpen) {
            this.openSidebar();
        } else {
            this.closeSidebar();
        }
    }

    /**
     * Get sidebar state
     */
    isSidebarOpen() {
        return this.state.sidebarOpen;
    }
}

/**
 * Auto-initialize on DOM ready
 * Supports multiple instances for different sections (admin, teacher, student, etc.)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if we should auto-initialize (data attribute on body)
    if (document.body.getAttribute('data-mobile-nav') === 'auto') {
        window.mobileNav = new MobileNavigation();
    }
});

/**
 * USAGE EXAMPLES:
 * 
 * 1. Auto-initialize with defaults:
 *    <body data-mobile-nav="auto">
 *
 * 2. Manual initialization in your script:
 *    const nav = new MobileNavigation({
 *        hamburgerSelector: '.hamburger-btn',
 *        sidebarSelector: '.sidebar-mobile',
 *        breakpoint: 768
 *    });
 *
 * 3. Programmatic control:
 *    nav.openSidebar();
 *    nav.closeSidebar();
 *    nav.isSidebarOpen();
 *
 * 4. Custom breakpoint:
 *    const nav = new MobileNavigation({ breakpoint: 1024 });
 *
 * 5. Access instance globally:
 *    window.mobileNav.toggleSidebar();
 */
