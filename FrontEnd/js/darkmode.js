// Dark Mode - Works with existing header button
class DarkMode {
  constructor() {
    this.isDark = localStorage.getItem('darkMode') === 'true';
    this.init();
  }

  init() {
    // Apply saved dark mode preference on page load
    if (this.isDark) {
      document.body.classList.add('dark-mode');
    }
    
    console.log('Dark mode loaded: ' + (this.isDark ? 'ON' : 'OFF'));
  }
}

// Initialize dark mode on page load
document.addEventListener('DOMContentLoaded', function() {
  new DarkMode();
});
