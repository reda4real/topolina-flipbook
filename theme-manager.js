/**
 * theme-manager.js
 * Handles Light/Dark mode toggling and persistence.
 */

const ThemeManager = {
    // Keys
    STORAGE_KEY: 'topolina_theme',
    DARK_THEME: 'dark',
    LIGHT_THEME: 'light',

    init: function () {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);

        if (savedTheme) {
            this.applyTheme(savedTheme);
        } else {
            // Default to dark for Flipbook (body #111), but maybe Light for Admin?
            // Actually, let's default to 'light' as the base CSS is often written that way, 
            // but Flipbook is naturally dark body. 
            // Let's stick to saved preference or default.
            // If no preference, we do nothing (let CSS defaults rule).
        }

        // Expose global toggler
        window.toggleTheme = () => this.toggle();

        // Update button state if it exists
        this.updateButtonState();
    },

    applyTheme: function (theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateButtonState();
    },

    toggle: function () {
        const current = document.documentElement.getAttribute('data-theme');
        // If current is 'dark', switch to 'light'. 
        // If current is null or 'light', switch to 'dark'.
        const newTheme = current === this.DARK_THEME ? this.LIGHT_THEME : this.DARK_THEME;
        this.applyTheme(newTheme);
    },

    updateButtonState: function () {
        const current = document.documentElement.getAttribute('data-theme');
        const isDark = current === this.DARK_THEME;

        // Find toggle buttons (class .theme-toggle-btn)
        const btns = document.querySelectorAll('.theme-toggle-btn');
        btns.forEach(btn => {
            if (isDark) {
                btn.innerHTML = '☀️ Light Mode';
                btn.classList.add('is-dark');
            } else {
                btn.innerHTML = '🌙 Dark Mode';
                btn.classList.remove('is-dark');
            }
        });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});
