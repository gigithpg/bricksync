const API_URL = 'https://script.google.com/macros/s/AKfycbxdSfR8XoEwxM-pvGWsxF33zVpTQ9QPZgDEpfjiRYNT0vGzHOm-buXXhPsOZVVYVPzOew/exec'; // Replace with your Apps Script web app URL

async function updateDashboard() {
  try {
    const response = await fetch(`${API_URL}?action=getCustomers`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const customers = await response.json();
    if (customers.error) {
      throw new Error(customers.error);
    }
    const totalCustomers = document.getElementById('totalCustomers');
    if (totalCustomers) {
      totalCustomers.textContent = customers.length;
    } else {
      console.warn('totalCustomers element not found');
    }
  } catch (error) {
    console.error('Error updating dashboard:', error.message, error.stack);
    const totalCustomers = document.getElementById('totalCustomers');
    if (totalCustomers) {
      totalCustomers.textContent = 'Error';
    }
  }
}

document.addEventListener('DOMContentLoaded', updateDashboard);