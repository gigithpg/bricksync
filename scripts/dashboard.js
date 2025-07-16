// scripts/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  const totalCustomers = document.getElementById('totalCustomers');

  if (totalCustomers) {
    try {
      const response = await fetch(`${window.API_URL}?action=getCustomers`, {
        method: 'GET',
        mode: 'cors'
      });
      const customers = await response.json();
      totalCustomers.textContent = customers.length;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      totalCustomers.textContent = 'Error';
    }
  }
});