// scripts/main.js
const API_URL = 'https://script.google.com/macros/s/AKfycbxdSfR8XoEwxM-pvGWsxF33zVpTQ9QPZgDEpfjiRYNT0vGzHOm-buXXhPsOZVVYVPzOew/exec';

async function fetchCustomers() {
  try {
    const response = await fetch(`${API_URL}?action=getCustomers`);
    const data = await response.json();
    console.log('Customers:', data);
    // Display logic in Step 2
  } catch (error) {
    console.error('Error fetching customers:', error);
  }
}

window.onload = fetchCustomers;