// assets/js/theme.js
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // Sidebar toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.fixed-sidebar');
  const mainContent = document.querySelector('.main-content');

  if (menuToggle && sidebar && mainContent) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      // Adjust main content margin when sidebar toggles
      if (sidebar.classList.contains('active')) {
        mainContent.style.marginLeft = '260px';
      } else {
        mainContent.style.marginLeft = '0';
      }
    });

    // Ensure sidebar is hidden on mobile by default
    if (window.innerWidth <= 991) {
      sidebar.classList.remove('active');
      mainContent.style.marginLeft = '0';
    }

    // Handle window resize for responsive behavior
    window.addEventListener('resize', () => {
      if (window.innerWidth > 991) {
        sidebar.classList.add('active');
        mainContent.style.marginLeft = '260px';
      } else {
        sidebar.classList.remove('active');
        mainContent.style.marginLeft = '0';
      }
    });
  }
});