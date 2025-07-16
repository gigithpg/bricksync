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
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  if (menuToggle && sidebar && mainContent) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      console.log('Sidebar toggled:', sidebar.classList.contains('active')); // Debug
      if (window.innerWidth <= 991) {
        mainContent.style.marginLeft = sidebar.classList.contains('active') ? '260px' : '0';
      }
    });

    // Initialize sidebar state based on screen size
    if (window.innerWidth <= 991) {
      sidebar.classList.remove('active');
      mainContent.style.marginLeft = '0';
    } else {
      sidebar.classList.add('active');
      mainContent.style.marginLeft = '260px';
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 991) {
        sidebar.classList.add('active');
        mainContent.style.marginLeft = '260px';
      } else {
        sidebar.classList.remove('active');
        mainContent.style.marginLeft = '0';
      }
    });
  } else {
    console.error('Menu toggle, sidebar, or main content not found');
  }
});