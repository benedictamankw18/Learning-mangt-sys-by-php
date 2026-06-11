/* ============================================
   Image Lazy Loading with Intersection Observer
   ============================================ */

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      root: null,
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01,
      errorClass: options.errorClass || 'lazy-error',
      loadingClass: options.loadingClass || 'lazy-loading'
    };

    this.observer = null;
    this.initIntersectionObserver();
    this.initDOMContentLoaded();
  }

  /**
   * Initialize Intersection Observer
   */
  initIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
        }
      });
    }, this.options);
  }

  /**
   * Initialize on DOM content loaded
   */
  initDOMContentLoaded() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.observeImages());
    } else {
      this.observeImages();
    }
  }

  /**
   * Find and observe all lazy-loadable images
   */
  observeImages() {
    // Images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.observer?.observe(img);
    });

    // Background images with data-bg attribute
    document.querySelectorAll('[data-bg]').forEach(el => {
      this.observer?.observe(el);
    });

    // Iframes with data-src attribute
    document.querySelectorAll('iframe[data-src]').forEach(iframe => {
      this.observer?.observe(iframe);
    });
  }

  /**
   * Load a single image
   * @param {Element} element - Image or element to load
   */
  loadImage(element) {
    if (!element) return;

    // Stop observing once image is loaded
    this.observer?.unobserve(element);

    try {
      if (element.tagName === 'IMG') {
        this.loadImgElement(element);
      } else if (element.tagName === 'IFRAME') {
        this.loadIframeElement(element);
      } else if (element.hasAttribute('data-bg')) {
        this.loadBackgroundImage(element);
      }
    } catch (error) {
      console.error('Error loading lazy image:', error);
      element.classList.add(this.options.errorClass);
    }
  }

  /**
   * Load img element
   * @param {HTMLImageElement} img - Image element
   */
  loadImgElement(img) {
    const src = img.getAttribute('data-src');
    const srcset = img.getAttribute('data-srcset');

    if (!src) return;

    // Add loading class
    img.classList.add(this.options.loadingClass);

    // Create a temporary image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      img.src = src;
      if (srcset) img.srcset = srcset;
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
      img.classList.remove(this.options.loadingClass);
      img.classList.add('lazy-loaded');
      
      // Trigger fade-in animation
      img.style.animation = 'fadeIn 0.3s ease-in';
    };

    tempImg.onerror = () => {
      img.classList.remove(this.options.loadingClass);
      img.classList.add(this.options.errorClass);
      console.warn(`Failed to load image: ${src}`);
    };

    // Start loading
    if (srcset) tempImg.srcset = srcset;
    tempImg.src = src;
  }

  /**
   * Load iframe element
   * @param {HTMLIFrameElement} iframe - Iframe element
   */
  loadIframeElement(iframe) {
    const src = iframe.getAttribute('data-src');

    if (!src) return;

    iframe.classList.add(this.options.loadingClass);

    // Set src to trigger loading
    iframe.src = src;
    iframe.removeAttribute('data-src');
    iframe.classList.remove(this.options.loadingClass);
    iframe.classList.add('lazy-loaded');
  }

  /**
   * Load background image
   * @param {Element} element - Element with background image
   */
  loadBackgroundImage(element) {
    const bgUrl = element.getAttribute('data-bg');

    if (!bgUrl) return;

    element.classList.add(this.options.loadingClass);

    // Create temporary image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      element.style.backgroundImage = `url('${bgUrl}')`;
      element.removeAttribute('data-bg');
      element.classList.remove(this.options.loadingClass);
      element.classList.add('lazy-loaded');
      element.style.animation = 'fadeIn 0.3s ease-in';
    };

    tempImg.onerror = () => {
      element.classList.remove(this.options.loadingClass);
      element.classList.add(this.options.errorClass);
      console.warn(`Failed to load background image: ${bgUrl}`);
    };

    tempImg.src = bgUrl;
  }

  /**
   * Fallback: Load all images immediately (for browsers without IntersectionObserver)
   */
  loadAllImages() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.loadImgElement(img);
    });

    document.querySelectorAll('iframe[data-src]').forEach(iframe => {
      this.loadIframeElement(iframe);
    });

    document.querySelectorAll('[data-bg]').forEach(el => {
      this.loadBackgroundImage(el);
    });
  }

  /**
   * Manually trigger loading for an element
   * @param {Element} element - Element to load
   */
  loadNow(element) {
    this.loadImage(element);
  }

  /**
   * Add new elements to observer (for dynamically added content)
   * @param {NodeList|Array|Element} elements - Element(s) to observe
   */
  observe(elements) {
    if (!elements) return;

    if (elements instanceof Element) {
      this.observer?.observe(elements);
    } else if (elements instanceof NodeList || Array.isArray(elements)) {
      elements.forEach(el => {
        this.observer?.observe(el);
      });
    }
  }

  /**
   * Stop observing element(s)
   * @param {Element} element - Element to stop observing
   */
  unobserve(element) {
    this.observer?.unobserve(element);
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    this.observer?.disconnect();
  }
}

// Create global instance
const LazyLoad = new LazyLoader();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    LazyLoad.observeImages();
  });
}
