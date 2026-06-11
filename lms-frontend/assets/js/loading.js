/* ============================================
   Loading State Management
   ============================================ */

class LoadingState {
  constructor() {
    this.activeLoaders = new Map();
    this.init();
  }

  /**
   * Initialize loading overlay
   */
  init() {
    // Create global loading overlay if it doesn't exist
    if (!document.getElementById('globalLoadingOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'globalLoadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-overlay-content">
          <div class="loading-overlay-spinner">
            <div class="loading-spinner lg"></div>
          </div>
          <p class="loading-overlay-text">Loading...</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }

  /**
   * Show global loading overlay
   */
  showOverlay(message = 'Loading...') {
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) {
      const text = overlay.querySelector('.loading-overlay-text');
      if (text) text.textContent = message;
      overlay.classList.add('active');
    }
  }

  /**
   * Hide global loading overlay
   */
  hideOverlay() {
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Show loading state on button
   * @param {Element|string} button - Button element or selector
   * @param {boolean} disabled - Whether to disable the button
   */
  showButtonLoading(button, disabled = true) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;
    if (!btn) return;

    // Store original text
    this.activeLoaders.set(btn, {
      originalText: btn.innerHTML,
      type: 'button'
    });

    btn.classList.add('is-loading');
    if (disabled) btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
  }

  /**
   * Hide loading state on button
   * @param {Element|string} button - Button element or selector
   */
  hideButtonLoading(button) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;
    if (!btn) return;

    btn.classList.remove('is-loading');
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');

    // Restore original text if stored
    const stored = this.activeLoaders.get(btn);
    if (stored && stored.originalText) {
      btn.innerHTML = stored.originalText;
      this.activeLoaders.delete(btn);
    }
  }

  /**
   * Show loading spinner in container
   * @param {Element|string} container - Container element or selector
   * @param {string} message - Optional loading message
   */
  showContainerLoading(container, message = '') {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    // Store original content
    this.activeLoaders.set(el, {
      originalContent: el.innerHTML,
      type: 'container'
    });

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner lg';
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 2rem;';
    wrapper.appendChild(spinner);
    
    if (message) {
      const text = document.createElement('p');
      text.style.cssText = 'color: #64748b; margin: 0;';
      text.textContent = message;
      wrapper.appendChild(text);
    }

    el.innerHTML = '';
    el.appendChild(wrapper);
    el.setAttribute('aria-busy', 'true');
  }

  /**
   * Hide loading state in container and restore content
   * @param {Element|string} container - Container element or selector
   */
  hideContainerLoading(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const stored = this.activeLoaders.get(el);
    if (stored && stored.originalContent) {
      el.innerHTML = stored.originalContent;
      this.activeLoaders.delete(el);
    }

    el.setAttribute('aria-busy', 'false');
  }

