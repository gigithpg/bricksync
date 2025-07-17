// scripts/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  const totalCustomers = document.getElementById('totalCustomers');

  if (totalCustomers) {
    try {
      const response = await fetch(`${window.API_URL}?action=getCustomers`, {
        method: 'GET',
        mode: 'cors'
      });
      if (!response.ok) {
        const text = await response.text();
        console.log('Get customers response:', text);
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      }
      const text = await response.text();
      console.log('Get customers response:', text);
      const customers = JSON.parse(text);
      totalCustomers.textContent = customers.length;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      totalCustomers.textContent = 'Error: ' + error.message;
    }
  }
});