  /**
   * Show loading state on form inputs
   * @param {Element|string} form - Form element or selector
   */
  showFormLoading(form) {
    const formEl = typeof form === 'string' ? document.querySelector(form) : form;
    if (!formEl) return;

    formEl.classList.add('is-loading');
    const inputs = formEl.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      if (input.type !== 'hidden' && !input.classList.contains('btn')) {
        input.disabled = true;
      }
    });

    formEl.setAttribute('aria-busy', 'true');
  }

  /**
   * Hide loading state on form
   * @param {Element|string} form - Form element or selector
   */
  hideFormLoading(form) {
    const formEl = typeof form === 'string' ? document.querySelector(form) : form;
    if (!formEl) return;

    formEl.classList.remove('is-loading');
    const inputs = formEl.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      input.disabled = false;
    });

    formEl.setAttribute('aria-busy', 'false');
  }

  /**
   * Show table skeleton loader
   * @param {Element|string} table - Table element or selector
   * @param {number} rows - Number of skeleton rows to show
   * @param {number} columns - Number of columns
   */
  showTableLoading(table, rows = 5, columns = 4) {
    const tableEl = typeof table === 'string' ? document.querySelector(table) : table;
    if (!tableEl) return;

    // Store original content
    this.activeLoaders.set(tableEl, {
      originalContent: tableEl.innerHTML,
      type: 'table'
    });

    let skeletonHTML = '';
    for (let i = 0; i < rows; i++) {
      skeletonHTML += `
        <div class="skeleton-table-row" style="--columns: ${columns}">
          ${Array(columns).fill().map(() => `
            <div class="skeleton-table-cell">
              <div class="skeleton"></div>
            </div>
          `).join('')}
        </div>
      `;
    }

    const container = document.createElement('div');
    container.style.cssText = 'padding: 1rem;';
    container.innerHTML = skeletonHTML;

    tableEl.innerHTML = '';
    tableEl.appendChild(container);
    tableEl.setAttribute('aria-busy', 'true');
  }

  /**
   * Hide table skeleton loader and restore content
   * @param {Element|string} table - Table element or selector
   */
  hideTableLoading(table) {
    const tableEl = typeof table === 'string' ? document.querySelector(table) : table;
    if (!tableEl) return;

    const stored = this.activeLoaders.get(tableEl);
    if (stored && stored.originalContent) {
      tableEl.innerHTML = stored.originalContent;
      this.activeLoaders.delete(tableEl);
    }

    tableEl.setAttribute('aria-busy', 'false');
  }

  /**
   * Create and show a card skeleton loader
   * @returns {HTMLElement} - The skeleton card element
   */
  createCardSkeleton() {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-card-header">
        <div class="skeleton skeleton-card-avatar"></div>
        <div class="skeleton-card-title" style="flex: 1;">
          <div class="skeleton" style="height: 1rem; margin-bottom: 0.5rem;"></div>
          <div class="skeleton" style="height: 0.875rem; width: 70%;"></div>
        </div>
      </div>
      <div class="skeleton-card-content">
        <div class="skeleton" style="height: 1rem;"></div>
        <div class="skeleton" style="height: 1rem; width: 90%;"></div>
        <div class="skeleton" style="height: 1rem; width: 80%;"></div>
      </div>
    `;
    return card;
  }

  /**
   * Show multiple card skeletons in container
   * @param {Element|string} container - Container element or selector
   * @param {number} count - Number of cards to show
   */
  showCardSkeletons(container, count = 3) {
    const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
    if (!containerEl) return;

    // Store original content
    this.activeLoaders.set(containerEl, {
      originalContent: containerEl.innerHTML,
      type: 'cards'
    });

    containerEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      containerEl.appendChild(this.createCardSkeleton());
    }

    containerEl.setAttribute('aria-busy', 'true');
  }

  /**
   * Hide card skeletons and restore content
   * @param {Element|string} container - Container element or selector
   */
  hideCardSkeletons(container) {
    const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
    if (!containerEl) return;

    const stored = this.activeLoaders.get(containerEl);
    if (stored && stored.originalContent) {
      containerEl.innerHTML = stored.originalContent;
      this.activeLoaders.delete(containerEl);
    }

    containerEl.setAttribute('aria-busy', 'false');
  }

  /**
   * Utility: Wait for loading to complete
   * @param {Promise} promise - Promise to wait for
   * @param {Object} options - Options with ui element/message
   */
  async withLoading(promise, options = {}) {
    const { overlay = false, button = null, container = null, message = 'Loading...' } = options;

    try {
      if (overlay) this.showOverlay(message);
      if (button) this.showButtonLoading(button);
      if (container) this.showContainerLoading(container, message);

      const result = await promise;
      return result;
    } finally {
      if (overlay) this.hideOverlay();
      if (button) this.hideButtonLoading(button);
      if (container) this.hideContainerLoading(container);
    }
  }
}

// Create global instance
const Loading = new LoadingState();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Loading.init());
} else {
  Loading.init();
}
